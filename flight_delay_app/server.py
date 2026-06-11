# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, Depends
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles
# pyrefly: ignore [missing-import]
from fastapi.responses import FileResponse
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
import uvicorn
# pyrefly: ignore [missing-import]
import joblib
import pandas as pd
import numpy as np
import requests
import math
import os
import json
from datetime import datetime

from database import engine, get_db
import models
import auth

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI(title="Flight Delay Predictor API")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants & Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(os.path.dirname(BASE_DIR), "flight_delay_model.joblib")
METADATA_PATH = os.path.join(BASE_DIR, "metadata.json")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Load Mappings and Model
print("Loading model and metadata...")
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Please train the model first.")

model_data = joblib.load(MODEL_PATH)
model = model_data['model']
carrier_map = model_data['mappings']['CARRIER_NAME']
time_blk_map = model_data['mappings']['DEP_TIME_BLK']

# Pre-reverse mappings for fast lookup
carrier_to_code = {v: k for k, v in carrier_map.items()}
time_blk_to_code = {v: k for k, v in time_blk_map.items()}

# Load Airports & Carriers metadata
if not os.path.exists(METADATA_PATH):
    raise FileNotFoundError(f"Metadata file not found at {METADATA_PATH}.")

with open(METADATA_PATH, "r", encoding="utf-8") as f:
    metadata = json.load(f)

airport_db = metadata["airports"]
carrier_list = metadata["carriers"]
print(f"Loaded {len(airport_db)} airports and {len(carrier_list)} carriers.")

# Helpers
def calculate_haversine(lat1, lon1, lat2, lon2):
    """Calculate the great-circle distance between two points on the Earth in miles."""
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    return c * 3956  # 3956 miles radius of Earth

def get_distance_group(distance_miles):
    """Map distance in miles to the BTS DISTANCE_GROUP definition (1 to 11)."""
    group = int(distance_miles // 250) + 1
    return min(11, max(1, group))

def get_time_block(time_str: str) -> str:
    """Convert 'HH:MM' time to a departure block string format, e.g., '1500-1559'."""
    try:
        dt = datetime.strptime(time_str, "%H:%M")
        hour = dt.hour
        if hour >= 0 and hour <= 5:
            return "0001-0559"
        else:
            return f"{hour:02d}00-{hour:02d}59"
    except Exception:
        return "0001-0559"

def fetch_weather(lat: float, lon: float, date_str: str):
    """
    Fetch weather forecast or historical data from Open-Meteo API.
    Converts metrics: Temp (C -> F), Precip (mm -> in), Snow (cm -> in), Wind (km/h -> mph).
    """
    url = f"https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "precipitation_sum,snowfall_sum,temperature_2m_max,windspeed_10m_max",
        "timezone": "auto",
        "start_date": date_str,
        "end_date": date_str
    }
    
    # Fallback default weather (moderate day)
    default_weather = {
        "prcp": 0.0,
        "snow": 0.0,
        "snwd": 0.0,
        "tmax": 65.0,  # 65°F
        "awnd": 8.0,   # 8 mph
        "is_fallback": True
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if "daily" in data:
                daily = data["daily"]
                # Convert units to match dataset
                temp_c = daily["temperature_2m_max"][0]
                precip_mm = daily["precipitation_sum"][0]
                snow_cm = daily["snowfall_sum"][0]
                wind_kmh = daily["windspeed_10m_max"][0]
                
                # Check for nulls and convert
                tmax_f = (temp_c * 9/5) + 32 if temp_c is not None else 65.0
                prcp_in = precip_mm / 25.4 if precip_mm is not None else 0.0
                snow_in = snow_cm / 2.54 if snow_cm is not None else 0.0
                awnd_mph = wind_kmh / 1.60934 if wind_kmh is not None else 8.0
                
                # Simple estimation for snow depth
                snwd_in = snow_in * 0.5 if snow_in > 0 else 0.0
                
                return {
                    "prcp": round(prcp_in, 4),
                    "snow": round(snow_in, 4),
                    "snwd": round(snwd_in, 4),
                    "tmax": round(tmax_f, 2),
                    "awnd": round(awnd_mph, 2),
                    "is_fallback": False
                }
    except Exception as e:
        print(f"Weather API error: {e}. Using fallback weather values.")
        
    return default_weather

# Pydantic Schemas
class PredictionRequest(BaseModel):
    start_airport: str
    end_airport: str
    carrier: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@app.get("/api/metadata")
async def get_metadata():
    """Returns the list of available airports and carriers to build UI selectors."""
    return {
        "airports": list(airport_db.keys()),
        "carriers": carrier_list
    }

@app.post("/api/signup", response_model=Token)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(name=user.name, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me")
async def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    return {"email": current_user.email, "name": current_user.name}

@app.get("/api/history")
async def get_search_history(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    history = db.query(models.SearchHistory).filter(models.SearchHistory.user_id == current_user.id).order_by(models.SearchHistory.timestamp.desc()).limit(3).all()
    return [{"start_airport": h.start_airport, "end_airport": h.end_airport, "carrier": h.carrier, "date": h.date, "time": h.time} for h in history]

@app.post("/api/predict")
async def predict_delay(req: PredictionRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # 0. Save Search History
    new_search = models.SearchHistory(
        user_id=current_user.id,
        start_airport=req.start_airport,
        end_airport=req.end_airport,
        carrier=req.carrier,
        date=req.date,
        time=req.time
    )
    db.add(new_search)
    db.commit()

    # 1. Resolve Airports Coordinates
    if req.start_airport not in airport_db:
        raise HTTPException(status_code=400, detail=f"Starting airport '{req.start_airport}' not found.")
    if req.end_airport not in airport_db:
        raise HTTPException(status_code=400, detail=f"Ending airport '{req.end_airport}' not found.")
        
    start_coords = airport_db[req.start_airport]
    end_coords = airport_db[req.end_airport]
    
    # 2. Calculate Distance Group
    distance_miles = calculate_haversine(
        start_coords["latitude"], start_coords["longitude"],
        end_coords["latitude"], end_coords["longitude"]
    )
    dist_group = get_distance_group(distance_miles)
    
    # 3. Parse Date Components
    try:
        dt = datetime.strptime(req.date, "%Y-%m-%d")
        month = dt.month
        day_of_week = dt.isoweekday() # Monday is 1, Sunday is 7
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")
        
    # 4. Map time to block
    time_blk = get_time_block(req.time)
    
    # 5. Get Real-Time Weather for Start Location
    weather = fetch_weather(start_coords["latitude"], start_coords["longitude"], req.date)
    
    # 6. Map Categorical Variables to trained codes
    carrier_code = carrier_to_code.get(req.carrier, 0)
    time_blk_code = time_blk_to_code.get(time_blk, 0)
    
    # 7. Build feature row DataFrame
    features_df = pd.DataFrame([{
        'MONTH': month,
        'DAY_OF_WEEK': day_of_week,
        'DISTANCE_GROUP': dist_group,
        'LATITUDE': start_coords["latitude"],
        'LONGITUDE': start_coords["longitude"],
        'PRCP': weather["prcp"],
        'SNOW': weather["snow"],
        'SNWD': weather["snwd"],
        'TMAX': weather["tmax"],
        'AWND': weather["awnd"],
        'CARRIER_NAME_CODE': carrier_code,
        'DEP_TIME_BLK_CODE': time_blk_code
    }])
    
    # 8. Predict Delay Probability
    try:
        prob = model.predict(features_df)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model execution error: {str(e)}")
        
    return {
        "success": True,
        "delay_probability": round(float(prob), 4),
        "is_delayed": bool(prob >= 0.5),
        "flight_info": {
            "distance_miles": round(distance_miles, 2),
            "distance_group": dist_group,
            "departure_block": time_blk,
            "month": month,
            "day_of_week": day_of_week
        },
        "weather": weather
    }

# Serve static files
@app.get("/")
async def read_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Static folder not found. Please verify the folder structure."}

@app.get("/app")
async def read_app():
    app_file = os.path.join(STATIC_DIR, "app.html")
    if os.path.exists(app_file):
        return FileResponse(app_file)
    return {"message": "App file not found."}

@app.get("/login")
async def read_login():
    login_file = os.path.join(STATIC_DIR, "login.html")
    if os.path.exists(login_file):
        return FileResponse(login_file)
    return {"message": "Login file not found."}

@app.get("/signup")
async def read_signup():
    signup_file = os.path.join(STATIC_DIR, "signup.html")
    if os.path.exists(signup_file):
        return FileResponse(signup_file)
    return {"message": "Signup file not found."}

# Mount static folder for CSS/JS assets
if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR), name="static")

if __name__ == "__main__":
    print("Starting FastAPI web server...")
    uvicorn.run(app, host="127.0.0.1", port=8000)

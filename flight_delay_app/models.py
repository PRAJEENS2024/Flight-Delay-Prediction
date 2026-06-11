from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="User")
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_airport = Column(String)
    end_airport = Column(String)
    carrier = Column(String)
    date = Column(String)
    time = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

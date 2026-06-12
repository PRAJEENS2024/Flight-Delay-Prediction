// ============================================================
// THEME ENGINE — IIFE runs immediately to prevent flash of wrong theme
// ============================================================
(function () {
    const saved = localStorage.getItem('aeropredict_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
})();

// Global function for password visibility toggle
function togglePasswordVisibility(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    }
}

// Apply a theme to the document and update button state
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aeropredict_theme', theme);

    // Update the tiny icon inside the sliding thumb
    const thumbIcon = document.getElementById('theme-icon');
    if (thumbIcon) {
        if (theme === 'light') {
            thumbIcon.className = 'fa-solid fa-sun';
            thumbIcon.style.fontSize = '8px';
        } else {
            thumbIcon.className = 'fa-solid fa-moon';
            thumbIcon.style.fontSize = '8px';
        }
    }
}

// Wire up theme toggle button — called after DOM is ready
function initThemeToggle() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    // Sync to saved preference on load
    const saved = localStorage.getItem('aeropredict_theme') || 'dark';
    applyTheme(saved);

    btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });
}

document.addEventListener('DOMContentLoaded', initThemeToggle);

// ============================================================
// METADATA DEFINITIONS & HELPERS
// ============================================================
const AIRPORT_CODE_MAP = {
    "Bagdogra Airport (Siliguri)": { code: "IXB", city: "Siliguri" },
    "Biju Patnaik International Airport (Bhubaneswar)": { code: "BBI", city: "Bhubaneswar" },
    "Birsa Munda Airport (Ranchi)": { code: "IXR", city: "Ranchi" },
    "Calicut International Airport (Kozhikode)": { code: "CCJ", city: "Kozhikode" },
    "Chandigarh International Airport (Chandigarh)": { code: "IXC", city: "Chandigarh" },
    "Chaudhary Charan Singh International Airport (Lucknow)": { code: "LKO", city: "Lucknow" },
    "Chennai International Airport (Chennai)": { code: "MAA", city: "Chennai" },
    "Chhatrapati Shivaji Maharaj International Airport (Mumbai)": { code: "BOM", city: "Mumbai" },
    "Cochin International Airport (Kochi)": { code: "COK", city: "Kochi" },
    "Coimbatore International Airport (Coimbatore)": { code: "CJB", city: "Coimbatore" },
    "Dehradun Airport (Dehradun)": { code: "DED", city: "Dehradun" },
    "Devi Ahilyabai Holkar Airport (Indore)": { code: "IDR", city: "Indore" },
    "Dr. Babasaheb Ambedkar International Airport (Nagpur)": { code: "NAG", city: "Nagpur" },
    "Goa International Airport (Dabolim)": { code: "GOI", city: "Goa" },
    "Imphal Airport (Imphal)": { code: "IMF", city: "Imphal" },
    "Indira Gandhi International Airport (Delhi)": { code: "DEL", city: "Delhi" },
    "Jaipur International Airport (Jaipur)": { code: "JAI", city: "Jaipur" },
    "Jammu Airport (Jammu)": { code: "IXJ", city: "Jammu" },
    "Jodhpur Airport (Jodhpur)": { code: "JDH", city: "Jodhpur" },
    "Kempegowda International Airport (Bangalore)": { code: "BLR", city: "Bangalore" },
    "Kushok Bakula Rimpochee Airport (Leh)": { code: "IXL", city: "Leh" },
    "Lal Bahadur Shastri International Airport (Varanasi)": { code: "VNS", city: "Varanasi" },
    "Lokpriya Gopinath Bordoloi International Airport (Guwahati)": { code: "GAU", city: "Guwahati" },
    "Madurai Airport (Madurai)": { code: "IXM", city: "Madurai" },
    "Mangaluru International Airport (Mangalore)": { code: "IXE", city: "Mangalore" },
    "Manohar International Airport (Mopa)": { code: "GOX", city: "Mopa" },
    "Netaji Subhash Chandra Bose International Airport (Kolkata)": { code: "CCU", city: "Kolkata" },
    "Patna Airport (Patna)": { code: "PAT", city: "Patna" },
    "Pune Airport (Pune)": { code: "PNQ", city: "Pune" },
    "Rajiv Gandhi International Airport (Hyderabad)": { code: "HYD", city: "Hyderabad" },
    "Rajkot Airport (Rajkot)": { code: "RAJ", city: "Rajkot" },
    "Sardar Vallabhbhai Patel International Airport (Ahmedabad)": { code: "AMD", city: "Ahmedabad" },
    "Sheikh ul-Alam International Airport (Srinagar)": { code: "SXR", city: "Srinagar" },
    "Shirdi Airport (Shirdi)": { code: "SAG", city: "Shirdi" },
    "Surat Airport (Surat)": { code: "STV", city: "Surat" },
    "Swami Vivekananda Airport (Raipur)": { code: "RPR", city: "Raipur" },
    "Tiruchirappalli International Airport (Trichy)": { code: "TRZ", city: "Trichy" },
    "Trivandrum International Airport (Thiruvananthapuram)": { code: "TRV", city: "Thiruvananthapuram" },
    "Vadodara Airport (Vadodara)": { code: "BDQ", city: "Vadodara" },
    "Visakhapatnam Airport (Visakhapatnam)": { code: "VTZ", city: "Visakhapatnam" }
};

function getAirportCode(fullName) {
    if (AIRPORT_CODE_MAP[fullName]) {
        return AIRPORT_CODE_MAP[fullName].code;
    }
    // Fallback: extract first letters of uppercase words inside brackets, or first 3 uppercase letters
    const match = fullName.match(/\(([^)]+)\)/);
    if (match) {
        return match[1].substring(0, 3).toUpperCase();
    }
    return fullName.substring(0, 3).toUpperCase();
}

function getAirportCity(fullName) {
    if (AIRPORT_CODE_MAP[fullName]) {
        return AIRPORT_CODE_MAP[fullName].city;
    }
    const match = fullName.match(/\(([^)]+)\)/);
    if (match) {
        return match[1];
    }
    return fullName.split(" ")[0];
}

const CARRIER_CODE_MAP = {
    "Air India": "AI",
    "Air India Express": "IX",
    "Akasa Air": "QP",
    "Alliance Air": "9I",
    "Fly91": "IC",
    "IndiGo": "6E",
    "SpiceJet": "SG",
    "Star Air": "S5",
    "Vistara": "UK"
};

const CARRIER_RATINGS = {
    "IndiGo": { score: 88.5, status: "Excellent", reliable: true },
    "Vistara": { score: 84.8, status: "Good", reliable: true },
    "Akasa Air": { score: 82.1, status: "Good", reliable: true },
    "Fly91": { score: 85.0, status: "Good", reliable: true },
    "Air India": { score: 76.2, status: "Moderate", reliable: false },
    "Star Air": { score: 74.5, status: "Moderate", reliable: false },
    "Air India Express": { score: 72.8, status: "Moderate", reliable: false },
    "Alliance Air": { score: 70.1, status: "Fair", reliable: false },
    "SpiceJet": { score: 67.4, status: "Poor", reliable: false }
};

const AIRPORT_CONGESTION_LEVELS = {
    "Indira Gandhi International Airport (Delhi)": { load: 78, level: "High", risk: "med" },
    "Chhatrapati Shivaji Maharaj International Airport (Mumbai)": { load: 82, level: "High", risk: "high" },
    "Kempegowda International Airport (Bangalore)": { load: 68, level: "Medium", risk: "med" },
    "Netaji Subhash Chandra Bose International Airport (Kolkata)": { load: 62, level: "Medium", risk: "med" },
    "Rajiv Gandhi International Airport (Hyderabad)": { load: 58, level: "Medium", risk: "low" },
    "Chennai International Airport (Chennai)": { load: 54, level: "Medium", risk: "low" },
    "Sardar Vallabhbhai Patel International Airport (Ahmedabad)": { load: 48, level: "Low", risk: "low" },
    "Pune Airport (Pune)": { load: 45, level: "Low", risk: "low" },
    "Goa International Airport (Dabolim)": { load: 38, level: "Low", risk: "low" },
    "Cochin International Airport (Kochi)": { load: 35, level: "Low", risk: "low" }
};

// ============================================================
// MAIN HANDLER
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("access_token");

    // ---- AUTH CHECK AND PAGE PROTECTION ----
    if (window.location.pathname === "/app") {
        if (!token) {
            window.location.href = "/login";
            return;
        }

        // Fetch user info
        fetch("/api/me", {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error("Invalid token");
            return res.json();
        })
        .then(data => {
            // Update name in multiple places if present
            const nameDisplay = document.getElementById("user-name-display");
            if (nameDisplay) {
                nameDisplay.textContent = data.name;
            }
            const avatarInitial = document.getElementById("user-avatar-initial");
            if (avatarInitial && data.name) {
                avatarInitial.textContent = data.name.charAt(0).toUpperCase();
            }
            // Bind user name to global state for boarding pass
            window.loggedInUserName = data.name;
        })
        .catch(() => {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        });
    }

    // Logout function
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        });
    }

    // Login Form Handler
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const errorDiv = document.getElementById("auth-error");
            
            try {
                const res = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Login failed");
                
                localStorage.setItem("access_token", data.access_token);
                window.location.href = "/app";
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.classList.remove("hidden");
            }
        });
    }

    // Signup Form Handler
    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById("name");
            const name = nameInput ? nameInput.value : "User";
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const errorDiv = document.getElementById("auth-error");
            
            try {
                const res = await fetch("/api/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Signup failed");
                
                localStorage.setItem("access_token", data.access_token);
                window.location.href = "/app";
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.classList.remove("hidden");
            }
        });
    }

    // FAQ Accordion Handler (Landing page helper)
    const faqQuestions = document.querySelectorAll(".faq-question");
    faqQuestions.forEach(q => {
        q.addEventListener("click", () => {
            const item = q.closest(".faq-item");
            const isActive = item.classList.contains("active");
            
            // close other items
            document.querySelectorAll(".faq-item").forEach(el => el.classList.remove("active"));
            
            // toggle current
            if (!isActive) {
                item.classList.add("active");
            }
        });
    });

    // Only run application specific logic if dashboard layout container is present
    const delayForm = document.getElementById("delay-form");
    if (!delayForm) return;

    // ============================================================
    // DASHBOARD NAVIGATION STATE
    // ============================================================
    const sidebarBtns = document.querySelectorAll(".sidebar-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    sidebarBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            
            // Update active button state
            sidebarBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Update active panel state
            tabPanels.forEach(panel => {
                panel.classList.remove("active");
                if (panel.id === targetTab) {
                    panel.classList.add("active");
                }
            });

            // Trigger simulated flight updates when live flight board is selected
            if (targetTab === "liveboard-tab") {
                renderLiveBoard();
            }
        });
    });

    // ============================================================
    // DYNAMIC FORECASTER DROP-DOWN INITIALIZATION
    // ============================================================
    const startAirportSelect = document.getElementById("start_airport");
    const endAirportSelect = document.getElementById("end_airport");
    const carrierSelect = document.getElementById("carrier");
    const loadingOverlay = document.getElementById("loading-overlay");
    const predictionSection = document.getElementById("prediction-section");
    const resultsSection = document.getElementById("results-section");
    const backBtn = document.getElementById("back-btn");

    // Loader step elements
    const steps = {
        coords: document.getElementById("step-coords"),
        weather: document.getElementById("step-weather"),
        distance: document.getElementById("step-distance"),
        model: document.getElementById("step-model"),
    };

    // Set default date to today
    const dateInput = document.getElementById("date");
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    dateInput.min = today; // Prevent selecting past dates

    // Set default time to current time
    const timeInput = document.getElementById("time");
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    timeInput.value = `${currentHours}:${currentMinutes}`;

    let airportsList = [];
    let carriersList = [];

    // Fetch Metadata and Populate Dropdowns
    async function loadMetadata() {
        try {
            const response = await fetch("/api/metadata");
            if (!response.ok) throw new Error("Failed to fetch metadata.");
            const data = await response.json();

            airportsList = data.airports;
            carriersList = data.carriers;

            // Populate airports
            data.airports.forEach(airport => {
                const optStart = document.createElement("option");
                optStart.value = airport;
                optStart.textContent = airport;
                startAirportSelect.appendChild(optStart);

                const optEnd = document.createElement("option");
                optEnd.value = airport;
                optEnd.textContent = airport;
                endAirportSelect.appendChild(optEnd);
            });

            // Populate carriers
            data.carriers.forEach(carrier => {
                const opt = document.createElement("option");
                opt.value = carrier;
                opt.textContent = carrier;
                carrierSelect.appendChild(opt);
            });

            // Once metadata is loaded, let's pre-render Analytics values
            renderAnalytics();
            initLiveBoardSimulator();
        } catch (error) {
            console.error("Error loading dropdown options:", error);
            alert("Error loading metadata from server. Please ensure the backend is running.");
        }
    }

    // Fetch and render history
    async function loadHistory() {
        try {
            const response = await fetch("/api/history", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) return;
            const history = await response.json();
            
            const historyList = document.getElementById("history-list");
            if (!historyList) return;
            
            if (history.length === 0) {
                historyList.innerHTML = '<p class="history-empty" style="color: var(--text-muted); text-align: center; padding: 1rem;">No recent searches found.</p>';
                return;
            }
            
            historyList.innerHTML = "";
            history.forEach(item => {
                const card = document.createElement("div");
                card.className = "history-card";
                card.innerHTML = `
                    <div class="history-route" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem; font-size: 0.95rem;">
                        <div style="flex: 1; text-align: left; line-height: 1.3;">
                            ${getAirportCity(item.start_airport)} (${getAirportCode(item.start_airport)})
                        </div>
                        <div style="padding: 0 0.5rem; color: var(--primary); display: flex; align-items: center;">
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                        <div style="flex: 1; text-align: left; line-height: 1.3;">
                            ${getAirportCity(item.end_airport)} (${getAirportCode(item.end_airport)})
                        </div>
                    </div>
                    <div class="history-details" style="display: flex; flex-direction: column; gap: 0.4rem;">
                        <span><i class="fa-solid fa-ticket"></i> ${item.carrier}</span>
                        <span><i class="fa-regular fa-calendar"></i> ${item.date} at ${item.time}</span>
                    </div>
                `;
                
                card.addEventListener("click", () => {
                    startAirportSelect.value = item.start_airport;
                    endAirportSelect.value = item.end_airport;
                    carrierSelect.value = item.carrier;
                    dateInput.value = item.date;
                    timeInput.value = item.time;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                
                historyList.appendChild(card);
            });
        } catch (e) {
            console.error("Error loading history:", e);
        }
    }

    // Initialize dropdowns and load history
    loadMetadata().then(() => {
        loadHistory();
    });

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Reset loader steps to pending
    function resetLoader() {
        Object.values(steps).forEach(step => {
            step.className = "pending";
            step.querySelector("i").className = "fa-solid fa-circle-notch";
        });
    }

    // Set loader step state
    function updateStep(stepKey, status) {
        const step = steps[stepKey];
        if (!step) return;
        
        if (status === "active") {
            step.className = "active";
            step.querySelector("i").className = "fa-solid fa-circle-notch fa-spin";
        } else if (status === "done") {
            step.className = "done";
            step.querySelector("i").className = "fa-solid fa-check";
        }
    }

    // ============================================================
    // SUBMISSION & PREDICTION PIPELINE
    // ============================================================
    delayForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const start_airport = startAirportSelect.value;
        const end_airport = endAirportSelect.value;
        const carrier = carrierSelect.value;
        const date = dateInput.value;
        const time = timeInput.value;

        if (start_airport === end_airport) {
            alert("Starting airport and Ending airport cannot be the same!");
            return;
        }

        // Show loading screen and animate steps
        resetLoader();
        loadingOverlay.classList.remove("hidden");

        let predictionData = null;
        let fetchError = null;

        // Perform the API request concurrently with visual step progression
        const fetchPromise = fetch("/api/predict", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ start_airport, end_airport, carrier, date, time })
        })
        .then(res => {
            if (!res.ok) throw new Error("Server prediction error");
            return res.json();
        })
        .then(data => { predictionData = data; })
        .catch(err => { fetchError = err; });

        // Step 1 animation
        updateStep("coords", "active");
        await sleep(600);
        updateStep("coords", "done");

        // Step 2 animation
        updateStep("weather", "active");
        await sleep(800);
        updateStep("weather", "done");

        // Step 3 animation
        updateStep("distance", "active");
        await sleep(600);
        updateStep("distance", "done");

        // Step 4 animation
        updateStep("model", "active");
        
        // Wait for both the artificial delay and the actual fetch request to complete
        await Promise.all([fetchPromise, sleep(600)]);
        updateStep("model", "done");

        loadingOverlay.classList.add("hidden");

        if (fetchError || !predictionData) {
            alert("Error running prediction. Make sure the server model is trained and active.");
            return;
        }

        // Render results
        displayResults(predictionData, start_airport, end_airport);
        
        // Refresh history
        loadHistory();
    });

    // Display Results
    function displayResults(data, start, end) {
        // Toggle view
        predictionSection.classList.add("hidden");
        const historySection = document.getElementById("history-section");
        if (historySection) historySection.classList.add("hidden");
        resultsSection.classList.remove("hidden");

        // Populate current search details
        document.getElementById("res-start-airport").textContent = start;
        document.getElementById("res-end-airport").textContent = end;
        document.getElementById("res-date").textContent = document.getElementById("date").value;
        document.getElementById("res-time").textContent = document.getElementById("time").value;
        document.getElementById("res-carrier").textContent = document.getElementById("carrier").value;

        const prob = data.delay_probability;
        const percent = (prob * 100).toFixed(1);
        const deg = prob * 360;

        // Update Gauge Circular styling
        const root = document.documentElement;
        root.style.setProperty("--gauge-deg", `${deg}deg`);

        const gaugeFill = document.getElementById("gauge-fill");
        const gaugeVal = document.getElementById("gauge-value");
        const riskCategory = document.getElementById("risk-category");
        const riskDesc = document.getElementById("risk-desc");

        gaugeVal.textContent = `${percent}%`;

        // Determine Risk Profile styling
        let riskText = "Low Delay Risk";
        let riskClass = "risk-low";
        if (prob < 0.20) {
            root.style.setProperty("--risk-color", "#10b981");
            riskText = "Low Delay Risk";
            riskClass = "risk-low";
            riskDesc.textContent = `AeroPredict indicates high confidence that your flight from ${getAirportCity(start)} will depart on schedule.`;
        } else if (prob >= 0.20 && prob < 0.50) {
            root.style.setProperty("--risk-color", "#f59e0b");
            riskText = "Medium Delay Risk";
            riskClass = "risk-med";
            riskDesc.textContent = `There is a moderate chance of departure delay. Keep an eye on flight scheduling updates.`;
        } else {
            root.style.setProperty("--risk-color", "#ef4444");
            riskText = "High Delay Risk";
            riskClass = "risk-high";
            riskDesc.textContent = `Significant warning signs detected. We strongly suggest arriving at the airport early and preparing for potential boarding delays.`;
        }

        riskCategory.textContent = riskText;
        riskCategory.className = riskClass;

        // Update details card values
        document.getElementById("res-distance").textContent = `${data.flight_info.distance_miles.toLocaleString()} miles`;
        document.getElementById("res-dist-group").textContent = `Group ${data.flight_info.distance_group} (out of 11)`;
        
        // Update weather cards
        document.getElementById("res-tmax").textContent = `${data.weather.tmax} °F`;
        document.getElementById("res-wind").textContent = `${data.weather.awnd} mph`;
        document.getElementById("res-prcp").textContent = `${data.weather.prcp} in`;
        document.getElementById("res-snow").textContent = `${data.weather.snow} in`;

        // Toggle fallback warning note
        const fallbackNote = document.getElementById("weather-fallback-note");
        if (data.weather.is_fallback) {
            fallbackNote.classList.remove("hidden");
        } else {
            fallbackNote.classList.add("hidden");
        }

        // ============================================================
        // ADDITIONAL DYNAMIC VISUALIZATIONS (PREMIUM)
        // ============================================================
        
        // 1. Airport Codes for Route Visualizer
        const originCode = getAirportCode(start);
        const destCode = getAirportCode(end);
        document.getElementById("route-start-code").textContent = originCode;
        document.getElementById("route-end-code").textContent = destCode;

        // 2. Flight Duration Calculation (Estimated based on distance)
        const distanceMiles = data.flight_info.distance_miles;
        const speedMph = 480; // average cruise speed
        const taxiTimeMins = 35; // take-off and landing taxi average
        const estimatedMins = Math.round((distanceMiles / speedMph) * 60 + taxiTimeMins);
        const hours = Math.floor(estimatedMins / 60);
        const mins = estimatedMins % 60;
        const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;
        document.getElementById("res-duration").textContent = durationStr;

        // 3. Risk Factor Breakdowns (Independently computed/modeled on client)
        const carrierVal = document.getElementById("res-carrier").textContent;
        const depTime = document.getElementById("res-time").textContent;
        const depHour = parseInt(depTime.split(":")[0]);

        // Weather Factor Calculation
        const rainFactor = Math.min(100, Math.round(data.weather.prcp * 250));
        const windFactor = Math.min(100, Math.round(data.weather.awnd * 4));
        const weatherPercentage = Math.max(10, Math.min(95, Math.round(rainFactor * 0.6 + windFactor * 0.4)));

        // Carrier Factor Calculation
        const carrierReliability = CARRIER_RATINGS[carrierVal] ? CARRIER_RATINGS[carrierVal].score : 80;
        const carrierPercentage = Math.round(100 - carrierReliability);

        // Time Slot congestion: Rush hour blocks are afternoon/evening (15:00 to 21:00)
        let timePercentage = 25;
        if (depHour >= 8 && depHour < 12) timePercentage = 45; // morning rush
        else if (depHour >= 12 && depHour < 16) timePercentage = 55;
        else if (depHour >= 16 && depHour < 21) timePercentage = 85; // peak rush
        else if (depHour >= 21) timePercentage = 35; // late evening

        // Day of Week Factor
        const weekdayVal = data.flight_info.day_of_week;
        let dayPercentage = 20;
        if (weekdayVal === 5 || weekdayVal === 7) dayPercentage = 75; // Friday, Sunday rush
        else if (weekdayVal === 1 || weekdayVal === 6) dayPercentage = 50; // Monday, Saturday
        else dayPercentage = 30; // Mid-week

        // Render Factors Progress Bars
        updateFactorUI("factor-weather-val", "factor-weather-fill", weatherPercentage, "Weather Index");
        updateFactorUI("factor-carrier-val", "factor-carrier-fill", carrierPercentage, "Carrier Risk");
        updateFactorUI("factor-time-val", "factor-time-fill", timePercentage, "Slot Traffic");
        updateFactorUI("factor-day-val", "factor-day-fill", dayPercentage, "Day Load");

        // Helper for factor updating
        function updateFactorUI(textId, fillId, val, factorName) {
            const txt = document.getElementById(textId);
            const fill = document.getElementById(fillId);
            if (!txt || !fill) return;

            fill.style.width = `${val}%`;
            
            let level = "Low";
            fill.className = "factor-progress-fill low";
            if (val >= 30 && val < 60) {
                level = "Moderate";
                fill.className = "factor-progress-fill med";
            } else if (val >= 60) {
                level = "Critical";
                fill.className = "factor-progress-fill high";
            }
            txt.textContent = `${level} (${val}%)`;
        }

        // 4. Digital Boarding Pass Assembly
        const carrierCode = CARRIER_CODE_MAP[carrierVal] || "XX";
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        const flightNumber = `${carrierCode}-${randomNum}`;

        document.getElementById("pass-airline-name").innerHTML = `<i class="fa-solid fa-plane-departure"></i> <span>${carrierVal}</span>`;
        document.getElementById("pass-flight-number").textContent = flightNumber;
        document.getElementById("pass-origin-code").textContent = originCode;
        document.getElementById("pass-origin-name").textContent = getAirportCity(start);
        document.getElementById("pass-dest-code").textContent = destCode;
        document.getElementById("pass-dest-name").textContent = getAirportCity(end);

        // Fetch User profile name dynamically or default
        const passengerName = window.loggedInUserName || "User Account";
        document.getElementById("pass-passenger-name").textContent = passengerName;
        document.getElementById("pass-date").textContent = document.getElementById("res-date").textContent;
        document.getElementById("pass-time").textContent = document.getElementById("res-time").textContent;

        const riskStamp = document.getElementById("pass-risk-stamp");
        const stubBadge = document.getElementById("pass-stub-badge");
        riskStamp.textContent = riskText.replace(" Delay Risk", "");
        stubBadge.textContent = riskText;

        riskStamp.className = `pass-risk-stamp ${riskClass}`;
        stubBadge.className = `stub-risk-badge ${riskClass}`;

        document.getElementById("pass-stub-route").textContent = `${originCode} - ${destCode}`;
        document.getElementById("pass-stub-flight").textContent = flightNumber;

        // Generate barcode lines
        const barcodeContainer = document.getElementById("pass-barcode");
        barcodeContainer.innerHTML = "";
        for (let i = 0; i < 40; i++) {
            const width = Math.random() > 0.4 ? "3px" : "1px";
            const opacity = Math.random() > 0.15 ? "1" : "0.3";
            const bar = document.createElement("div");
            bar.className = "barcode-bar";
            bar.style.width = width;
            bar.style.opacity = opacity;
            barcodeContainer.appendChild(bar);
        }
    }

    // Back button handler
    backBtn.addEventListener("click", () => {
        resultsSection.classList.add("hidden");
        predictionSection.classList.remove("hidden");
        const historySection = document.getElementById("history-section");
        if (historySection) historySection.classList.remove("hidden");
    });

    // ============================================================
    // AIRPORT & CARRIER ANALYTICS RENDERER
    // ============================================================
    function renderAnalytics() {
        const carrierListContainer = document.getElementById("carrier-stats-list");
        const airportListContainer = document.getElementById("airport-stats-list");
        if (!carrierListContainer || !airportListContainer) return;

        // Render carriers stats
        carrierListContainer.innerHTML = "";
        let carrierIdx = 1;
        Object.entries(CARRIER_RATINGS)
            .sort((a, b) => b[1].score - a[1].score)
            .forEach(([name, meta]) => {
                const item = document.createElement("div");
                item.className = "stats-card-item";
                item.innerHTML = `
                    <div class="stats-card-left">
                        <span class="stats-rank">#${carrierIdx++}</span>
                        <div class="stats-info">
                            <span class="stats-name">${name}</span>
                            <span class="stats-sub">${meta.status} Reliability Index</span>
                        </div>
                    </div>
                    <div class="stats-metric">
                        <span class="stats-value ${meta.reliable ? 'reliable' : 'unreliable'}">${meta.score}%</span>
                        <span class="stats-sub">On-Time Rate</span>
                    </div>
                `;
                carrierListContainer.appendChild(item);
            });

        // Render airports stats
        airportListContainer.innerHTML = "";
        let airportIdx = 1;
        Object.entries(AIRPORT_CONGESTION_LEVELS)
            .sort((a, b) => b[1].load - a[1].load)
            .forEach(([name, meta]) => {
                const item = document.createElement("div");
                item.className = "stats-card-item";
                
                let riskText = "Low Delay Congestion";
                let valColor = "reliable";
                if (meta.risk === "med") {
                    riskText = "Moderate Congestion";
                    valColor = "reliable";
                } else if (meta.risk === "high") {
                    riskText = "Critical Load Level";
                    valColor = "unreliable";
                }

                item.innerHTML = `
                    <div class="stats-card-left">
                        <span class="stats-rank">#${airportIdx++}</span>
                        <div class="stats-info">
                            <span class="stats-name">${getAirportCity(name)} (${getAirportCode(name)})</span>
                            <span class="stats-sub">${riskText}</span>
                        </div>
                    </div>
                    <div class="stats-metric">
                        <span class="stats-value ${valColor}">${meta.load}%</span>
                        <span class="stats-sub">Traffic Density</span>
                    </div>
                `;
                airportListContainer.appendChild(item);
            });
    }

    // ============================================================
    // LIVE FLIGHT DEPARTURES SCHEDULE SIMULATOR
    // ============================================================
    let simulatedFlights = [];

    function initLiveBoardSimulator() {
        if (airportsList.length === 0 || carriersList.length === 0) return;

        // Generate baseline flights (around 12 flights)
        simulatedFlights = [];
        for (let i = 0; i < 15; i++) {
            simulatedFlights.push(generateRandomSimulatedFlight(i));
        }

        // Run simulation update clock every 10 seconds (move some states, add new flights)
        setInterval(() => {
            updateSimulatedFlights();
        }, 12000);
    }

    function generateRandomSimulatedFlight(index, specificTime = null) {
        // Pick random origin and destination
        const oIdx = Math.floor(Math.random() * airportsList.length);
        let dIdx = Math.floor(Math.random() * airportsList.length);
        while (oIdx === dIdx) {
            dIdx = Math.floor(Math.random() * airportsList.length);
        }

        const origin = airportsList[oIdx];
        const dest = airportsList[dIdx];
        
        const carrier = carriersList[Math.floor(Math.random() * carriersList.length)];
        const carrierCode = CARRIER_CODE_MAP[carrier] || "XX";
        const flightNum = `${carrierCode}-${Math.floor(Math.random() * 900) + 100}`;

        // Scheduled time
        let timeStr = "";
        if (specificTime) {
            timeStr = specificTime;
        } else {
            const h = Math.floor(Math.random() * 24);
            const m = Math.random() > 0.5 ? "30" : "00";
            timeStr = `${String(h).padStart(2, '0')}:${m}`;
        }

        // Calculate a random baseline risk based on carrier score
        const carrierReliability = CARRIER_RATINGS[carrier] ? CARRIER_RATINGS[carrier].score : 80;
        const baselineRisk = Math.round(100 - carrierReliability + (Math.random() * 25 - 10));
        const finalRisk = Math.max(5, Math.min(95, baselineRisk));

        // Status
        let status = "ON TIME";
        if (finalRisk > 55) {
            status = "DELAYED";
        } else if (index % 4 === 0) {
            status = "BOARDING";
        } else if (index % 12 === 0) {
            status = "CANCELLED";
        }

        return {
            flightNum,
            carrier,
            originCode: getAirportCode(origin),
            originCity: getAirportCity(origin),
            destCode: getAirportCode(dest),
            destCity: getAirportCity(dest),
            time: timeStr,
            risk: finalRisk,
            status: status
        };
    }

    function updateSimulatedFlights() {
        // 1. Move some "BOARDING" flights to departed (remove them)
        // 2. Transition some "ON TIME" flights to "BOARDING" or "DELAYED"
        // 3. Add 1-2 new flights at the bottom
        simulatedFlights = simulatedFlights.map(f => {
            if (f.status === "BOARDING" && Math.random() > 0.6) {
                // Departed! replace it with a fresh upcoming flight
                const now = new Date();
                const departureHour = (now.getHours() + 2) % 24;
                const departureMin = now.getMinutes() > 30 ? "00" : "30";
                return generateRandomSimulatedFlight(Math.floor(Math.random() * 100), `${String(departureHour).padStart(2, '0')}:${departureMin}`);
            }
            if (f.status === "ON TIME" && f.risk > 40 && Math.random() > 0.7) {
                f.status = "DELAYED";
            }
            if (f.status === "ON TIME" && f.risk < 40 && Math.random() > 0.8) {
                f.status = "BOARDING";
            }
            return f;
        });

        // Re-render live board table if that tab is active
        const liveBoardPanel = document.getElementById("liveboard-tab");
        if (liveBoardPanel && liveBoardPanel.classList.contains("active")) {
            renderLiveBoard();
        }
    }

    // Search and Filter handler for Live Departures Board
    const liveSearchInput = document.getElementById("live-board-search");
    const liveFilterButtons = document.querySelectorAll(".status-tab");
    let activeFilter = "all";

    if (liveSearchInput) {
        liveSearchInput.addEventListener("input", () => renderLiveBoard());
    }

    liveFilterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            liveFilterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeFilter = btn.getAttribute("data-filter");
            renderLiveBoard();
        });
    });

    function renderLiveBoard() {
        const tbody = document.getElementById("live-board-tbody");
        if (!tbody) return;

        const searchQuery = liveSearchInput ? liveSearchInput.value.toLowerCase().trim() : "";

        tbody.innerHTML = "";

        // Filter flights
        const filteredFlights = simulatedFlights.filter(f => {
            // Filter by Status Tab
            if (activeFilter === "on-time" && f.status !== "ON TIME") return false;
            if (activeFilter === "delayed" && f.status !== "DELAYED") return false;
            if (activeFilter === "boarding" && f.status !== "BOARDING") return false;

            // Search query match
            if (searchQuery !== "") {
                const matchCity = f.destCity.toLowerCase().includes(searchQuery) || f.originCity.toLowerCase().includes(searchQuery);
                const matchCode = f.destCode.toLowerCase().includes(searchQuery) || f.originCode.toLowerCase().includes(searchQuery);
                const matchFlight = f.flightNum.toLowerCase().includes(searchQuery);
                const matchCarrier = f.carrier.toLowerCase().includes(searchQuery);
                return matchCity || matchCode || matchFlight || matchCarrier;
            }

            return true;
        });

        if (filteredFlights.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching simulated departures found.</td></tr>`;
            return;
        }

        // Render filtered flights rows
        filteredFlights.forEach(f => {
            let badgeClass = "on-time";
            if (f.status === "DELAYED") badgeClass = "delayed";
            else if (f.status === "BOARDING") badgeClass = "boarding";
            else if (f.status === "CANCELLED") badgeClass = "cancelled";

            let riskColor = "risk-low";
            if (f.risk >= 20 && f.risk < 50) riskColor = "risk-med";
            else if (f.risk >= 50) riskColor = "risk-high";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td style="font-weight: 700; color: var(--primary);">${f.flightNum}</td>
                <td><i class="fa-solid fa-plane" style="font-size: 0.8rem; margin-right: 0.5rem; opacity: 0.5;"></i> ${f.carrier}</td>
                <td style="line-height: 1.3;">
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${f.originCity} (${f.originCode})</span>
                    <i class="fa-solid fa-right-long" style="font-size: 0.75rem; margin: 0 0.4rem; color: var(--primary); opacity: 0.5;"></i>
                    <strong>${f.destCity} (${f.destCode})</strong>
                </td>
                <td style="font-weight: 600;"><i class="fa-regular fa-clock" style="margin-right: 0.3rem; opacity: 0.5;"></i> ${f.time}</td>
                <td>
                    <span class="${riskColor}" style="font-weight: 700; font-size: 0.9rem;">${f.risk}%</span>
                </td>
                <td>
                    <span class="status-badge ${badgeClass}"><span class="status-dot"></span>${f.status}</span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

});

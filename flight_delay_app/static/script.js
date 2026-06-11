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

document.addEventListener("DOMContentLoaded", () => {
    // ---- AUTH LOGIC ----
    const token = localStorage.getItem("access_token");

    // Protect /app page and fetch user info
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
            const nameDisplay = document.getElementById("user-name-display");
            if (nameDisplay) {
                nameDisplay.textContent = data.name;
            }
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

    // Only run prediction logic if the form exists (on /app)
    const delayForm = document.getElementById("delay-form");
    if (!delayForm) return;


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

    // 1. Fetch Metadata and Populate Dropdowns
    async function loadMetadata() {
        try {
            const response = await fetch("/api/metadata");
            if (!response.ok) throw new Error("Failed to fetch metadata.");
            const data = await response.json();

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
                    <div class="history-route" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; font-size: 0.95rem;">
                        <div style="flex: 1; text-align: left; line-height: 1.3;">
                            ${item.start_airport.replace(' (', '<br>(')}
                        </div>
                        <div style="padding: 0 0.5rem; color: var(--primary); display: flex; align-items: center;">
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                        <div style="flex: 1; text-align: left; line-height: 1.3;">
                            ${item.end_airport.replace(' (', '<br>(')}
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

    // Initialize data
    loadMetadata().then(() => {
        loadHistory();
    });

    // Helper to sleep for loading animations
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

    // 2. Form Submission Handler
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

    // 3. Display Results
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
        if (prob < 0.20) {
            root.style.setProperty("--risk-color", "#10b981");
            riskCategory.textContent = "Low Delay Risk";
            riskCategory.className = "risk-low";
            riskDesc.textContent = `AeroPredict indicates high confidence that your flight from ${start} will depart on schedule.`;
        } else if (prob >= 0.20 && prob < 0.50) {
            root.style.setProperty("--risk-color", "#f59e0b");
            riskCategory.textContent = "Medium Delay Risk";
            riskCategory.className = "risk-med";
            riskDesc.textContent = `There is a moderate chance of departure delay. Keep an eye on flight scheduling updates.`;
        } else {
            root.style.setProperty("--risk-color", "#ef4444");
            riskCategory.textContent = "High Delay Risk";
            riskCategory.className = "risk-high";
            riskDesc.textContent = `Significant warning signs detected. We strongly suggest arriving at the airport early and preparing for potential boarding delays.`;
        }

        // Update details cards
        document.getElementById("res-distance").textContent = `${data.flight_info.distance_miles.toLocaleString()} miles`;
        document.getElementById("res-dist-group").textContent = `Group ${data.flight_info.distance_group} (out of 11)`;
        document.getElementById("res-dep-block").textContent = data.flight_info.departure_block;

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
    }

    // 4. Back button handler
    backBtn.addEventListener("click", () => {
        resultsSection.classList.add("hidden");
        predictionSection.classList.remove("hidden");
        const historySection = document.getElementById("history-section");
        if (historySection) historySection.classList.remove("hidden");
    });
});

// ==========================================
// 1. FIREBASE CONFIG & INIT
// ==========================================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace if needed, otherwise existing keys usually work if public
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize only if not already running
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ==========================================
// 2. VARIABLES & ELEMENTS
// ==========================================
let currentMobileWeek = 0; // 0 = Week 1
let currentUserEmail = "";
let programData = []; // Stores the calculated weeks

const inputs = {
    squat: document.getElementById('squatInput'),
    bench: document.getElementById('benchInput'),
    deadlift: document.getElementById('deadliftInput'),
    ohp: document.getElementById('ohpInput')
};

const dashboardGrid = document.getElementById('dashboardGrid');
const totalDisplay = document.getElementById('currentTotal');
const mobileWeekLabel = document.getElementById('mobileWeekLabel');
const loginBtn = document.getElementById('emailLoginBtn');

// ==========================================
// 3. MAIN LOGIC (Run on Load)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Listen for input changes (Auto-Calculate)
    Object.values(inputs).forEach(input => {
        if(input) {
            input.addEventListener('input', () => {
                calculateProgram();
                saveUserData();
            });
        }
    });

    // 2. Login Button Listener
    if(loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('emailInput').value.trim().toLowerCase();
            if(email) {
                currentUserEmail = email;
                await loadUserData(email);
                document.getElementById('authModal').style.display = 'none';
                alert("Loaded: " + email);
            }
        });
    }

    // 3. Initial Calculation (To show zeros instead of blank)
    calculateProgram();
});

// ==========================================
// 4. PROGRAM CALCULATION (Base Wave)
// ==========================================
function calculateProgram() {
    // Get numbers safely (default to 0)
    const s = parseFloat(inputs.squat.value) || 0;
    const b = parseFloat(inputs.bench.value) || 0;
    const d = parseFloat(inputs.deadlift.value) || 0;
    const o = parseFloat(inputs.ohp.value) || 0;

    // Update Header Total
    if(totalDisplay) totalDisplay.innerText = (s + b + d + o);

    // The Schedule (10 Weeks + 2 Deloads)
    const schedule = [
        { name: "Week 1", p: 0.65, reps: "3x8" },
        { name: "Week 2", p: 0.70, reps: "3x8" },
        { name: "Week 3", p: 0.75, reps: "3x6" },
        { name: "Week 4", p: 0.80, reps: "3x5" },
        { name: "Week 5", p: 0.85, reps: "3x4" },
        { name: "Week 6", p: 0.90, reps: "3x3" },
        { name: "Deload 1", p: 0.50, reps: "3x10 (Flush)", isDeload: true }, 
        { name: "Deload 2", p: 0.51, reps: "3x10 (Pump)", isDeload: true }, // +2% ish load
        { name: "Week 7", p: 0.925, reps: "3x2" },
        { name: "Week 8", p: 0.95, reps: "2x2" },
        { name: "Week 9", p: 0.975, reps: "2x1" },
        { name: "Week 10 (Peak)", p: 1.0, reps: "1x1 (PR)" }
    ];

    // Generate Data
    programData = schedule.map(week => {
        return {
            name: week.name,
            reps: week.reps,
            squat: round5(s * week.p),
            bench: round5(b * week.p),
            deadlift: round5(d * week.p),
            ohp: round5(o * week.p),
            isDeload: week.isDeload || false
        };
    });

    renderGrid();
}

// ==========================================
// 5. RENDERING THE GRID
// ==========================================
function renderGrid() {
    if(!dashboardGrid) return;
    dashboardGrid.innerHTML = ""; // Clear current

    programData.forEach((week, index) => {
        // Create Card
        const card = document.createElement('div');
        
        // --- MOBILE VISIBILITY LOGIC ---
        // If screen is small (<768px), hide all cards except the current week
        const isMobile = window.innerWidth <= 768;
        if (isMobile && index !== currentMobileWeek) {
            card.style.display = 'none';
        } else {
            card.style.display = 'block';
        }
        
        // Style the card
        card.style.background = "#1e1e1e";
        card.style.border = "1px solid #333";
        card.style.borderRadius = "8px";
        card.style.padding = "15px";
        card.style.marginBottom = "15px";

        // Card HTML
        card.innerHTML = `
            <h3 style="color:${week.isDeload ? '#4caf50' : '#2196f3'}; border-bottom:1px solid #444; padding-bottom:5px; margin-top:0;">
                ${week.name}
            </h3>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                <div style="background:#222; padding:8px; border-radius:4px;">
                    <div style="color:#aaa; font-size:12px;">Squat</div>
                    <div style="color:#fff; font-weight:bold; font-size:1.1em;">${week.squat}</div>
                    <div style="color:#2196f3; font-size:0.9em;">${week.reps}</div>
                </div>
                <div style="background:#222; padding:8px; border-radius:4px;">
                    <div style="color:#aaa; font-size:12px;">Bench</div>
                    <div style="color:#fff; font-weight:bold; font-size:1.1em;">${week.bench}</div>
                    <div style="color:#2196f3; font-size:0.9em;">${week.reps}</div>
                </div>
                <div style="background:#222; padding:8px; border-radius:4px;">
                    <div style="color:#aaa; font-size:12px;">Deadlift</div>
                    <div style="color:#fff; font-weight:bold; font-size:1.1em;">${week.deadlift}</div>
                    <div style="color:#2196f3; font-size:0.9em;">${week.reps}</div>
                </div>
                <div style="background:#222; padding:8px; border-radius:4px;">
                    <div style="color:#aaa; font-size:12px;">OHP</div>
                    <div style="color:#fff; font-weight:bold; font-size:1.1em;">${week.ohp}</div>
                    <div style="color:#2196f3; font-size:0.9em;">${week.reps}</div>
                </div>
            </div>
            
            ${!week.isDeload ? `<div style="margin-top:10px; font-size:12px; color:#666;">* Warmups available in Tools</div>` : ''}
        `;

        dashboardGrid.appendChild(card);
    });

    // Update Mobile Label (e.g., "Week 1")
    if(mobileWeekLabel) {
        mobileWeekLabel.innerText = programData[currentMobileWeek].name;
    }
}

// ==========================================
// 6. HELPER FUNCTIONS (Global)
// ==========================================

// Round to nearest 5
function round5(val) {
    const res = Math.round(val / 5) * 5;
    return isNaN(res) ? 0 : res;
}

// Mobile Nav Buttons (Global scope for HTML onclick)
window.changeMobileWeek = function(direction) {
    const maxIndex = programData.length - 1;
    currentMobileWeek += direction;
    
    // Cycle through (Loop)
    if (currentMobileWeek < 0) currentMobileWeek = maxIndex;
    if (currentMobileWeek > maxIndex) currentMobileWeek = 0;
    
    renderGrid(); // Redraw to show new week
};

// ==========================================
// 7. DATA HANDLING
// ==========================================
async function loadUserData(email) {
    try {
        const doc = await db.collection('users').doc(email).get();
        if (doc.exists) {
            const d = doc.data();
            inputs.squat.value = d.squat || 0;
            inputs.bench.value = d.bench || 0;
            inputs.deadlift.value = d.deadlift || 0;
            inputs.ohp.value = d.ohp || 0;
            calculateProgram(); // Refresh Grid
        }
    } catch (e) { console.error("Load Error:", e); }
}

async function saveUserData() {
    if(!currentUserEmail) return;
    try {
        await db.collection('users').doc(currentUserEmail).set({
            squat: parseFloat(inputs.squat.value) || 0,
            bench: parseFloat(inputs.bench.value) || 0,
            deadlift: parseFloat(inputs.deadlift.value) || 0,
            ohp: parseFloat(inputs.ohp.value) || 0,
            email: currentUserEmail
        }, { merge: true });
    } catch (e) { console.error("Save Error:", e); }
}

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
// Replace with your actual Firebase config keys
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ==========================================
// 2. GLOBAL STATE & VARIABLES
// ==========================================
let currentMobileWeek = 0; // 0 = Week 1
let currentUserEmail = "";
let programData = []; // Will hold the calculated weeks

// DOM Elements
const inputs = {
    squat: document.getElementById('squatInput'),
    bench: document.getElementById('benchInput'),
    deadlift: document.getElementById('deadliftInput'),
    ohp: document.getElementById('ohpInput')
};
const dashboardGrid = document.getElementById('dashboardGrid');
const mobileWeekLabel = document.getElementById('mobileWeekLabel');
const totalDisplay = document.getElementById('currentTotal');

// ==========================================
// 3. INITIALIZATION & EVENTS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Attach Listeners to Inputs for Auto-Save & Auto-Calc
    Object.values(inputs).forEach(input => {
        if(input) {
            input.addEventListener('input', () => {
                calculateProgram();
                saveUserData();
            });
        }
    });

    // Initial Calculation (Empty or Zeros)
    calculateProgram();
});

// ==========================================
// 4. CORE PROGRAM LOGIC (The Base Wave)
// ==========================================
function calculateProgram() {
    // Get values safely
    const s = parseFloat(inputs.squat.value) || 0;
    const b = parseFloat(inputs.bench.value) || 0;
    const d = parseFloat(inputs.deadlift.value) || 0;
    const o = parseFloat(inputs.ohp.value) || 0;

    // Update Total
    if(totalDisplay) totalDisplay.innerText = (s + b + d + o);

    // Define the 12 Weeks (10 Training + 2 Deload)
    // Structure: { name, pct, reps, isDeload }
    const schedule = [
        { name: "Week 1", p: 0.65, reps: "3x8" },
        { name: "Week 2", p: 0.70, reps: "3x8" },
        { name: "Week 3", p: 0.75, reps: "3x6" },
        { name: "Week 4", p: 0.80, reps: "3x5" },
        { name: "Week 5", p: 0.85, reps: "3x4" },
        { name: "Week 6", p: 0.90, reps: "3x3" },
        { name: "Deload 1", p: 0.50, reps: "3x10 (Flush)", isDeload: true }, // Deload 1
        { name: "Deload 2", p: 0.51, reps: "3x10 (Pump)", isDeload: true },  // Deload 2 (+2% load roughly)
        { name: "Week 7", p: 0.925, reps: "3x2" },
        { name: "Week 8", p: 0.95, reps: "2x2" },
        { name: "Week 9", p: 0.975, reps: "2x1" },
        { name: "Week 10 (Peak)", p: 1.0, reps: "1x1 (PR)" }
    ];

    programData = schedule.map(week => {
        // Calculate weights
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
// 5. RENDERING (Grid & Mobile)
// ==========================================
function renderGrid() {
    if (!dashboardGrid) return;
    dashboardGrid.innerHTML = "";

    programData.forEach((week, index) => {
        // Create Card HTML
        const card = document.createElement('div');
        card.className = "program-card"; // Make sure this class exists in CSS
        
        // CSS handling for mobile visibility
        // We add a specific ID or class to toggle visibility via JS
        card.dataset.weekIndex = index;
        if (window.innerWidth <= 768 && index !== currentMobileWeek) {
            card.style.display = 'none';
        } else {
            card.style.display = 'block';
        }

        // Add styling for card directly or rely on style.css
        card.style.border = "1px solid #333";
        card.style.padding = "15px";
        card.style.margin = "10px";
        card.style.background = "#1e1e1e";
        card.style.borderRadius = "8px";

        // Build Inner HTML
        const warmups = !week.isDeload ? `<button class="action-btn" style="font-size:12px; margin-top:5px;" onclick="window.loadWarmupIntoModal(${week.squat})">View Warmups</button>` : '';

        card.innerHTML = `
            <h3 style="color:${week.isDeload ? '#4caf50' : '#2196f3'}; border-bottom:1px solid #444; padding-bottom:5px;">${week.name}</h3>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-top:10px; text-align:center;">
                <div>
                    <div style="color:#aaa; font-size:12px;">Squat</div>
                    <div style="font-weight:bold; font-size:1.2em; color:#fff;">${week.squat}</div>
                    <div style="color:#2196f3; font-size:0.9em;">${week.reps}</div>
                </div>
                <div>
                    <div style="color:#aaa; font-size:12px;">Bench</div>
                    <div style="font-weight:bold; font-size:1.2em; color:#fff;">${week.bench}</div>
                    <div style="color:#2196f3; font-size:0.9em;">${week.reps}</div>
                </div>
                <div>
                    <div style="color:#aaa; font-size:12px;">Deadlift</div>
                    <div style="font-weight:bold; font-size:1.2em; color:#fff;">${week.deadlift}</div>
                    <div style="color:#2196f3; font-size:0.9em;">${week.reps}</div>
                </div>
            </div>
            
            <div style="margin-top:10px; padding-top:10px; border-top:1px solid #333;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                   <span style="font-size:12px; color:#aaa;">OHP: <strong>${week.ohp}</strong></span>
                   ${warmups}
                </div>
            </div>
        `;

        dashboardGrid.appendChild(card);
    });

    // Update Mobile Label
    if(mobileWeekLabel) {
        mobileWeekLabel.innerText = programData[currentMobileWeek].name;
    }
}

// ==========================================
// 6. WINDOW FUNCTIONS (Used by HTML onclick)
// ==========================================

// Helper: Round to nearest 5
function round5(val) {
    const res = Math.round(val / 5) * 5;
    return isNaN(res) ? 0 : res;
}

// Mobile Navigation
window.changeMobileWeek = function(direction) {
    const maxIndex = programData.length - 1;
    currentMobileWeek += direction;

    // Loop around logic
    if (currentMobileWeek < 0) currentMobileWeek = maxIndex;
    if (currentMobileWeek > maxIndex) currentMobileWeek = 0;

    renderGrid(); // Re-render to show correct card
};

// Tools Modal
window.openTools = function() {
    document.getElementById('toolsModal').style.display = 'block';
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
};

// Warmup Calculator (Linked to your HTML inputs)
window.calculateWarmup = function() {
    const target = parseFloat(document.getElementById('wuTarget').value) || 0;
    const style = document.getElementById('wuStyle').value; // standard, big, tight
    const display = document.getElementById('warmupDisplay');

    let steps = [];

    // Map HTML values to logic
    // 'big' = Aggressive, 'tight' = Conservative/High Prime
    if (style === 'big') {
        steps = [
            { pct: 0, reps: 10, label: "Bar" },
            { pct: 0.50, reps: 5, label: "Fast" },
            { pct: 0.75, reps: 3, label: "Strong" },
            { pct: 0.90, reps: 1, label: "Primer" }
        ];
    } else if (style === 'tight') {
        steps = [
            { pct: 0, reps: 10, label: "Bar" },
            { pct: 0.30, reps: 8, label: "Flow" },
            { pct: 0.50, reps: 5, label: "Tech" },
            { pct: 0.65, reps: 3, label: "Speed" },
            { pct: 0.80, reps: 2, label: "Heavy" },
            { pct: 0.90, reps: 1, label: "Single" }
        ];
    } else {
        // Standard
        steps = [
            { pct: 0, reps: 10, label: "Bar" },
            { pct: 0.40, reps: 5, label: "Warm" },
            { pct: 0.60, reps: 3, label: "Build" },
            { pct: 0.80, reps: 2, label: "Heavy" },
            { pct: 0.90, reps: 1, label: "Single" }
        ];
    }

    let html = `<table style="width:100%; font-size:14px; color:#ddd; margin-top:10px;">`;
    steps.forEach(step => {
        const weight = step.pct === 0 ? 45 : round5(target * step.pct);
        html += `
            <tr>
                <td style="padding:4px;">${weight} lbs</td>
                <td style="padding:4px;">x ${step.reps}</td>
                <td style="padding:4px; color:#FFD700;">${step.label}</td>
            </tr>
        `;
    });
    html += `</table>`;
    
    display.innerHTML = html;
};

// Quick helper to load a calculated week weight into the tools modal
window.loadWarmupIntoModal = function(weight) {
    document.getElementById('wuTarget').value = weight;
    window.openTools();
    window.calculateWarmup(); // Auto calculate
};

// 1RM Estimator
window.calculateOneRM = function() {
    const w = parseFloat(document.getElementById('calcWeight').value) || 0;
    const r = parseFloat(document.getElementById('calcReps').value) || 0;
    const resDiv = document.getElementById('oneRmResult');
    
    // Epley Formula
    const max = Math.round(w * (1 + r / 30));
    resDiv.innerText = `Estimated Max: ${max} lbs`;
};

// Auth Modal
window.openAuthModal = function() {
    document.getElementById('authModal').style.display = 'block';
};

// ==========================================
// 7. FIREBASE AUTH & DATA
// ==========================================
// Simple Email Login Handler
const emailLoginBtn = document.getElementById('emailLoginBtn');
if(emailLoginBtn) {
    emailLoginBtn.addEventListener('click', async () => {
        const email = document.getElementById('emailInput').value;
        if(email) {
            currentUserEmail = email;
            await loadUserData(email);
            window.closeModal('authModal');
            alert("Loaded data for " + email);
        }
    });
}

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
    } catch (e) { console.error(e); }
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
    } catch (e) { console.error(e); }
}

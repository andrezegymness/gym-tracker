// ==========================================
// 1. FIREBASE CONFIG
// ==========================================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// 2. STATE & VARIABLES
// ==========================================
let currentMobileWeek = 0;
let currentUserEmail = "";
let programData = [];

// DOM Elements
const inputs = {
    squat: document.getElementById('squatInput'),
    bench: document.getElementById('benchInput'),
    deadlift: document.getElementById('deadliftInput'),
    ohp: document.getElementById('ohpInput')
};
const dashboardGrid = document.getElementById('dashboardGrid');
const totalDisplay = document.getElementById('currentTotal');
const mobileWeekLabel = document.getElementById('mobileWeekLabel');

// ==========================================
// 3. MAIN INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auto-Calc on Input
    Object.values(inputs).forEach(input => {
        if(input) {
            input.addEventListener('input', () => {
                calculateProgram();
                saveUserData();
            });
        }
    });

    // 2. Login Logic
    const loginBtn = document.getElementById('emailLoginBtn');
    if(loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('emailInput').value.trim().toLowerCase();
            if(email) {
                currentUserEmail = email;
                await loadUserData(email);
                closeModal('authModal');
                alert("Welcome back: " + email);
            }
        });
    }

    // 3. Populate Tools (Glossary Defaults)
    // (Optional: You can trigger default fills here if needed)

    // 4. Initial Render
    calculateProgram();
});

// ==========================================
// 4. BASE WAVE LOGIC (10 WEEKS + 2 DELOADS)
// ==========================================
function calculateProgram() {
    const s = parseFloat(inputs.squat.value) || 0;
    const b = parseFloat(inputs.bench.value) || 0;
    const d = parseFloat(inputs.deadlift.value) || 0;
    const o = parseFloat(inputs.ohp.value) || 0;

    if(totalDisplay) totalDisplay.innerText = (s + b + d + o);

    const schedule = [
        { name: "Week 1", p: 0.65, reps: "3x8" },
        { name: "Week 2", p: 0.70, reps: "3x8" },
        { name: "Week 3", p: 0.75, reps: "3x6" },
        { name: "Week 4", p: 0.80, reps: "3x5" },
        { name: "Week 5", p: 0.85, reps: "3x4" },
        { name: "Week 6", p: 0.90, reps: "3x3" },
        // Fixed Deload Structure
        { name: "Deload 1", p: 0.50, reps: "3x10 (Flush)", isDeload: true },
        { name: "Deload 2", p: 0.51, reps: "3x10 (Pump)", isDeload: true },
        { name: "Week 7", p: 0.925, reps: "3x2" },
        { name: "Week 8", p: 0.95, reps: "2x2" },
        { name: "Week 9", p: 0.975, reps: "2x1" },
        { name: "Week 10 (Peak)", p: 1.0, reps: "1x1 (PR)" }
    ];

    programData = schedule.map(week => ({
        name: week.name,
        reps: week.reps,
        squat: round5(s * week.p),
        bench: round5(b * week.p),
        deadlift: round5(d * week.p),
        ohp: round5(o * week.p),
        isDeload: week.isDeload || false
    }));

    renderGrid();
}

function renderGrid() {
    if(!dashboardGrid) return;
    dashboardGrid.innerHTML = "";

    programData.forEach((week, index) => {
        const card = document.createElement('div');
        
        // Mobile View Logic
        const isMobile = window.innerWidth <= 768;
        if (isMobile && index !== currentMobileWeek) {
            card.style.display = 'none';
        } else {
            card.style.display = 'block';
        }

        // Card Styling
        card.style.background = "#1e1e1e";
        card.style.border = week.isDeload ? "1px solid #4caf50" : "1px solid #333";
        card.style.borderRadius = "8px";
        card.style.padding = "15px";
        card.style.marginBottom = "15px";

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #444; padding-bottom:5px;">
                <h3 style="margin:0; color:${week.isDeload ? '#4caf50' : '#2196f3'}">${week.name}</h3>
                ${!week.isDeload ? `<button onclick="loadWarmupIntoModal(${week.squat})" style="font-size:10px; background:#333; color:#fff; border:none; padding:4px;">Warmups</button>` : ''}
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                <div class="lift-box">
                    <div class="lbl">Squat</div><div class="val">${week.squat}</div><div class="reps">${week.reps}</div>
                </div>
                <div class="lift-box">
                    <div class="lbl">Bench</div><div class="val">${week.bench}</div><div class="reps">${week.reps}</div>
                </div>
                <div class="lift-box">
                    <div class="lbl">Deadlift</div><div class="val">${week.deadlift}</div><div class="reps">${week.reps}</div>
                </div>
                <div class="lift-box">
                    <div class="lbl">OHP</div><div class="val">${week.ohp}</div><div class="reps">${week.reps}</div>
                </div>
            </div>
            <style>
                .lift-box { background:#252525; padding:8px; border-radius:4px; text-align:center; }
                .lbl { color:#888; font-size:11px; }
                .val { color:#fff; font-weight:bold; font-size:1.1em; }
                .reps { color:#2196f3; font-size:0.8em; }
            </style>
        `;
        dashboardGrid.appendChild(card);
    });

    if(mobileWeekLabel) mobileWeekLabel.innerText = programData[currentMobileWeek].name;
}

// ==========================================
// 5. TOOLS LOGIC (RESTORED)
// ==========================================

// --- WARMUP TOOL ---
window.calculateWarmup = function() {
    const target = parseFloat(document.getElementById('wuTarget').value) || 0;
    const style = document.getElementById('wuStyle').value;
    const display = document.getElementById('warmupDisplay');
    
    let steps = [];
    if (style === 'big') { // Aggressive
        steps = [{p:0,r:10,t:"Bar"}, {p:0.5,r:5,t:"Fast"}, {p:0.75,r:3,t:"Strong"}, {p:0.9,r:1,t:"Primer"}];
    } else if (style === 'tight') { // Conservative
        steps = [{p:0,r:10,t:"Bar"}, {p:0.3,r:8,t:"Loose"}, {p:0.5,r:5,t:"Tech"}, {p:0.65,r:3,t:"Speed"}, {p:0.8,r:2,t:"Heavy"}, {p:0.9,r:1,t:"Single"}];
    } else { // Standard
        steps = [{p:0,r:10,t:"Bar"}, {p:0.4,r:5,t:"Warm"}, {p:0.6,r:3,t:"Build"}, {p:0.8,r:2,t:"Heavy"}, {p:0.9,r:1,t:"Single"}];
    }

    let html = '<table style="width:100%; font-size:13px; color:#ddd;">';
    steps.forEach(s => {
        let w = s.p === 0 ? 45 : round5(target * s.p);
        html += `<tr><td>${w} lbs</td><td>x ${s.r}</td><td style="color:#FFD700">${s.t}</td></tr>`;
    });
    html += '</table>';
    display.innerHTML = html;
};

// --- ACCESSORY GLOSSARY ---
const accessoriesDB = {
    legs: ["Belt Squat (3x12)", "Bulgarian Split Squat (3x10)", "Leg Ext/Curl (4x15)", "Lunges (3x20)"],
    push: ["DB Incline Press (3x10)", "Tricep Pushdown (4x15)", "Dips (3xFailure)", "Lateral Raises (4x15)"],
    pull: ["Lat Pulldown (4x12)", "Chest Supported Row (3x10)", "Face Pulls (4x15)", "Bicep Curls (3x10)"]
};

window.updateAccOptions = function() {
    const cat = document.getElementById('accCategory').value;
    const select = document.getElementById('accExercise');
    select.innerHTML = "";
    if(accessoriesDB[cat]) {
        accessoriesDB[cat].forEach(ex => {
            let opt = document.createElement('option');
            opt.value = ex;
            opt.innerText = ex;
            select.appendChild(opt);
        });
        displayAccDetails();
    }
};

window.displayAccDetails = function() {
    const ex = document.getElementById('accExercise').value;
    document.getElementById('accDetails').innerText = "Selected: " + ex;
};

// --- MOBILITY TOOL ---
const mobilityDB = {
    knees: "Foam Roll Quads, Couch Stretch (2 mins), Terminal Knee Extension",
    shoulders: "Band Pull Aparts (100 reps), Doorway Stretch, Scapular Retraction",
    hips: "Pigeon Pose, 90/90 Stretch, Hip Circle Walks",
    back: "Cat/Cow, McGill Big 3, Hang from bar (30s)"
};

window.updatePtMovements = function() {
    const area = document.getElementById('ptArea').value;
    const display = document.getElementById('ptDisplay');
    if(mobilityDB[area]) {
        display.innerHTML = `<div style="padding:10px; background:#333; border-radius:5px;">${mobilityDB[area]}</div>`;
    }
};

// --- RANDOMIZER ---
window.runRandomizer = function() {
    const goal = document.getElementById('randGoal').value;
    const result = document.getElementById('randomizerResult');
    const text = document.getElementById('randOutputText');
    
    let workout = "";
    if (goal === "strength") workout = "5x5 @ 75% Compound + 3x8 Heavy Accessory";
    else if (goal === "recovery") workout = "3x10 @ 50% Tempo Work + 20 min Steady State Cardio";
    else if (goal === "pump") workout = "4x12 Machines + Dropsets on Isolations";
    
    result.style.display = 'block';
    text.innerText = workout;
};

// --- UTILITIES ---
window.openTools = function() { document.getElementById('toolsModal').style.display = 'block'; };
window.openAuthModal = function() { document.getElementById('authModal').style.display = 'block'; };
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };
window.loadWarmupIntoModal = function(w) { 
    document.getElementById('wuTarget').value = w;
    window.openTools();
    window.calculateWarmup();
};
window.calculateOneRM = function() {
    const w = parseFloat(document.getElementById('calcWeight').value) || 0;
    const r = parseFloat(document.getElementById('calcReps').value) || 0;
    document.getElementById('oneRmResult').innerText = "Est Max: " + Math.round(w * (1 + r/30)) + " lbs";
};

// Helper
function round5(val) { return Math.round(val / 5) * 5 || 0; }
window.changeMobileWeek = function(d) {
    const max = programData.length - 1;
    currentMobileWeek += d;
    if(currentMobileWeek < 0) currentMobileWeek = max;
    if(currentMobileWeek > max) currentMobileWeek = 0;
    renderGrid();
};

// ==========================================
// 6. FIREBASE DATA HANDLERS
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
            calculateProgram();
        }
    } catch(e) { console.error(e); }
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
    } catch(e) { console.error(e); }
}

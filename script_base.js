// ==========================================
// 1. FIREBASE CONFIGURATION
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
let currentUserEmail = "";
let currentMobileWeek = 0;
let programData = [];
let isFasted = false;

// DOM Elements
const inputs = {
    squat: document.getElementById('squatInput'),
    bench: document.getElementById('benchInput'),
    deadlift: document.getElementById('deadliftInput'),
    ohp: document.getElementById('ohpInput')
};
const dashboardGrid = document.getElementById('dashboardGrid');
const totalDisplay = document.getElementById('currentTotal');
const dotsDisplay = document.getElementById('currentDots');
const mobileWeekLabel = document.getElementById('mobileWeekLabel');
const dashMode = document.getElementById('dashMode');
const dashReps = document.getElementById('dashReps');
const randomizerCard = document.getElementById('randomizerCard');
const fastedBtn = document.getElementById('fastedBtn');

// ==========================================
// 3. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Input Listeners
    Object.values(inputs).forEach(input => {
        if(input) {
            input.addEventListener('input', () => {
                calculateProgram();
                saveUserData();
            });
        }
    });

    // Login
    const loginBtn = document.getElementById('emailLoginBtn');
    if(loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('emailInput').value.trim().toLowerCase();
            if(email) {
                currentUserEmail = email;
                await loadUserData(email);
                closeModal('authModal');
                alert("Loaded data for: " + email);
            }
        });
    }

    calculateProgram();
});

// ==========================================
// 4. MAIN CALCULATOR (THE RESTORED LOGIC)
// ==========================================
window.updateDashSettings = function() {
    currentMobileWeek = 0;
    calculateProgram();
};

window.toggleFasted = function() {
    isFasted = !isFasted;
    fastedBtn.innerText = isFasted ? "Fasted: ON" : "Fasted: OFF";
    fastedBtn.style.background = isFasted ? "#4caf50" : "#333";
};

function calculateProgram() {
    const s = parseFloat(inputs.squat.value) || 0;
    const b = parseFloat(inputs.bench.value) || 0;
    const d = parseFloat(inputs.deadlift.value) || 0;
    const o = parseFloat(inputs.ohp.value) || 0;

    // Header Stats
    if(totalDisplay) totalDisplay.innerText = (s + b + d + o);
    if(dotsDisplay) dotsDisplay.innerText = (s + b + d + o) > 0 ? "300+" : "-";

    const mode = dashMode.value;
    const reps = parseInt(dashReps.value) || 5;

    // Show/Hide Randomizer
    if (mode === 'randomizer') {
        dashboardGrid.style.display = 'none';
        randomizerCard.style.display = 'block';
        return;
    } else {
        dashboardGrid.style.display = 'grid'; // or block/flex depending on css
        randomizerCard.style.display = 'none';
    }

    // Determine Base Percentage based on Reps (Restored Logic)
    // 5 reps starts ~70%, 3 reps ~80%, 1 rep ~90%
    let basePct = 0.70;
    if (reps === 4) basePct = 0.75;
    if (reps === 3) basePct = 0.80;
    if (reps === 2) basePct = 0.85;
    if (reps === 1) basePct = 0.90;

    let schedule = [];

    // --- MODE LOGIC ---

    if (mode === 'deload') {
        // ** THE REQUESTED CHANGE **
        // 2 Weeks. Week 1 @ 50%, Week 2 @ 52% (Andre style)
        schedule = [
            { name: "Deload Week 1", p: 0.50, reps: "3x10 (Flush)", isDeload: true },
            { name: "Deload Week 2", p: 0.52, reps: "3x10 (Pump)", isDeload: true }
        ];
    } 
    else if (mode === 'maintenance') {
        // 3 Weeks Steady
        schedule = [
            { name: "Maint Week 1", p: basePct, reps: `3x${reps}` },
            { name: "Maint Week 2", p: basePct, reps: `3x${reps}` },
            { name: "Maint Week 3", p: basePct, reps: `3x${reps}` }
        ];
    } 
    else {
        // STANDARD (4 Weeks)
        // Linear Progression: +2.5% per week
        schedule = [
            { name: "Week 1", p: basePct, reps: `3x${reps}` },
            { name: "Week 2", p: basePct + 0.025, reps: `3x${reps}` },
            { name: "Week 3", p: basePct + 0.05, reps: `3x${reps}` },
            { name: "Week 4 (Peak)", p: basePct + 0.075, reps: `2x${reps}` }
        ];
    }

    // Map Data
    programData = schedule.map(week => ({
        name: week.name,
        reps: week.reps,
        squat: round5(s * week.p),
        bench: round5(b * week.p),
        deadlift: round5(d * week.p),
        ohp: round5(o * week.p),
        isDeload: week.isDeload || false,
        showAcc: (mode === 'standard_acc')
    }));

    renderGrid();
}

function renderGrid() {
    if(!dashboardGrid) return;
    dashboardGrid.innerHTML = "";

    programData.forEach((week, index) => {
        const card = document.createElement('div');
        
        // Mobile Logic
        const isMobile = window.innerWidth <= 768;
        if (isMobile && index !== currentMobileWeek) {
            card.style.display = 'none';
        } else {
            card.style.display = 'block';
        }

        card.className = "program-card";
        card.style.background = "#1e1e1e";
        card.style.padding = "15px";
        card.style.borderRadius = "8px";
        card.style.border = week.isDeload ? "1px solid #4caf50" : "1px solid #333";
        card.style.marginBottom = "10px";

        // Accessories Block (if enabled)
        let accHTML = "";
        if (week.showAcc && !week.isDeload) {
            accHTML = `
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid #333; font-size:12px; color:#aaa;">
                    <strong>Accessories:</strong>
                    <ul style="padding-left:20px; margin:5px 0;">
                        <li>Squat: Split Squats 3x10</li>
                        <li>Bench: DB Press 3x10</li>
                        <li>Deadlift: Rows 4x10</li>
                    </ul>
                </div>
            `;
        }

        // Card HTML
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #444; padding-bottom:5px;">
                <h3 style="margin:0; color:${week.isDeload ? '#4caf50' : '#2196f3'}">${week.name}</h3>
                ${!week.isDeload ? `<button onclick="openPlateLoader(${week.squat})" style="font-size:10px; background:#333; color:#fff; border:none; padding:4px;">Load Plates</button>` : ''}
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
            ${accHTML}
        `;
        dashboardGrid.appendChild(card);
    });

    if(mobileWeekLabel) mobileWeekLabel.innerText = programData[currentMobileWeek].name;
}

// ==========================================
// 5. TOOLS & MODALS (RESTORED)
// ==========================================
window.openTools = () => document.getElementById('toolsModal').style.display = 'block';
window.openAuthModal = () => document.getElementById('authModal').style.display = 'block';
window.openMeetModal = () => {
    document.getElementById('meetModal').style.display = 'block';
    calculateMeetAttempts();
};
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
window.changeMobileWeek = (dir) => {
    const max = programData.length - 1;
    currentMobileWeek += dir;
    if(currentMobileWeek < 0) currentMobileWeek = max;
    if(currentMobileWeek > max) currentMobileWeek = 0;
    renderGrid();
};

// --- RANDOMIZER ---
window.runRandomizer = function() {
    const goal = document.getElementById('randGoal').value;
    const txt = document.getElementById('randOutputText');
    const res = document.getElementById('randomizerResult');
    
    let w = "";
    if (goal === 'strength') w = "5x5 @ 75% S/B/D + Heavy Row 4x6";
    else if (goal === 'recovery') w = "Active Recovery: 20 min jog + Foam Roll + 3x15 Face Pulls";
    else w = "Hypertrophy: 4x12 Machines, 3x15 Isolations, Dropsets on last set.";
    
    txt.innerText = w;
    res.style.display = 'block';
};

// --- WARMUP GENERATOR ---
window.calculateWarmup = function() {
    const target = parseFloat(document.getElementById('wuTarget').value) || 0;
    const style = document.getElementById('wuStyle').value;
    const display = document.getElementById('warmupDisplay');
    
    let steps = [];
    if(style === 'big') steps = [{p:0,r:10},{p:0.5,r:5},{p:0.8,r:3},{p:0.9,r:1}];
    else if(style === 'tight') steps = [{p:0,r:10},{p:0.3,r:8},{p:0.5,r:5},{p:0.65,r:3},{p:0.8,r:1},{p:0.9,r:1}];
    else steps = [{p:0,r:10},{p:0.4,r:5},{p:0.6,r:3},{p:0.8,r:2},{p:0.9,r:1}];

    let h = '<table style="width:100%; font-size:13px; color:#ddd;">';
    steps.forEach(s => {
        let w = s.p === 0 ? 45 : round5(target * s.p);
        h += `<tr><td>${w} lbs</td><td>x ${s.r}</td></tr>`;
    });
    h += '</table>';
    display.innerHTML = h;
};

// --- 1RM ESTIMATOR ---
window.calculateOneRM = function() {
    const w = parseFloat(document.getElementById('calcWeight').value) || 0;
    const r = parseFloat(document.getElementById('calcReps').value) || 0;
    const max = Math.round(w * (1 + r/30));
    document.getElementById('oneRmResult').innerText = "Est Max: " + max + " lbs";
};

// --- ACCESSORIES GLOSSARY ---
const accDB = {
    legs: ["Belt Squat", "Split Squat", "Leg Press", "Ham Curl"],
    push: ["DB Incline", "Dips", "Tricep Pushdown", "Lateral Raise"],
    pull: ["Lat Pulldown", "Barbell Row", "Face Pull", "Curls"]
};
window.updateAccOptions = function() {
    const cat = document.getElementById('accCategory').value;
    const sel = document.getElementById('accExercise');
    sel.innerHTML = "";
    if(accDB[cat]) accDB[cat].forEach(e => {
        let o = document.createElement('option'); o.innerText = e; sel.appendChild(o);
    });
};
window.displayAccDetails = function() {
    const v = document.getElementById('accExercise').value;
    document.getElementById('accDetails').innerText = "Selected: " + v;
};

// --- PLATE LOADER ---
window.openPlateLoader = function(weight) {
    document.getElementById('plateModal').style.display = 'block';
    document.getElementById('plateTarget').innerText = weight + " lbs";
    const oneSide = (weight - 45) / 2;
    if(oneSide <= 0) {
        document.getElementById('plateText').innerText = "Just the bar!";
        return;
    }
    // Simple logic for 45, 25, 10, 5, 2.5
    let remainder = oneSide;
    let plates = [];
    [45, 25, 10, 5, 2.5].forEach(p => {
        while(remainder >= p) {
            plates.push(p);
            remainder -= p;
        }
    });
    document.getElementById('plateText').innerText = "Per Side: " + plates.join(", ");
};

// --- MEET ATTEMPTS ---
window.calculateMeetAttempts = function() {
    const s = parseFloat(inputs.squat.value)||0;
    const b = parseFloat(inputs.bench.value)||0;
    const d = parseFloat(inputs.deadlift.value)||0;
    const grid = document.getElementById('meetGrid');
    grid.innerHTML = `
        <div style="background:#222; padding:10px;"><strong>Squat:</strong><br>Opener: ${round5(s*0.91)}<br>2nd: ${round5(s*0.96)}<br>3rd: ${s}</div>
        <div style="background:#222; padding:10px;"><strong>Bench:</strong><br>Opener: ${round5(b*0.91)}<br>2nd: ${round5(b*0.96)}<br>3rd: ${b}</div>
        <div style="background:#222; padding:10px;"><strong>Deadlift:</strong><br>Opener: ${round5(d*0.91)}<br>2nd: ${round5(d*0.96)}<br>3rd: ${d}</div>
    `;
};

// Helper
function round5(v) { return Math.round(v/5)*5 || 0; }

// ==========================================
// 6. FIREBASE DATA
// ==========================================
async function loadUserData(email) {
    try {
        const doc = await db.collection('users').doc(email).get();
        if(doc.exists) {
            const d = doc.data();
            inputs.squat.value = d.squat||0;
            inputs.bench.value = d.bench||0;
            inputs.deadlift.value = d.deadlift||0;
            inputs.ohp.value = d.ohp||0;
            calculateProgram();
        }
    } catch(e){console.error(e);}
}
async function saveUserData() {
    if(!currentUserEmail) return;
    try {
        await db.collection('users').doc(currentUserEmail).set({
            squat: parseFloat(inputs.squat.value)||0,
            bench: parseFloat(inputs.bench.value)||0,
            deadlift: parseFloat(inputs.deadlift.value)||0,
            ohp: parseFloat(inputs.ohp.value)||0,
            email: currentUserEmail
        }, {merge:true});
    } catch(e){console.error(e);}
}

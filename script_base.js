// ==========================================
// 1. FIREBASE SETUP
// ==========================================
// Replace with your actual config keys
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ==========================================
// 2. DOM ELEMENTS & STATE
// ==========================================
let currentUserEmail = "";

const landingPage = document.getElementById('landing-page');
const appContainer = document.getElementById('app-container');
const emailInput = document.getElementById('email-input');
const enterBtn = document.getElementById('enter-btn');
const programSelect = document.getElementById('program-select');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const leaderboardView = document.getElementById('leaderboard-view');
const leaderboardList = document.getElementById('leaderboard-list');
const closeLeaderboard = document.getElementById('close-leaderboard');

// Inputs
const squatInput = document.getElementById('squat-rm');
const benchInput = document.getElementById('bench-rm');
const deadliftInput = document.getElementById('deadlift-rm');

// Views
const andreView = document.getElementById('andre-view');
const baseView = document.getElementById('base-view');
const andreContent = document.getElementById('andre-content');
const baseContent = document.getElementById('base-content');

// Back Buttons
document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        programSelect.value = "";
        andreView.style.display = 'none';
        baseView.style.display = 'none';
    });
});

// ==========================================
// 3. MAIN LOGIC & EVENTS
// ==========================================

// Login / Enter
enterBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim().toLowerCase();
    if (!email) return alert("Please enter an email.");
    currentUserEmail = email;
    await handleUserData(email);
    landingPage.style.display = 'none';
    appContainer.style.display = 'block';
});

// Program Switching
programSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    andreView.style.display = 'none';
    baseView.style.display = 'none';

    if (val === 'andre') {
        renderAndreProgram();
        andreView.style.display = 'block';
    } else if (val === 'base') {
        renderBaseWave();
        baseView.style.display = 'block';
    }
});

// Leaderboard
leaderboardBtn.addEventListener('click', () => {
    fetchLeaderboard();
    leaderboardView.style.display = 'flex';
});
closeLeaderboard.addEventListener('click', () => {
    leaderboardView.style.display = 'none';
});

// Auto-Save Inputs
[squatInput, benchInput, deadliftInput].forEach(input => {
    input.addEventListener('input', () => {
        saveUserData();
        if (programSelect.value === 'andre') renderAndreProgram();
        if (programSelect.value === 'base') renderBaseWave();
    });
});

// ==========================================
// 4. CALCULATOR & WARMUPS
// ==========================================
function round5(val) {
    return Math.round(val / 5) * 5;
}

// Warmup Logic: Returns HTML for the calculator
function getWarmupHTML(weight, uniqueId) {
    // We attach an inline event handler to the select menu to update the display
    // uniqueId ensures we update the correct row if multiple exist
    return `
        <div class="warmup-container" style="background:#222; padding:10px; margin-top:5px; border-radius:5px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <label style="font-size:12px; color:#aaa;">Warmup Strategy:</label>
                <select id="select-${uniqueId}" onchange="updateWarmupDisplay('${uniqueId}', ${weight})" style="background:#333; color:#fff; border:none; padding:2px;">
                    <option value="standard">Standard</option>
                    <option value="aggressive">Aggressive (Save Energy)</option>
                    <option value="conservative">Conservative (Extra Warm)</option>
                </select>
            </div>
            <div id="display-${uniqueId}">
                ${generateWarmupRows(weight, 'standard')}
            </div>
        </div>
    `;
}

// This function is called by the HTML select menu above
window.updateWarmupDisplay = function(id, weight) {
    const strategy = document.getElementById(`select-${id}`).value;
    const container = document.getElementById(`display-${id}`);
    container.innerHTML = generateWarmupRows(weight, strategy);
};

function generateWarmupRows(target, strategy) {
    let jumps = [];
    
    // Logic for jumps
    if (strategy === 'aggressive') {
        // Fewer sets, bigger jumps
        jumps = [
            { pct: 0.00, reps: "10", cue: "Empty Bar" },
            { pct: 0.50, reps: "5", cue: "Fast" },
            { pct: 0.75, reps: "3", cue: "Strong" },
            { pct: 0.90, reps: "1", cue: "Primer" }
        ];
    } else if (strategy === 'conservative') {
        // More sets, smaller jumps
        jumps = [
            { pct: 0.00, reps: "10", cue: "Empty Bar" },
            { pct: 0.30, reps: "8", cue: "Loose" },
            { pct: 0.50, reps: "5", cue: "Tech" },
            { pct: 0.65, reps: "3", cue: "Speed" },
            { pct: 0.80, reps: "2", cue: "Heavy" },
            { pct: 0.90, reps: "1", cue: "Single" }
        ];
    } else {
        // Standard
        jumps = [
            { pct: 0.00, reps: "10", cue: "Empty Bar" },
            { pct: 0.40, reps: "5", cue: "Smooth" },
            { pct: 0.60, reps: "3", cue: "Solid" },
            { pct: 0.80, reps: "2", cue: "Heavy" },
            { pct: 0.90, reps: "1", cue: "Single" }
        ];
    }

    let html = '';
    jumps.forEach(step => {
        let load = step.pct === 0 ? "45" : round5(target * step.pct);
        html += `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #444; padding:4px 0; font-size:13px;">
                <span>${load} lbs</span>
                <span>x ${step.reps}</span>
                <span style="color:#FFD700;">${step.cue}</span>
            </div>
        `;
    });
    return html;
}

// ==========================================
// 5. ANDRE PROGRAM
// ==========================================
function renderAndreProgram() {
    const s = parseFloat(squatInput.value) || 0;
    const b = parseFloat(benchInput.value) || 0;
    const d = parseFloat(deadliftInput.value) || 0;

    const weeks = [
        { name: "Week 1", s: 0.70, b: 0.70, d: 0.70, reps: "5x5" },
        { name: "Week 2", s: 0.75, b: 0.75, d: 0.75, reps: "5x4" },
        { name: "Week 3", s: 0.80, b: 0.80, d: 0.80, reps: "4x4" },
        { name: "Week 4", s: 0.85, b: 0.85, d: 0.85, reps: "4x3" },
        { name: "Week 5", s: 0.90, b: 0.90, d: 0.90, reps: "3x2" },
        { name: "Week 6", s: 0.95, b: 0.95, d: 0.95, reps: "3x1" },
        { name: "Deload", s: 0.60, b: 0.60, d: 0.60, reps: "3x5" }
    ];

    let html = '';
    weeks.forEach((week, i) => {
        const sW = round5(s * week.s);
        const bW = round5(b * week.b);
        const dW = round5(d * week.d);

        html += `
            <div class="week-card">
                <h3>${week.name}</h3>
                <div class="lift-row">
                    <span>Squat</span> <strong>${sW}</strong> <span>${week.reps}</span>
                </div>
                ${week.name !== 'Deload' ? getWarmupHTML(sW, `andre-s-${i}`) : ''}
                
                <div class="lift-row">
                    <span>Bench</span> <strong>${bW}</strong> <span>${week.reps}</span>
                </div>
                <div class="lift-row">
                    <span>Deadlift</span> <strong>${dW}</strong> <span>${week.reps}</span>
                </div>
                <div class="accessories-section">
                     <h4>Accessories</h4>
                     <ul>
                        <li>Squat Acc: Belt Squat 3x10, Hamstrings 3x12</li>
                        <li>Bench Acc: DB Press 3x10, Triceps 3x15</li>
                        <li>Deadlift Acc: RDL 3x8, Back Ext 3x15</li>
                     </ul>
                </div>
            </div>
        `;
    });
    andreContent.innerHTML = html;
}

// ==========================================
// 6. BASE WAVE (SCROLLABLE & NEW DELOAD)
// ==========================================
function renderBaseWave() {
    const s = parseFloat(squatInput.value) || 0;
    const b = parseFloat(benchInput.value) || 0;
    const d = parseFloat(deadliftInput.value) || 0;

    const trainingWeeks = [
        { name: "Week 1", p: 0.65, reps: "3x8" },
        { name: "Week 2", p: 0.70, reps: "3x8" },
        { name: "Week 3", p: 0.75, reps: "3x6" },
        { name: "Week 4", p: 0.80, reps: "3x5" },
        { name: "Week 5", p: 0.85, reps: "3x4" },
        { name: "Week 6", p: 0.90, reps: "3x3" },
        { name: "Week 7", p: 0.925, reps: "3x2" },
        { name: "Week 8", p: 0.95, reps: "2x2" },
        { name: "Week 9", p: 0.975, reps: "2x1" },
        { name: "Week 10 (Peak)", p: 1.0, reps: "1x1" },
    ];

    // Horizontal Scroll Container Style
    let html = `
        <div style="
            display: flex; 
            overflow-x: auto; 
            gap: 15px; 
            padding-bottom: 20px; 
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;">
    `;

    // 1. Training Weeks
    trainingWeeks.forEach((week, i) => {
        const sW = round5(s * week.p);
        const bW = round5(b * week.p);
        const dW = round5(d * week.p);
        html += createBaseCard(week.name, sW, bW, dW, week.reps, false, `base-${i}`);
    });

    // 2. Deload Weeks (Custom Logic)
    // Deload 1: 50%
    const d1_s = round5(s * 0.50);
    const d1_b = round5(b * 0.50);
    const d1_d = round5(d * 0.50);
    html += createBaseCard("Deload Week 1", d1_s, d1_b, d1_d, "3x10 (Flush)", true, "dl-1");

    // Deload 2: Week 1 + 2% load
    const d2_s = round5(d1_s * 1.02);
    const d2_b = round5(d1_b * 1.02);
    const d2_d = round5(d1_d * 1.02);
    html += createBaseCard("Deload Week 2", d2_s, d2_b, d2_d, "3x10 (Pump)", true, "dl-2");

    html += '</div>'; // End Scroll Container
    baseContent.innerHTML = html;
}

function createBaseCard(title, s, b, d, reps, isDeload, uniqueId) {
    // Note: Added style="min-width: 85vw; scroll-snap-align: center;" for horizontal scrolling
    return `
        <div class="week-card" style="min-width: 85vw; scroll-snap-align: center;">
            <h3>${title}</h3>
            <div class="lift-row">
                <span>Squat</span> <strong>${s}</strong> <span>${reps}</span>
            </div>
            ${!isDeload ? getWarmupHTML(s, uniqueId) : ''}
            
            <div class="lift-row">
                <span>Bench</span> <strong>${b}</strong> <span>${reps}</span>
            </div>
            
            <div class="lift-row">
                <span>Deadlift</span> <strong>${d}</strong> <span>${reps}</span>
            </div>
            
            <div class="accessories-section">
                <h4>Accessories</h4>
                <ul>
                    <li>Core: Planks 3x60s</li>
                    <li>Back: Lat Pulldowns 3x12</li>
                    <li>Arms: Bicep Curls 3x12</li>
                </ul>
            </div>
        </div>
    `;
}

// ==========================================
// 7. FIREBASE DATA HANDLERS
// ==========================================
async function handleUserData(email) {
    try {
        const docRef = db.collection('users').doc(email);
        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data();
            squatInput.value = data.squat || 0;
            benchInput.value = data.bench || 0;
            deadliftInput.value = data.deadlift || 0;
        } else {
            await docRef.set({ email: email, squat: 0, bench: 0, deadlift: 0, total: 0 });
        }
    } catch (e) { console.error("Login Error", e); }
}

async function saveUserData() {
    if (!currentUserEmail) return;
    const s = parseFloat(squatInput.value) || 0;
    const b = parseFloat(benchInput.value) || 0;
    const d = parseFloat(deadliftInput.value) || 0;
    const total = s + b + d;
    
    db.collection('users').doc(currentUserEmail).set({
        squat: s, bench: b, deadlift: d, total: total, email: currentUserEmail
    }, { merge: true });
}

async function fetchLeaderboard() {
    leaderboardList.innerHTML = '<p>Loading...</p>';
    try {
        const snap = await db.collection('users').orderBy('total', 'desc').limit(20).get();
        let html = '<table style="width:100%; text-align:left;"><tr><th>Rank</th><th>User</th><th>Total</th></tr>';
        let rank = 1;
        snap.forEach(doc => {
            const d = doc.data();
            const name = d.email.split('@')[0]; // Simple mask
            html += `<tr><td>#${rank++}</td><td>${name}</td><td style="color:#FFD700;">${d.total}</td></tr>`;
        });
        html += '</table>';
        leaderboardList.innerHTML = html;
    } catch (e) {
        leaderboardList.innerHTML = '<p>Error loading. Check permissions.</p>';
    }
}

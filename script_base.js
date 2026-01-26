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
// 2. CONFIGURATION & CONSTANTS
// ==========================================
const basePctMap = { "5": 0.75, "4": 0.79, "3": 0.83, "2": 0.87, "1": 0.91 };
const standardProg = 0.0425;
const maintProg = 0.02;
const tempoStartPct = 0.71;
const tempoProg = 0.04;
const ohpStrengthStart = 0.80;
const ohpStrengthProg = 0.04;
const ohpVolPct = 0.60;

const accPeakingReps = [10, 8, 6, 5];
const accSets = [5, 4, 3, 2];
const accRPEs = [10, 9, 8, 7];
const standardSets = [3, 2, 1, 1];
const maintSets = [2, 2, 2, 2, 1, 1];

// Accessory Data
const accessoryData = {
  squat: [
    { name: "ATG System", tier: "S", notes: "Full range of motion focus." },
    { name: "Behind-the-Back Squat", tier: "S", notes: "Hack squat variation." },
    { name: "High Bar Pause Squat", tier: "S", notes: "Positional strength." },
    { name: "Belt Squats", tier: "S", notes: "Volume without spine loading." },
    { name: "Pause Squats", tier: "S", notes: "Fixes hole issues." },
    { name: "Hack Squats", tier: "A", notes: "Quad isolation." },
    { name: "Leg Press", tier: "A", notes: "Mass builder." },
    { name: "Split Squats", tier: "D", notes: "Unilateral work." }
  ],
  bench: [
    { name: "Larson press", tier: "S", notes: "No leg drive." },
    { name: "Floor press", tier: "S", notes: "Lockout focus." },
    { name: "Spoto Press", tier: "S", notes: "Pause above chest." },
    { name: "Weighted dips", tier: "B", notes: "Chest/Triceps." },
    { name: "Dumbbell Press", tier: "B", notes: "Hypertrophy." },
    { name: "Tricep Pushdowns", tier: "C", notes: "Isolation." }
  ],
  deadlift: [
    { name: "Seal Rows", tier: "S", notes: "Horizontal pull." },
    { name: "Pause Deadlift", tier: "S", notes: "Off floor strength." },
    { name: "Stiff Leg DL", tier: "A", notes: "Posterior chain." },
    { name: "Block Pulls", tier: "A", notes: "Overload." },
    { name: "Lat Pulldown", tier: "B", notes: "Back width." },
    { name: "Face Pulls", tier: "B", notes: "Rear delts." }
  ]
};

// ==========================================
// 3. STATE & VARIABLES
// ==========================================
let activeMobileWeek = 0;
let userProgram = [];
let isFasted = false;
let currentUserEmail = "";

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
const dashMode = document.getElementById('dashMode');
const dashReps = document.getElementById('dashReps');
const randomizerCard = document.getElementById('randomizerCard');
const fastedBtn = document.getElementById('fastedBtn');

// ==========================================
// 4. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Input Listeners (Auto-Save on Type)
    Object.values(inputs).forEach(input => {
        if(input) {
            input.addEventListener('input', () => { 
                generateProgram(); 
                saveUserData(); 
            });
        }
    });

    // 2. Login Button Listener
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

    // 3. Initial Load
    initProgramData();
    generateProgram();
});

// ==========================================
// 5. PROGRAM LOGIC (PRESERVED)
// ==========================================
function initProgramData() {
  userProgram = [];
  const daysTemplate = [
    { name: "Day 1 (Mon)", lifts: [{n: "Tempo Squat", t: "squat"}, {n: "Cluster DL", t: "deadlift"}]},
    { name: "Day 2 (Tue)", lifts: [{n: "Paused Bench", t: "bench"}, {n: "Larsen Press", t: "bench"}]},
    { name: "Day 3 (Wed)", lifts: [{n: "Comp Squat", t: "squat"}]},
    { name: "Day 4 (Thu)", lifts: [{n: "Tempo Bench", t: "bench"}, {n: "Close Grip", t: "bench"}]},
    { name: "Day 5 (Fri)", lifts: [{n: "Paused Bench (Sgl)", t: "bench"}]},
    { name: "Day 6 (Sat)", lifts: [{n: "Pause Squats", t: "squat"}, {n: "Paused DL Cluster", t: "deadlift"}, {n: "Comp Bench", t: "bench"}]}
  ];
  for (let w = 0; w < 6; w++) userProgram.push({ week: w + 1, days: JSON.parse(JSON.stringify(daysTemplate)) });
}

window.updateDashSettings = function() {
    activeMobileWeek = 0;
    generateProgram();
};

window.toggleFasted = function() {
  isFasted = !isFasted;
  if(fastedBtn) {
      fastedBtn.innerText = isFasted ? "Fasted: ON (-6.5%)" : "Fasted: OFF";
      fastedBtn.style.background = isFasted ? "#4caf50" : "#333";
  }
  generateProgram();
};

function generateProgram() {
  if (userProgram.length === 0) initProgramData();
  
  const sMax = parseFloat(inputs.squat.value) || 0;
  const bMax = parseFloat(inputs.bench.value) || 0;
  const dMax = parseFloat(inputs.deadlift.value) || 0;
  const oMax = parseFloat(inputs.ohp.value) || 0;

  if(totalDisplay) totalDisplay.innerText = (sMax + bMax + dMax + oMax);

  const reps = dashReps.value; 
  const mode = dashMode.value; 
  const startPct = basePctMap[reps] || 0.75; 

  // Randomizer Toggle
  if(dashboardGrid) dashboardGrid.style.display = (mode === 'randomizer') ? 'none' : 'grid';
  if(randomizerCard) randomizerCard.style.display = (mode === 'randomizer') ? 'block' : 'none';
  if(mode === 'randomizer') return;

  let numW = (mode === 'maintenance' ? 6 : (mode === 'deload' ? 2 : 4));
  if(mobileWeekLabel) mobileWeekLabel.innerText = `Week ${activeMobileWeek + 1}`;
  
  let html = '';
  const fastedMult = isFasted ? 0.935 : 1.0;

  for (let w = 0; w < numW; w++) {
    let mod = 0;
    let tempoMod = (w * tempoProg);

    // MODE LOGIC
    if (mode === 'maintenance') {
        mod = w * maintProg;
    } 
    else if (mode === 'deload') {
        // FLIPPED DELOAD (Week 1 Light, Week 2 Heavier)
        mod = -((2 - w) * standardProg);
        tempoMod = -((2 - w) * tempoProg);
    } 
    else {
        mod = w * standardProg;
    }

    const currentTempoPct = tempoStartPct + tempoMod;
    const curSets = (mode === 'maintenance' ? maintSets[w] : (standardSets[w] || 1));
    const curPct = startPct + mod;
    const psPct = 0.70 + mod;

    // Mobile Visibility
    let styleDef = (window.innerWidth <= 768 && w !== activeMobileWeek) ? 'display:none;' : '';

    html += `<div class="program-card" style="background:#1e1e1e; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #333; ${styleDef}">
                <h3 style="color:#2196f3; border-bottom:1px solid #444; padding-bottom:5px;">
                    Week ${w + 1} <span style="font-size:0.8em; color:#aaa;">(${Math.round(curPct * 100 * fastedMult)}%)</span>
                </h3>`;

    userProgram[w].days.forEach((day, dIdx) => {
      let activeLifts = [...day.lifts];

      // Standard Acc Injection
      if (mode === 'standard_acc') {
        const aReps = accPeakingReps[w];
        if (dIdx === 0) activeLifts.push({n: "OHP (Volume)", s:5, r:10, p:ohpVolPct, t:"bench", isOHP: true});
        if (dIdx === 1) activeLifts.push({n: "Close Grip Bench", s:accSets[w], r:aReps, p:0, t:"bench", isAcc:true});
        if (dIdx === 2) activeLifts.push({n: "Hack Squat", s:accSets[w], r:aReps, p:0, t:"squat", isAcc:true});
        if (dIdx === 3) activeLifts.push({n: "Seal Rows", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc:true});
        if (dIdx === 4) activeLifts = [{n: "OHP (Strength)", s:curSets, r:3, p:ohpStrengthStart + (w*ohpStrengthProg), t:"bench", isOHP:true}];
        if (dIdx === 5) activeLifts.push({n: "Stiff Leg DL", s:5, r:aReps, p:0, t:"deadlift", isAcc:true});
      }

      html += `<div style="margin-top:10px; background:#222; padding:8px; border-radius:5px;">
                <div style="font-size:0.9em; font-weight:bold; color:#ddd; border-bottom:1px solid #444; margin-bottom:5px;">${day.name}</div>
                <table style="width:100%; font-size:13px; border-collapse:collapse;">`;
      
      activeLifts.forEach(lift => {
        let mx = (lift.isOHP) ? oMax : (lift.t === "squat" ? sMax : (lift.t === "deadlift" ? dMax : bMax));
        let intens = curPct, dReps = reps, fSets = curSets, weightDisplay = "";
        
        if (lift.n.includes("Tempo")) { intens = currentTempoPct; dReps = 5; }
        else if (lift.n === "Pause Squats") { intens = psPct; dReps = 4; fSets = (w === 0 ? 4 : (w === 1 ? 3 : 1)); }
        else if (lift.n.includes("Paused")) { dReps = 3; }

        if (lift.isAcc) { 
            fSets = accSets[w]; dReps = lift.r; 
            weightDisplay = `<span style="color:#aaa;">RPE ${accRPEs[w]}</span>`; 
        } else {
            let finalIntens = lift.isOHP ? lift.p : intens;
            let weight = Math.round((mx * finalIntens * fastedMult) / 5) * 5;
            weightDisplay = `<strong style="color:#fff;">${weight} lbs</strong>`;
        }
        
        let btn = (!lift.isAcc && !lift.n.includes("Tempo")) ? 
            `<span onclick="openPlateLoader(${Math.round((mx*intens*fastedMult)/5)*5})" style="cursor:pointer; color:#2196f3; margin-left:5px;">🏋️</span>` : '';

        html += `<tr>
                    <td style="padding:4px 0; color:#ccc;">${lift.n}</td>
                    <td style="padding:4px 0; text-align:center; color:#2196f3;">${fSets}x${dReps}</td>
                    <td style="padding:4px 0; text-align:right;">${weightDisplay} ${btn}</td>
                 </tr>`;
      });
      html += `</table></div>`;
    });
    html += `</div>`;
  }
  if(dashboardGrid) dashboardGrid.innerHTML = html;
}

// ==========================================
// 6. UTILITIES (TOOLS)
// ==========================================
window.changeMobileWeek = function(dir) {
  const mode = dashMode.value;
  let maxW = (mode === 'maintenance' ? 6 : (mode === 'deload' ? 2 : 4));
  activeMobileWeek += dir;
  if(activeMobileWeek < 0) activeMobileWeek = maxW - 1;
  if(activeMobileWeek >= maxW) activeMobileWeek = 0;
  generateProgram();
};

window.openTools = () => document.getElementById('toolsModal').style.display = 'block';
window.openAuthModal = () => document.getElementById('authModal').style.display = 'block';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

// Plate Loader
window.openPlateLoader = function(weight) {
    document.getElementById('plateModal').style.display = 'block';
    document.getElementById('plateTarget').innerText = weight + " lbs";
    const oneSide = (weight - 45) / 2;
    if(oneSide <= 0) {
        document.getElementById('plateText').innerText = "Just the bar!";
        document.getElementById('plateVisuals').innerHTML = "";
        return;
    }
    let remainder = oneSide;
    let plates = [];
    let visuals = "";
    [45, 25, 10, 5, 2.5].forEach(p => {
        while(remainder >= p) {
            plates.push(p);
            let h = (p===45?40 : p===25?30 : p===10?25 : 20);
            let c = (p===45?'#0d47a1' : p===25?'#1b5e20' : '#444');
            visuals += `<div style="width:10px; height:${h}px; background:${c}; margin:1px; border-radius:2px;"></div>`;
            remainder -= p;
        }
    });
    document.getElementById('plateText').innerText = "Per Side: " + plates.join(", ");
    document.getElementById('plateVisuals').innerHTML = `<div style="display:flex; align-items:center; height:50px; justify-content:center;">${visuals}</div>`;
};

// Warmup
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
        let w = s.p === 0 ? 45 : Math.round((target * s.p)/5)*5;
        h += `<tr><td>${w} lbs</td><td>x ${s.r}</td></tr>`;
    });
    h += '</table>';
    display.innerHTML = h;
};

// Randomizer
window.runRandomizer = function() {
  const goal = document.getElementById('randGoal').value;
  let msg = "";
  if (goal === 'strength') msg = "Focus: Peak Load. 5x3 @ 85%.";
  else if (goal === 'recovery') msg = "Focus: Recovery. 3x10 @ 50% + Cardio.";
  else msg = "Focus: Pump. 4x12 Machines to failure.";
  document.getElementById('randOutputText').innerHTML = msg;
  document.getElementById('randomizerResult').style.display = 'block';
};

// 1RM
window.calculateOneRM = function() {
  const w = parseFloat(document.getElementById('calcWeight').value) || 0;
  const r = parseFloat(document.getElementById('calcReps').value) || 0;
  const max = Math.round(w * (1 + r/30));
  document.getElementById('oneRmResult').innerText = "Est Max: " + max + " lbs";
};

// Accessories
window.updateAccOptions = function() {
  const cat = document.getElementById('accCategory').value;
  const el = document.getElementById('accExercise');
  el.innerHTML = "";
  if(accessoryData[cat]) {
      accessoryData[cat].forEach(ex => {
          let opt = document.createElement('option');
          opt.value = ex.name;
          opt.innerText = ex.name;
          el.appendChild(opt);
      });
  }
  displayAccDetails();
};

window.displayAccDetails = function() {
  const cat = document.getElementById('accCategory').value;
  const val = document.getElementById('accExercise').value;
  const item = accessoryData[cat].find(i => i.name === val);
  const d = document.getElementById('accDetails');
  d.style.display = 'block';
  if(item) d.innerHTML = `<strong>${item.name}</strong> (${item.tier}-Tier)<br><small>${item.notes}</small>`;
};

// Mobility
const mobilityDB = {
    knees: "Foam Roll Quads, Couch Stretch (2 mins), Terminal Knee Extension",
    shoulders: "Band Pull Aparts (100 reps), Doorway Stretch, Scapular Retraction",
    hips: "Pigeon Pose, 90/90 Stretch, Hip Circle Walks",
    back: "Cat/Cow, McGill Big 3, Hang from bar (30s)",
    elbows: "Hammer Curls (Light), Forearm Massage, Band Extensions"
};
window.updatePtMovements = function() {
    const area = document.getElementById('ptArea').value;
    const d = document.getElementById('ptDisplay');
    d.style.display = 'block';
    d.innerText = mobilityDB[area] || "";
};

// ==========================================
// 7. FIREBASE DATA HANDLERS (THE FIX)
// ==========================================
async function loadUserData(email) {
    try {
        const doc = await db.collection('users').doc(email).get();
        if(doc.exists) {
            const d = doc.data();
            // Supports both "squat" and "s" keys for compatibility with Andre app
            inputs.squat.value = d.squat || d.s || 0;
            inputs.bench.value = d.bench || d.b || 0;
            inputs.deadlift.value = d.deadlift || d.d || 0;
            inputs.ohp.value = d.ohp || d.o || 0;
            generateProgram();
        }
    } catch(e) { console.error("Error loading data:", e); }
}

async function saveUserData() {
    if(!currentUserEmail) return;
    const s = parseFloat(inputs.squat.value) || 0;
    const b = parseFloat(inputs.bench.value) || 0;
    const d = parseFloat(inputs.deadlift.value) || 0;
    const o = parseFloat(inputs.ohp.value) || 0;
    
    try {
        await db.collection('users').doc(currentUserEmail).set({
            squat: s,
            bench: b,
            deadlift: d,
            ohp: o,
            // Also save short keys for compatibility
            s: s, b: b, d: d, o: o,
            total: (s + b + d + o), // Important for Leaderboard
            email: currentUserEmail
        }, {merge:true});
    } catch(e) { console.error("Error saving data:", e); }
}

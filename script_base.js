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
// 2. CONFIGURATION & CONSTANTS (FROM YOUR SNIPPET)
// ==========================================
const basePctMap = { "5": 0.75, "4": 0.79, "3": 0.83, "2": 0.87, "1": 0.91 };
const standardProg = 0.0425;
const maintProg = 0.02;
const tempoStartPct = 0.71;
const tempoProg = 0.04;
const ohpStrengthStart = 0.80;
const ohpStrengthProg = 0.04;
const ohpVolPct = 0.60;

// Acc Config
const accPeakingReps = [10, 8, 6, 5];
const accSets = [5, 4, 3, 2];
const accRPEs = [10, 9, 8, 7];
const standardSets = [3, 2, 1, 1];
const maintSets = [2, 2, 2, 2, 1, 1];

// Full Accessory Tier List
const accessoryData = {
  squat: [
    { name: "ATG System", tier: "S", notes: "Full range of motion focus." },
    { name: "Behind-the-Back Squat", tier: "S", notes: "Hack squat variation for quads." },
    { name: "High Bar Pause Squat", tier: "S", notes: "Builds positional strength." },
    { name: "Belt Squats", tier: "S", notes: "Quad volume without spine loading." },
    { name: "One and One-Quarter Squat", tier: "S", notes: "Increases time under tension." },
    { name: "Pause Squats", tier: "S", notes: "Fixes 'stuck in the hole' issues." },
    { name: "Cable Hip Raise", tier: "A", notes: "Direct hip flexor work." },
    { name: "Heels Elevated Squat", tier: "A", notes: "Greater quad emphasis." },
    { name: "Hack Squats", tier: "A", notes: "Excellent quad isolation." },
    { name: "Hanging Leg Raise", tier: "A/S", notes: "Core stability specific to heavy lifting." },
    { name: "SSB Squats", tier: "A", notes: "Targets upper back and quads." },
    { name: "Leg Press", tier: "A", notes: "General leg mass builder." },
    { name: "Good Mornings", tier: "B", notes: "Stronger posterior chain carryover." },
    { name: "Ab Rollouts", tier: "B", notes: "Anti-extension core strength." },
    { name: "Heavy Squat Walkouts", tier: "C", notes: "Desensitizes CNS to heavy loads." },
    { name: "Leg Extensions", tier: "C", notes: "Isolated quad volume." },
    { name: "V-Squat", tier: "C", notes: "Machine variation for leg volume." },
    { name: "Box Squats", tier: "D", notes: "Breaks eccentric-concentric chain." },
    { name: "Split Squats", tier: "D", notes: "Unilateral work, lower carryover." }
  ],
  bench: [
    { name: "Larson press", tier: "S", notes: "No leg drive; reduces fatigue." },
    { name: "Upright rows", tier: "S", notes: "Warms up elbows; aids failure." },
    { name: "Floor press", tier: "S", notes: "Improves lockout/chest contraction." },
    { name: "Push-ups", tier: "A", notes: "High carryover; essential volume." },
    { name: "Decline dumbbell", tier: "A", notes: "Larger ROM than flat bench." },
    { name: "Cambered bar bench", tier: "A", notes: "Increases range of motion." },
    { name: "Dumbbell overhead", tier: "A", notes: "Develops upper back strength." },
    { name: "Flat dumbbell bench", tier: "B", notes: "Valuable for chest development." },
    { name: "Weighted dips", tier: "B", notes: "Good chest/triceps training." },
    { name: "Pec deck", tier: "B", notes: "Works shoulders for mobility." },
    { name: "Seated overhead", tier: "B", notes: "Shoulder training." },
    { name: "Smith machine bench", tier: "B", notes: "Builds upper back/scapular pos." },
    { name: "Hammer curls", tier: "C", notes: "Elbow warming." },
    { name: "Iliac pulldowns", tier: "C", notes: "Good in combination with lats." },
    { name: "Dumbbell row", tier: "C", notes: "Back training." },
    { name: "Rear delt fly", tier: "C", notes: "Benefits with rest-pause style." }
  ],
  deadlift: [
    { name: "Seal Rows", tier: "S", notes: "Horizontal pull, no low back fatigue." },
    { name: "Pause Deadlift", tier: "S", notes: "Enhances technique off floor." },
    { name: "Stiff Leg Deadlift", tier: "A", notes: "Builds posterior chain." },
    { name: "Block Pulls", tier: "A", notes: "Overload; beneficial for leverages." },
    { name: "Andy Bolton Style", tier: "A", notes: "Technique practice." },
    { name: "Glute Ham Raise", tier: "B", notes: "Targets lower back and glutes." },
    { name: "Rack Pulls", tier: "B", notes: "Suits lifters with poor leverages." },
    { name: "Farmer's Walks", tier: "B", notes: "Grip strength." },
    { name: "Walking Lunges", tier: "C", notes: "Strengthen leg/glute." },
    { name: "RDLs (Romanian)", tier: "C", notes: "Emphasis on hinging." },
    { name: "Zercher Deadlift", tier: "D", notes: "Not effective for muscle-building." },
    { name: "Power Cleans", tier: "D", notes: "Different mechanics." },
    { name: "Shrug", tier: "E", notes: "Traps less important if form efficient." },
    { name: "Calf Work", tier: "F", notes: "It is what it is." },
    { name: "Back Extension", tier: "F", notes: "Posterior chain stimulus." }
  ]
};

// ==========================================
// 3. STATE & VARIABLES
// ==========================================
let activeMobileWeek = 0;
let userProgram = [];
let isFasted = false;
let currentUserEmail = "";

// DOM Elements Mapped to your HTML
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
    // Input Listeners
    Object.values(inputs).forEach(input => {
        if(input) input.addEventListener('input', () => { generateProgram(); saveUserData(); });
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
                alert("Loaded: " + email);
            }
        });
    }

    initProgramData();
    generateProgram();
});

// ==========================================
// 5. CORE PROGRAM GENERATOR (YOUR LOGIC)
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
  // Create 6 potential weeks (enough for all modes)
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

  // Header Stats
  if(totalDisplay) totalDisplay.innerText = (sMax + bMax + dMax + oMax);

  const reps = dashReps.value; // "5", "4", "3"...
  const mode = dashMode.value; // "standard", "deload", etc.
  
  // Base Percent from Config
  const startPct = basePctMap[reps] || 0.75; 

  // Handle Randomizer View
  if(dashboardGrid) {
      dashboardGrid.style.display = (mode === 'randomizer') ? 'none' : 'grid'; // or block based on CSS
  }
  if(randomizerCard) {
      randomizerCard.style.display = (mode === 'randomizer') ? 'block' : 'none';
  }
  if(mode === 'randomizer') return;

  // Determine Duration
  let numW = (mode === 'maintenance' ? 6 : (mode === 'deload' ? 2 : 4));
  
  if(mobileWeekLabel) mobileWeekLabel.innerText = `Week ${activeMobileWeek + 1}`;
  
  let html = '';
  const fastedMult = isFasted ? 0.935 : 1.0;

  // LOOP WEEKS
  for (let w = 0; w < numW; w++) {
    
    // --- MODIFIER LOGIC (INCLUDES DELOAD FLIP) ---
    let mod = 0;
    let tempoMod = (w * tempoProg);

    if (mode === 'maintenance') {
        mod = w * maintProg;
    } 
    else if (mode === 'deload') {
        // FLIPPED LOGIC: 
        // Week 1 (w=0): Needs to be lighter (-2 * prog)
        // Week 2 (w=1): Needs to be heavier (-1 * prog)
        // Formula: -((2 - w) * standardProg)
        mod = -((2 - w) * standardProg);
        tempoMod = -((2 - w) * tempoProg);
    } 
    else {
        // Standard
        mod = w * standardProg;
    }

    const currentTempoPct = tempoStartPct + tempoMod;
    const curSets = (mode === 'maintenance' ? maintSets[w] : (standardSets[w] || 1));
    const curPct = startPct + mod;
    const psPct = 0.70 + mod;

    // Mobile Visibility Class
    let activeClass = (w === activeMobileWeek) ? 'mobile-active' : 'mobile-hidden';
    
    // Inline CSS for mobile hiding (in case class css is missing)
    let styleDef = (window.innerWidth <= 768 && w !== activeMobileWeek) ? 'display:none;' : '';

    html += `<div class="program-card ${activeClass}" style="background:#1e1e1e; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #333; ${styleDef}">
                <h3 style="color:#2196f3; border-bottom:1px solid #444; padding-bottom:5px;">
                    Week ${w + 1} <span style="font-size:0.8em; color:#aaa;">(${Math.round(curPct * 100 * fastedMult)}%)</span>
                </h3>`;

    // LOOP DAYS
    userProgram[w].days.forEach((day, dIdx) => {
      let activeLifts = [...day.lifts];

      // --- STANDARD ACCESORY INJECTION (FROM SNIPPET) ---
      if (mode === 'standard_acc') {
        const aReps = accPeakingReps[w];
        if (dIdx === 0) activeLifts.push({n: "OHP (Volume)", s:5, r:10, p:ohpVolPct, t:"bench", isOHP: true});
        if (dIdx === 1) { activeLifts.push({n: "Close Grip Bench", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Weighted Dips", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Floor Press", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Dumbbell Flyes", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}); }
        if (dIdx === 2) { activeLifts.push({n: "Hack Squat", s:accSets[w], r:aReps, p:0, t:"squat", isAcc: true}, {n: "Leg Press", s:accSets[w], r:aReps, p:0, t:"squat", isAcc: true}, {n: "Belt Squat", s:accSets[w], r:aReps, p:0, t:"squat", isAcc: true}, {n: "Leg Extensions", s:accSets[w], r:aReps, p:0, t:"squat", isAcc: true}); }
        if (dIdx === 3) { activeLifts.push({n: "Seal Rows (S-Tier)", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "Weighted Pull-ups", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "T-Bar Rows", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "Dumbbell Row", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "Face Pulls", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}); }
        if (dIdx === 4) { activeLifts = [{n: "OHP (Strength)", s:curSets, r:3, p:ohpStrengthStart + (w*ohpStrengthProg), t:"bench", isOHP: true}, {n: "Seated DB Press", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Lateral Raises", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Rear Delt Flyes", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Upright Rows", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}]; }
        if (dIdx === 5) { activeLifts.push({n: "Stiff Leg DL", s:5, r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "Glute Ham Raise", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "Good Mornings", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "RDLs (PL Specific)", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}); }
      }

      html += `<div style="margin-top:10px; background:#222; padding:8px; border-radius:5px;">
                <div style="font-size:0.9em; font-weight:bold; color:#ddd; border-bottom:1px solid #444; margin-bottom:5px;">${day.name}</div>
                <table style="width:100%; font-size:13px; border-collapse:collapse;">`;
      
      activeLifts.forEach(lift => {
        let mx = (lift.isOHP) ? oMax : (lift.t === "squat" ? sMax : (lift.t === "deadlift" ? dMax : bMax));
        let intens = curPct, dReps = reps, fSets = curSets, weightDisplay = "";
        
        // Specific Lift Logic
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
        
        // Buttons (Plate Loader)
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
// 6. TOOLS & UTILITIES
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
            // Visual Block
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

// Accessory Options
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
// 7. FIREBASE DATA
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
            generateProgram();
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

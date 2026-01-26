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

// ==========================================
// 3. FULL ACCESSORY DATA (UNCUT)
// ==========================================
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
    { name: "Larson press", tier: "S", notes: "Excellent for upper body training without leg drive; reduces fatigue." },
    { name: "Upright rows", tier: "S", notes: "Effective for warming up elbows; aids in failure." },
    { name: "Floor press", tier: "S", notes: "Removes leg drive; improves chest contraction." },
    { name: "Push-ups", tier: "A", notes: "High carryover; essential for chest, triceps, shoulders." },
    { name: "Decline dumbbell", tier: "A", notes: "Larger range of motion than flat bench." },
    { name: "Cambered bar bench", tier: "A", notes: "Effective for reducing range of motion." },
    { name: "Dumbbell overhead", tier: "A", notes: "Helps develop upper back strength." },
    { name: "Flat dumbbell bench", tier: "B", notes: "Valuable for chest development." },
    { name: "Weighted dips", tier: "B", notes: "Provides good chest/triceps training." },
    { name: "Pec deck", tier: "B", notes: "Works shoulders for mobility." },
    { name: "Seated overhead", tier: "B", notes: "Provides shoulder training." },
    { name: "Smith machine bench", tier: "B", notes: "Builds upper back and scapular positions." },
    { name: "Hammer curls", tier: "C", notes: "mainly for elbow warming." },
    { name: "Iliac pulldowns", tier: "C", notes: "Good in combination with other lats." },
    { name: "Dumbbell row", tier: "C", notes: "Provides back training." },
    { name: "Rear delt fly", tier: "C", notes: "Benefits with rest-pause style." }
  ],
  deadlift: [
    { name: "Seal Rows", tier: "S", notes: "Horizontal pulling volume without low back fatigue." },
    { name: "Pause Deadlift", tier: "S", notes: "Enhances deadlift technique." },
    { name: "Stiff Leg Deadlift", tier: "A", notes: "Builds conventional strength." },
    { name: "Block Pulls", tier: "A", notes: "Easier on low back, beneficial for poor leverages." },
    { name: "Andy Bolton Style", tier: "A", notes: "Technique practice." },
    { name: "Glute Ham Raise", tier: "B", notes: "Targets lower back and glutes." },
    { name: "Rack Pulls", tier: "B", notes: "Suits lifters with poor leverages." },
    { name: "Farmer's Walks", tier: "B", notes: "Grip strength exercise." },
    { name: "Walking Lunges", tier: "C", notes: "Strengthen leg and glute muscles." },
    { name: "RDLs (Romanian)", tier: "C", notes: "Emphasis on hinging." },
    { name: "Zercher Deadlift", tier: "D", notes: "Not effective for muscle-building." },
    { name: "Power Cleans", tier: "D", notes: "Different form from deadlift." },
    { name: "Shrug", tier: "E", notes: "Traps less important if form is efficient." },
    { name: "Calf Work", tier: "F", notes: "Variable effectiveness." },
    { name: "Back Extension", tier: "F", notes: "Provides posterior chain stimulus." },
    { name: "GHD Sit-Ups", tier: "F", notes: "Offers proprioceptive benefits." },
    { name: "Strict Pendlay Row", tier: "F", notes: "Reduced lower back loading." }
  ]
};

// ==========================================
// 4. STATE & VARIABLES
// ==========================================
let activeMobileWeek = 0;
let userProgram = [];
let isFasted = false;
let currentUserEmail = "";

// ==========================================
// 5. INITIALIZATION & LOGIN SYNC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- LOGIN SYNC (CHECKS ALL KEYS) ---
    const potentialKeys = ['currentUserEmail', 'userEmail', 'email', 'pl_user_email'];
    let foundEmail = null;
    
    potentialKeys.forEach(key => {
        if (!foundEmail) foundEmail = localStorage.getItem(key);
    });

    if (foundEmail) {
        currentUserEmail = foundEmail;
        loadUserData(foundEmail); 
        localStorage.setItem('currentUserEmail', foundEmail); // Sync to our key
    }

    // Input Listeners
    const inputs = [
        document.getElementById('squatInput'),
        document.getElementById('benchInput'),
        document.getElementById('deadliftInput'),
        document.getElementById('ohpInput')
    ];
    inputs.forEach(input => {
        if(input) {
            input.addEventListener('input', () => { 
                generateProgram(); 
                saveUserData(); 
            });
        }
    });

    // Login Button Listener
    const loginBtn = document.getElementById('emailLoginBtn');
    if(loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('emailInput').value.trim().toLowerCase();
            if(email) {
                // Save to ALL keys to ensure compatibility with Andre Map
                localStorage.setItem('currentUserEmail', email);
                localStorage.setItem('userEmail', email); 
                localStorage.setItem('email', email);
                localStorage.setItem('pl_user_email', email);
                
                currentUserEmail = email;
                await loadUserData(email);
                closeModal('authModal');
                alert("Logged in as: " + email);
            }
        });
    }

    initProgramData();
    generateProgram();
    updateAccOptions();
});

// ==========================================
// 6. PROGRAM GENERATION
// ==========================================
function initProgramData() {
  userProgram = [];
  // ORIGINAL DAY ORDER PRESERVED
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

function generateProgram() {
  if (userProgram.length === 0) initProgramData();
  
  const sMax = parseFloat(document.getElementById('squatInput').value) || 0;
  const bMax = parseFloat(document.getElementById('benchInput').value) || 0;
  const dMax = parseFloat(document.getElementById('deadliftInput').value) || 0;
  const oMax = parseFloat(document.getElementById('ohpInput').value) || 0;

  // Header Total
  const totalEl = document.getElementById('currentTotal');
  if(totalEl) totalEl.innerText = (sMax + bMax + dMax + oMax);

  const reps = document.getElementById('dashReps').value;
  const mode = document.getElementById('dashMode').value;
  const startPct = basePctMap[reps] || 0.75;

  safeStyle('randomizerCard', (mode === 'randomizer' ? 'block' : 'none'));
  safeStyle('dashboardGrid', (mode === 'randomizer' ? 'none' : 'grid'));

  let numW = (mode === 'maintenance' ? 6 : (mode === 'deload' ? 2 : 4));
  const mobLabel = document.getElementById('mobileWeekLabel');
  if(mobLabel) mobLabel.innerText = `Week ${activeMobileWeek + 1}`;
  
  let html = '';
  const fastedMult = isFasted ? 0.935 : 1.0;

  for (let w = 0; w < numW; w++) {
    
    // --- PERCENTAGE MODIFIERS ---
    let mod = 0;
    let tempoMod = (w * tempoProg);

    if (mode === 'maintenance') {
        mod = w * maintProg;
    } 
    else if (mode === 'deload') {
        // ** DELOAD FLIP (Week 1 = 50%, Week 2 = 52%) **
        if (w === 0) mod = (0.50 - startPct);
        if (w === 1) mod = (0.52 - startPct);
        tempoMod = -0.10; 
    } 
    else {
        // Standard Linear
        mod = w * standardProg;
    }

    const currentTempoPct = tempoStartPct + tempoMod;
    const curSets = (mode === 'maintenance' ? maintSets[w] : (standardSets[w] || 1));
    const curPct = startPct + mod;
    const psPct = 0.70 + mod;

    let activeClass = (w === activeMobileWeek) ? 'active-week' : '';
    let styleDef = (window.innerWidth <= 768 && w !== activeMobileWeek) ? 'display:none;' : '';
    let headerColor = (mode === 'deload') ? '#4caf50' : '#2196f3';

    html += `<div class="program-card ${activeClass}" style="background:#1e1e1e; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #333; ${styleDef}">
                <h3 style="color:${headerColor}; border-bottom:1px solid #444; padding-bottom:5px;">
                    Week ${w + 1} <span style="font-size:0.8em; color:#aaa;">(${Math.round(curPct * 100 * fastedMult)}%)</span>
                </h3>`;

    userProgram[w].days.forEach((day, dIdx) => {
      let activeLifts = [...day.lifts];
      
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
        
        // --- LOGIC REVERSAL FIX ---
        // 1. Paused Bench = Dynamic (follows 'reps')
        // 2. Larsen Press = Static (Fixed reps, e.g., 3 or 4)
        
        if (lift.n === "Larsen Press") {
            dReps = 3; // LARSEN IS NOW STATIC
        }
        else if (lift.n === "Paused Bench") {
            dReps = reps; // PAUSED BENCH IS NOW DYNAMIC
        }
        else if (lift.n.includes("Tempo")) { 
            intens = currentTempoPct; dReps = 5; 
        }
        else if (lift.n === "Pause Squats") { 
            intens = psPct; dReps = 4; fSets = (w === 0 ? 4 : (w === 1 ? 3 : 1)); 
        }
        else if (lift.n.includes("Paused") && lift.n !== "Paused Bench") { 
            // Any OTHER paused lift (like Paused DL) stays static 3
            dReps = 3; 
        }

        if (lift.isAcc) { 
            fSets = accSets[w]; dReps = lift.r; 
            weightDisplay = `<span style="color:#aaa;">RPE ${accRPEs[w]}</span>`; 
        } else {
            let finalIntens = lift.isOHP ? lift.p : intens;
            let weight = Math.round((mx * finalIntens * fastedMult) / 5) * 5;
            weightDisplay = `<strong style="color:#fff;">${weight} lbs</strong>`;
        }
        
        // Buttons
        let btn = (!lift.isAcc && !lift.n.includes("Tempo")) ? 
            `<span onclick="openPlateLoader(${Math.round((mx*intens*fastedMult)/5)*5})" style="cursor:pointer; color:#2196f3; margin-left:5px;">💿</span>` : '';

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
  
  const grid = document.getElementById('dashboardGrid');
  if(grid) grid.innerHTML = html;
}

// ==========================================
// 5. TOOLS & UTILITIES
// ==========================================

function toggleFasted() {
  isFasted = !isFasted;
  const btn = document.getElementById('fastedBtn');
  if(btn) {
      btn.innerText = isFasted ? "Fasted: ON (-6.5%)" : "Fasted: OFF";
      btn.style.background = isFasted ? "#4caf50" : "#333";
  }
  generateProgram();
}

function updateDashSettings() {
    activeMobileWeek = 0;
    generateProgram();
}

function resetMobileWeek() { activeMobileWeek = 0; }

function safeStyle(id, displayType) {
  const el = document.getElementById(id);
  if (el) el.style.display = displayType;
}

function runRandomizer() {
  const goal = document.getElementById('randGoal').value;
  const w = parseFloat(document.getElementById('prevWeight').value), r = parseInt(document.getElementById('prevReps').value);
  if (!w || !r) return;
  let outW, outR, msg;
  if (goal === 'strength') { outW = Math.round((w * 1.04) / 5) * 5; outR = Math.max(1, r - 1); msg = "Focus: Peak Load."; }
  else if (goal === 'recovery') { outW = Math.round((w * 0.93) / 5) * 5; outR = r + 2; msg = "Focus: Recovery Volume."; }
  else { outW = Math.round((w * 1.02) / 5) * 5; outR = r + 1; msg = "Focus: Hypertrophy/Pump."; }
  document.getElementById('randOutputText').innerHTML = `Target: <strong>${outW} lbs x ${outR} Reps</strong><br><small>${msg}</small>`;
  safeStyle('randomizerResult', 'block');
}

function calculateOneRM() {
  const w = parseFloat(document.getElementById('calcWeight').value), r = parseFloat(document.getElementById('calcReps').value);
  if (!w || !r) return;
  const f = { Brzycki: w*(36/(37-r)), Epley: w*(1+0.0333*r), "O'Conner": w*(1+0.025*r) };
  let rows = '', total = 0, count=0;
  for (let key in f) { let res = Math.round(f[key]); rows += `<tr><td>${key}</td><td>${res} lbs</td></tr>`; total += res; count++; }
  document.getElementById('oneRmResult').innerHTML = `<strong>Est: ${Math.round(total/count)} lbs</strong>`;
}

function updateAccOptions() {
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
}

function displayAccDetails() {
  const cat = document.getElementById('accCategory').value;
  const val = document.getElementById('accExercise').value;
  const item = accessoryData[cat].find(i => i.name === val);
  const d = document.getElementById('accDetails');
  d.style.display = 'block';
  if(item) d.innerHTML = `<strong>${item.name}</strong> (${item.tier}-Tier)<br><small>${item.notes}</small>`;
}

function changeMobileWeek(dir) {
  const mode = document.getElementById('dashMode').value;
  let maxW = (mode === 'maintenance' ? 6 : (mode === 'deload' ? 2 : 4));
  activeMobileWeek += dir;
  if(activeMobileWeek < 0) activeMobileWeek = maxW - 1;
  if(activeMobileWeek >= maxW) activeMobileWeek = 0;
  generateProgram();
}

function openPlateLoader(weight) {
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
}

window.openTools = () => document.getElementById('toolsModal').style.display = 'block';
window.openAuthModal = () => document.getElementById('authModal').style.display = 'block';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

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
// 6. FIREBASE DATA (WITH SHORT-KEY SUPPORT)
// ==========================================
async function loadUserData(email) {
    try {
        const doc = await db.collection('users').doc(email).get();
        if(doc.exists) {
            const d = doc.data();
            document.getElementById('squatInput').value = d.s || d.squat || 0;
            document.getElementById('benchInput').value = d.b || d.bench || 0;
            document.getElementById('deadliftInput').value = d.d || d.deadlift || 0;
            document.getElementById('ohpInput').value = d.o || d.ohp || 0;
            generateProgram();
        }
    } catch(e) { console.error("Error loading:", e); }
}

async function saveUserData() {
    if(!currentUserEmail) return;
    const s = parseFloat(document.getElementById('squatInput').value) || 0;
    const b = parseFloat(document.getElementById('benchInput').value) || 0;
    const d = parseFloat(document.getElementById('deadliftInput').value) || 0;
    const o = parseFloat(document.getElementById('ohpInput').value) || 0;
    
    try {
        await db.collection('users').doc(currentUserEmail).set({
            s: s, b: b, d: d, o: o,
            squat: s, bench: b, deadlift: d, ohp: o,
            total: (s + b + d + o),
            email: currentUserEmail
        }, {merge:true});
    } catch(e) { console.error("Error saving:", e); }
}

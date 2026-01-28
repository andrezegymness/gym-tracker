// ==========================================
// 1. FIREBASE CONFIGURATION (REAL KEYS)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB_1QW2BtfK5eZzakW858fg2UlAS5tZY7M",
    authDomain: "powerlifting-programs.firebaseapp.com",
    projectId: "powerlifting-programs",
    storageBucket: "powerlifting-programs.firebasestorage.app",
    messagingSenderId: "961044250962",
    appId: "1:961044250962:web:c45644c186e9bb6ee67a8b",
    measurementId: "G-501TXRLMSQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 2. CONSTANTS & SETTINGS
// ==========================================
const basePctMap = { "5": 0.75, "4": 0.79, "3": 0.83, "2": 0.87, "1": 0.91 };
const standardProg = 0.0425, maintProg = 0.02, tempoStartPct = 0.71, tempoProg = 0.04;
const ohpStrengthStart = 0.80, ohpStrengthProg = 0.04, ohpVolPct = 0.60;

const accPeakingReps = [10, 8, 6, 5];
const accSets = [5, 4, 3, 2];
const accRPEs = [10, 9, 8, 7];
const standardSets = [3, 2, 1, 1];
const maintSets = [2, 2, 2, 2, 1, 1];

// ==========================================
// 3. DATABASES
// ==========================================

// A. ORIGINAL ACCESSORY DATA (For Old Tools)
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

// B. SMART LIBRARY (The Full 70+ Exercise List)
const smartLibrary = {
    // --- SQUAT ---
    "Squat: Weak Hole": [
        { n: "Pin Squat (Low)", t: "Explosive Start", p: 0.65, r: "3x3", s: "squat" },
        { n: "Pause Squat (3s)", t: "No Bounce", p: 0.70, r: "3x4", s: "squat" },
        { n: "1.5 Rep Squat", t: "TUT", p: 0.60, r: "3x5", s: "squat" },
        { n: "Box Squat", t: "Hip Power", p: 0.75, r: "4x3", s: "squat" }
    ],
    "Squat: Mechanics/Core": [
        { n: "Tempo Squat (5-3-0)", t: "Path Control", p: 0.60, r: "3x5", s: "squat" },
        { n: "SSB Squat", t: "Upper Back", p: 0.75, r: "3x6", s: "squat" },
        { n: "Front Squat", t: "Upright/Quad", p: 0.65, r: "3x6", s: "squat" },
        { n: "Zombie Squat", t: "Bracing", p: 0.50, r: "3x5", s: "squat" }
    ],
    "Squat: Overload/CNS": [
        { n: "Heavy Walkout", t: "CNS Priming", p: 1.10, r: "3x15s", s: "squat" },
        { n: "Anderson Squat", t: "Tendon Power", p: 0.85, r: "3x3", s: "squat" },
        { n: "Supramax Eccentric", t: "Decentric/Neg", p: 1.05, r: "3x1", s: "squat" }
    ],

    // --- BENCH ---
    "Bench: Chest Strength": [
        { n: "Long Pause Bench", t: "Start Power", p: 0.75, r: "4x3", s: "bench" },
        { n: "Spoto Press", t: "Reversal", p: 0.70, r: "3x5", s: "bench" },
        { n: "Dead Press", t: "Concentric Only", p: 0.80, r: "5x1", s: "bench" },
        { n: "Larsen Press", t: "Stability", p: 0.70, r: "3x6", s: "bench" },
        { n: "Weighted Dips", t: "Mass Builder", p: 0.20, r: "3x8", s: "bench" } 
    ],
    "Bench: Lockout/Tri": [
        { n: "Floor Press", t: "Lockout", p: 0.80, r: "3x5", s: "bench" },
        { n: "Close Grip Bench", t: "Tricep Mass", p: 0.75, r: "3x8", s: "bench" },
        { n: "Board Press", t: "Overload", p: 1.05, r: "3x3", s: "bench" },
        { n: "Pin Lockouts", t: "Tendons", p: 1.10, r: "3x5", s: "bench" }
    ],
    "Bench: CNS/Overload": [
        { n: "Heavy Hold", t: "CNS Lockout", p: 1.15, r: "3x15s", s: "bench" }, 
        { n: "Bench Negative", t: "Decentric/Neg", p: 1.05, r: "3x1", s: "bench" },
        { n: "Bamboo Bar", t: "Stabilizer Chaos", p: 0.50, r: "3x15", s: "bench" }
    ],
    "Chest: Isolation (BB)": [
        { n: "DB Flyes", t: "Stretch", p: 0.20, r: "3x12", s: "bench" },
        { n: "Pec Deck", t: "Squeeze", p: 0.25, r: "3x15", s: "bench" },
        { n: "Cable Crossover", t: "Inner Chest", p: 0.15, r: "3x15", s: "bench" }
    ],

    // --- DEADLIFT ---
    "Deadlift: Floor/Start": [
        { n: "Deficit Deadlift", t: "Floor Speed", p: 0.70, r: "3x5", s: "deadlift" },
        { n: "Snatch Grip DL", t: "Upper Back", p: 0.60, r: "3x6", s: "deadlift" },
        { n: "Halting DL", t: "Start Mechanics", p: 0.70, r: "3x5", s: "deadlift" },
        { n: "Paused DL", t: "Positioning", p: 0.70, r: "3x3", s: "deadlift" }
    ],
    "Deadlift: Hips/Lockout": [
        { n: "Block Pulls", t: "Lockout", p: 0.95, r: "3x3", s: "deadlift" },
        { n: "Dimel Deadlift", t: "Glute Speed", p: 0.40, r: "2x20", s: "deadlift" },
        { n: "Banded Deadlift", t: "Lockout Grind", p: 0.50, r: "5x2", s: "deadlift" },
        { n: "Rack Pull Hold", t: "Grip/Traps", p: 1.10, r: "3x10s", s: "deadlift" },
        { n: "Farmer's Walks", t: "Grip/Core", p: 0.40, r: "3x30s", s: "deadlift" },
        { n: "Tempo Deadlift", t: "Eccentric", p: 0.60, r: "3x3", s: "deadlift" }
    ],

    // --- BODYBUILDING / AESTHETICS ---
    "Glutes: Aesthetics": [
        { n: "Hip Thrust", t: "Thickness (Max)", p: 0.50, r: "4x10", s: "deadlift" },
        { n: "Cable Abduction", t: "Upper Shelf (Med)", p: 0.10, r: "3x15", s: "squat" },
        { n: "Deficit Rev Lunge", t: "Tie-in/Lift", p: 0.25, r: "3x10", s: "squat" },
        { n: "Glute Kickback", t: "Roundness", p: 0.05, r: "3x20", s: "squat" },
        { n: "45 Deg Hypers", t: "Upper Glute", p: 0, r: "3x20", s: "squat" }
    ],
    "Legs: Quads/Hams": [
        { n: "Leg Press", t: "Overall Mass", p: 1.50, r: "4x10", s: "squat" },
        { n: "Hack Squat", t: "Outer Sweep", p: 0.60, r: "3x8", s: "squat" },
        { n: "Walking Lunges", t: "Unilateral", p: 0.25, r: "3x12", s: "squat" },
        { n: "Split Squat", t: "Separation", p: 0.20, r: "3x10", s: "squat" },
        { n: "RDL (Barbell)", t: "Hamstring Hang", p: 0.50, r: "3x8", s: "deadlift" },
        { n: "Stiff Leg DL", t: "Pure Stretch", p: 0.45, r: "3x10", s: "deadlift" },
        { n: "Good Mornings", t: "Post. Chain", p: 0.40, r: "3x8", s: "squat" },
        { n: "Glute Ham Raise", t: "Knee Flexion", p: 0, r: "3xMax", s: "squat" },
        { n: "Leg Extensions", t: "Quad Detail", p: 0.25, r: "3x15", s: "squat" },
        { n: "Seated Ham Curl", t: "Inner Ham", p: 0.20, r: "3x15", s: "squat" },
        { n: "Lying Ham Curl", t: "Outer Ham", p: 0.20, r: "3x12", s: "squat" }
    ],
    "Back Thickness/Width": [
        { n: "Pendlay Row", t: "Explosive Back", p: 0.60, r: "4x6", s: "deadlift" },
        { n: "Bent Over Row", t: "Gen Mass", p: 0.55, r: "3x10", s: "deadlift" },
        { n: "Vertical Row", t: "Rhomboid", p: 0.30, r: "3x12", s: "deadlift" },
        { n: "Lat Pulldown", t: "Width", p: 0.40, r: "3x12", s: "deadlift" },
        { n: "Chest Supp Row", t: "Mid-Back", p: 0.30, r: "3x12", s: "deadlift" },
        { n: "Seal Row", t: "Lats Iso", p: 0.40, r: "4x10", s: "deadlift" }
    ],
    "Shoulders (3 Heads)": [
        { n: "OHP (Standing)", t: "Mass", p: 0.80, r: "3x5", s: "ohp" },
        { n: "Seated DB Press", t: "Front/Side", p: 0.35, r: "3x10", s: "ohp" },
        { n: "Egyptian Lateral", t: "Side Delt (Cap)", p: 0.10, r: "4x15", s: "ohp" },
        { n: "Plate Raise", t: "Front Delt", p: 0, r: "3x12", s: "ohp" },
        { n: "Face Pulls", t: "Rear Delt/Health", p: 0.15, r: "3x20", s: "bench" },
        { n: "Rear Delt Fly", t: "Rear Iso", p: 0.10, r: "3x15", s: "bench" },
        { n: "Upright Rows", t: "Traps/Side", p: 0.30, r: "3x12", s: "ohp" }
    ],
    "Arms (Bi/Tri)": [
        { n: "Rope Pushdown", t: "Tricep Horseshoe", p: 0.25, r: "3x15", s: "bench" },
        { n: "Skullcrushers", t: "Tricep Mass", p: 0.30, r: "3x10", s: "bench" },
        { n: "Overhead Ext", t: "Tricep Long Head", p: 0.20, r: "3x12", s: "bench" },
        { n: "Incline Curl", t: "Bicep Peak", p: 0.10, r: "3x12", s: "deadlift" },
        { n: "Hammer Curl", t: "Forearm/Width", p: 0.15, r: "3x10", s: "deadlift" }
    ],
    "Abs (Strength)": [
        { n: "Weighted Planks", t: "Core", p: 0, r: "3x45s", s: "squat" },
        { n: "Ab Wheel", t: "Stiffness", p: 0, r: "3x10", s: "squat" },
        { n: "Hanging Leg Raise", t: "Hip Flexor", p: 0, r: "3x12", s: "squat" },
        { n: "Cable Crunch", t: "Flexion", p: 0.30, r: "4x15", s: "squat" },
        { n: "Pallof Press", t: "Anti-Rotation", p: 0.10, r: "3x12", s: "deadlift" }
    ]
};

// ==========================================
// 4. STATE & VARIABLES
// ==========================================
let activeMobileWeek = 0;
let userProgram = [];
let isFasted = false;
let currentUserEmail = "";
let customLifts = []; 

// *** NEW: MODIFIERS FOR ADJUSTING WEIGHTS ***
let modifiers = {};

// ==========================================
// 5. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. INSTANT MEMORY LOAD
    loadUIState();
    loadLocalInputs();
    loadCustomLifts();
    initLibraryMenu();

    // 2. FIREBASE AUTH LISTENER (Andre Sync)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Synced Login:", user.email);
            currentUserEmail = user.email;
            
            const btn = document.getElementById('login-btn');
            if(btn) {
                btn.innerText = "Log Out";
                btn.onclick = () => { 
                    auth.signOut(); 
                    localStorage.removeItem('baseMapLocalData'); 
                    localStorage.removeItem('baseMapUIState'); 
                    localStorage.removeItem('baseMapCustomLifts');
                    location.reload(); 
                };
            }
            loadUserData(user.email);
        }
    });

    // 3. LISTENERS
    ['squatInput','benchInput','deadliftInput','ohpInput'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', () => { generateProgram(); saveUserData(); saveLocalInputs(); });
    });

    document.getElementById('dashMode').addEventListener('change', () => { 
        activeMobileWeek = 0; 
        generateProgram(); 
        saveUIState(); 
    });
    document.getElementById('dashReps').addEventListener('change', () => { 
        activeMobileWeek = 0; 
        generateProgram(); 
        saveUIState(); 
    });
    
    const fBtn = document.getElementById('fastedBtn');
    if(fBtn) fBtn.addEventListener('click', () => { 
        toggleFasted(); 
        saveUIState(); 
    });

    document.getElementById('prevWeekBtn').addEventListener('click', () => changeMobileWeek(-1));
    document.getElementById('nextWeekBtn').addEventListener('click', () => changeMobileWeek(1));

    const emailBtn = document.getElementById('emailLoginBtn');
    if(emailBtn) emailBtn.addEventListener('click', handleLogin);

    // LIBRARY LISTENERS
    document.getElementById('libCategory').addEventListener('change', updateLibExercises);
    document.getElementById('libExercise').addEventListener('change', updateLibDetails);
    document.getElementById('addLiftBtn').addEventListener('click', addCustomLift);

    // TOOL LISTENERS
    document.getElementById('calcWarmupBtn').addEventListener('click', calculateWarmup);
    document.getElementById('runRandBtn').addEventListener('click', runRandomizer);
    document.getElementById('calcOneRmBtn').addEventListener('click', calculateOneRM);
    document.getElementById('accCategory').addEventListener('change', updateAccOptions);
    document.getElementById('accExercise').addEventListener('change', displayAccDetails);
    document.getElementById('ptArea').addEventListener('change', updatePtMovements);

    initProgramData();
    generateProgram();
    updateAccOptions();
});

// ==========================================
// 6. PROGRAM GENERATION (UPDATED WITH MODIFIERS)
// ==========================================
function initProgramData() {
  userProgram = [];
  const daysTemplate = [
    { name: "Day 1 (Mon)", lifts: [{n: "Primer Bench", t: "bench"}, {n: "Tempo Squat", t: "squat"}, {n: "Cluster DL", t: "deadlift"}]},
    { name: "Day 2 (Tue)", lifts: [{n: "Primary Bench", t: "bench"}, {n: "Larsen Press", t: "bench"}, {n: "Close Grip Bench (Optional)", t: "bench"}]},
    { name: "Day 3 (Wed)", lifts: [{n: "Comp Squat", t: "squat"}]},
    { name: "Day 4 (Thu) - Back Day", lifts: [
        {n: "⚠️ Use +Add Workout to populate loads", t: "bench", isLabel: true}, 
        {n: "Pendlay Row", t: "deadlift"},
        {n: "Weighted Pull-ups", t: "deadlift"},
        {n: "Lat Pulldown", t: "deadlift"},
        {n: "Chest Supported Row", t: "deadlift"},
        {n: "Face Pulls", t: "bench"}
    ]},
    { name: "Day 5 (Fri) - Shoulder Day", lifts: [
        {n: "⚠️ Use +Add Workout to populate loads", t: "ohp", isLabel: true},
        {n: "OHP (Strength)", t: "ohp"},
        {n: "Seated DB Press", t: "ohp"},
        {n: "Egyptian Lateral Raise", t: "ohp"},
        {n: "Rear Delt Fly", t: "bench"},
        {n: "Upright Rows", t: "ohp"}
    ]},
    { name: "Day 6 (Sat)", lifts: [{n: "Secondary Bench", t: "bench"}, {n: "Tempo Bench", t: "bench"}, {n: "Pause Squat", t: "squat"}, {n: "Paused DL Cluster", t: "deadlift"}]}
  ];
  for (let w = 0; w < 6; w++) userProgram.push({ week: w + 1, days: JSON.parse(JSON.stringify(daysTemplate)) });
}

function generateProgram() {
  if (userProgram.length === 0) initProgramData();
  
  const sMax = parseFloat(document.getElementById('squatInput').value) || 0;
  const bMax = parseFloat(document.getElementById('benchInput').value) || 0;
  const dMax = parseFloat(document.getElementById('deadliftInput').value) || 0;
  const oMax = parseFloat(document.getElementById('ohpInput').value) || 0;

  const totalEl = document.getElementById('currentTotal');
  if(totalEl) totalEl.innerText = (sMax + bMax + dMax + oMax);

  const repsVal = document.getElementById('dashReps').value;
  const reps = parseInt(repsVal); 
  const mode = document.getElementById('dashMode').value;
  const startPct = basePctMap[reps] || 0.75; 

  const randCard = document.getElementById('randomizerCard');
  const dashGrid = document.getElementById('dashboardGrid');
  if(randCard) randCard.style.display = (mode === 'randomizer' ? 'block' : 'none');
  if(dashGrid) dashGrid.style.display = (mode === 'randomizer' ? 'none' : 'grid');

  let numW = (mode === 'maintenance' ? 6 : (mode === 'deload' ? 2 : 4));
  const mobLabel = document.getElementById('mobileWeekLabel');
  if(mobLabel) mobLabel.innerText = `Week ${activeMobileWeek + 1}`;
  
  let html = '';
  const fastedMult = isFasted ? 0.935 : 1.0;

  for (let w = 0; w < numW; w++) {
    
    // ** RELATIVE DELOAD LOGIC **
    let mod = (mode === 'maintenance' ? w * 0.02 : w * 0.0425);
    if (mode === 'deload') mod = (w === 0 ? -0.08 : -0.04);

    const currentTempoPct = tempoStartPct + (w * 0.04);
    const curPct = startPct + mod; // Drives Primary Bench
    const psPct = 0.70 + mod;

    let activeClass = (w === activeMobileWeek) ? 'active-week' : '';
    let styleDef = (window.innerWidth <= 768 && w !== activeMobileWeek) ? 'display:none;' : '';
    let headerColor = (mode === 'deload') ? '#4caf50' : '#2196f3';

    html += `<div class="program-card ${activeClass}" style="background:#1e1e1e; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #333; ${styleDef}">
                <h3 style="color:${headerColor}; border-bottom:1px solid #444; padding-bottom:5px;">
                    Week ${w + 1} <span style="font-size:0.8em; color:#aaa;">(${Math.round(curPct * 100 * fastedMult)}%)</span>
                </h3>`;

    userProgram[w].days.forEach((day, dIdx) => {
      let rawLifts = [...day.lifts];
      let activeLifts = [];

      // ** PRE-PROCESS: SPLIT PRIMARY BENCH & INJECT ACC/CUSTOM **
      rawLifts.forEach(l => {
          if (l.n === "Primary Bench") {
              // Split into Top Set and Backoff Set
              activeLifts.push({ n: "Primary Bench (Top)", t: "bench", isPrimaryTop: true });
              activeLifts.push({ n: "Primary Bench (Backoff)", t: "bench", isPrimaryBackoff: true });
          } else {
              activeLifts.push(l);
          }
      });

      if (mode === 'standard_acc') {
        const aReps = accPeakingReps[w];
        if (dIdx === 0) activeLifts.push({n: "OHP (Volume)", s:5, r:10, p:ohpVolPct, t:"bench", isOHP: true});
        if (dIdx === 1) { activeLifts.push({n: "Close Grip Bench", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Weighted Dips", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Floor Press", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Dumbbell Flyes", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}); }
        if (dIdx === 2) { activeLifts.push({n: "Hack Squat", s:accSets[w], r:aReps, p:0, t:"squat", isAcc: true}, {n: "Leg Press", s:accSets[w], r:aReps, p:0, t:"squat", isAcc: true}, {n: "Belt Squat", s:accSets[w], r:aReps, p:0, t:"squat", isAcc: true}, {n: "Leg Extensions", s:accSets[w], r:aReps, p:0, t:"squat", isAcc: true}); }
        if (dIdx === 3) { activeLifts.push({n: "Seal Rows (S-Tier)", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "Weighted Pull-ups", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "T-Bar Rows", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "Dumbbell Row", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "Face Pulls", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}); }
        if (dIdx === 4) { activeLifts = [{n: "OHP (Strength)", s:curSets, r:3, p:ohpStrengthStart + (w*ohpStrengthProg), t:"bench", isOHP: true}, {n: "Seated DB Press", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Lateral Raises", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Rear Delt Flyes", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}, {n: "Upright Rows", s:accSets[w], r:aReps, p:0, t:"bench", isAcc: true}]; }
        if (dIdx === 5) { activeLifts.push({n: "Stiff Leg DL", s:5, r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "Glute Ham Raise", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "Good Mornings", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}, {n: "RDLs (PL Specific)", s:accSets[w], r:aReps, p:0, t:"deadlift", isAcc: true}); }
      }

      customLifts.forEach(cl => {
          if (cl.dayIndex === dIdx) {
              activeLifts.push({ n: cl.n, t: cl.s, isCustom: true, p: cl.p, r: cl.r });
          }
      });

      html += `<div style="margin-top:10px; background:#222; padding:8px; border-radius:5px;">
                <div style="font-size:0.9em; font-weight:bold; color:#ddd; border-bottom:1px solid #444; margin-bottom:5px;">${day.name}</div>
                <table style="width:100%; font-size:13px; border-collapse:collapse;">`;
      
      activeLifts.forEach(lift => {
        let mx = (lift.t === "ohp") ? oMax : (lift.t === "squat" ? sMax : (lift.t === "deadlift" ? dMax : bMax));
        let intens = curPct, dReps = reps, fSets = 3, weightDisplay = "";
        let finalIntens = lift.isOHP ? lift.p : intens;

        // --- BENCH & LIFT LOGIC ---
        if (lift.n === "Primer Bench") {
            let pMod = 0.12; 
            if (w === 0) { fSets=4; dReps=2; finalIntens = curPct - pMod; }
            if (w === 1) { fSets=3; dReps=1; finalIntens = curPct - (pMod - 0.02); }
            if (w === 2) { fSets=3; dReps=1; finalIntens = curPct - (pMod - 0.04); }
            if (w === 3) { fSets=1; dReps=1; finalIntens = 0.70; } 
        }
        else if (lift.isPrimaryTop) {
            fSets = 1; dReps = reps; finalIntens = curPct;
        }
        else if (lift.isPrimaryBackoff) {
            fSets = 3; dReps = reps; finalIntens = curPct - 0.05;
        }
        else if (lift.n === "Secondary Bench") {
            let sMod = 0.15;
            if (w === 0) { fSets=4; dReps=4; finalIntens = curPct - sMod; }
            if (w === 1) { fSets=4; dReps=3; finalIntens = curPct - (sMod - 0.02); }
            if (w === 2) { fSets=3; dReps=3; finalIntens = curPct - (sMod - 0.04); }
            if (w === 3) { fSets=2; dReps=3; finalIntens = 0.70; }
        }
        else if (lift.n === "Larsen Press") { dReps = 3; finalIntens = 0.70; }
        else if (lift.n.includes("Close Grip")) { dReps = 8; finalIntens = 0.75; }
        else if (lift.n === "Paused Bench") { dReps = reps; }
        else if (lift.n.includes("Tempo")) { finalIntens = currentTempoPct; dReps = 5; }
        else if (lift.n === "Pause Squats") { finalIntens = psPct; dReps = 4; fSets = (w === 0 ? 4 : (w === 1 ? 3 : 1)); }
        else if (lift.n.includes("Paused")) { dReps = 3; }
        
        // Back Day Logic
        if (lift.n === "Pendlay Row") { finalIntens = 0.60; dReps = 6; fSets = 4; }
        if (lift.n === "Weighted Pull-ups") { finalIntens = 0.30; dReps = 8; fSets = 3; }
        if (lift.n === "Lat Pulldown") { finalIntens = 0.40; dReps = 12; fSets = 3; }
        if (lift.n === "Chest Supported Row") { finalIntens = 0.30; dReps = 12; fSets = 3; }
        if (lift.n === "Face Pulls") { finalIntens = 0.15; dReps = 20; fSets = 3; }

        // OHP & Shoulder Logic
        if (lift.n === "OHP (Strength)") {
            if (w === 0) { fSets=4; dReps=6; finalIntens=0.70; }
            if (w === 1) { fSets=4; dReps=5; finalIntens=0.75; }
            if (w === 2) { fSets=4; dReps=4; finalIntens=0.80; }
            if (w === 3) { fSets=3; dReps=3; finalIntens=0.85; } // Peak
        }
        if (["Seated DB Press", "Egyptian Lateral Raise", "Rear Delt Fly", "Upright Rows"].includes(lift.n)) {
             fSets = (w === 3) ? 2 : 3; 
             dReps = 12;
             if(lift.n.includes("Seated")) finalIntens = 0.35;
             if(lift.n.includes("Egyptian")) finalIntens = 0.15;
             if(lift.n.includes("Rear")) finalIntens = 0.15;
             if(lift.n.includes("Upright")) finalIntens = 0.30;
        }

        if (lift.isLabel) {
            html += `<tr><td colspan="3" style="padding:5px; color:#FFD700; font-style:italic; font-size:0.9em; text-align:center;">${lift.n}</td></tr>`;
            return; 
        }

        // *** CALCULATE BASE WEIGHT ***
        let baseWeight = 0;
        if (lift.isCustom) {
            fSets = "3"; dReps = lift.r;
            let prog = (mode === 'deload') ? -0.10 : (w * 0.02);
            baseWeight = Math.round((mx * (lift.p + prog) * fastedMult) / 5) * 5;
        } 
        else if (lift.isAcc) { 
            fSets = accSets[w]; dReps = lift.r; 
            weightDisplay = `<span style="color:#aaa;">RPE ${accRPEs[w]}</span>`; 
        } 
        else {
            baseWeight = Math.round((mx * finalIntens * fastedMult) / 5) * 5;
        }

        // *** APPLY PERFORMANCE MODIFIER ***
        let modifier = modifiers[lift.n] || 1.0;
        let finalWeight = Math.round((baseWeight * modifier) / 5) * 5;
        
        let style = "color:#fff;";
        let warning = "";
        
        if (modifier !== 1.0 && baseWeight > 0) {
            style = "color:#ff4444; font-weight:bold;";
            warning = " ⚠️";
        }

        if (baseWeight > 0) {
            weightDisplay = `<strong style="${style}">${finalWeight} lbs${warning}</strong>`;
            
            // Add the EDIT PENCIL
            weightDisplay += ` <span onclick="adjustWeight('${lift.n}', ${baseWeight})" style="cursor:pointer; font-size:14px; margin-left:5px; color:#aaa;">✎</span>`;
        }

        // Backoff display logic
        if (lift.n === "Primary Bench (Top)") {
             // Just cleaner display
        }

        let clickVal = finalWeight;
        let btn = (clickVal > 0) ? 
            `<span onclick="window.openPlateLoader(${clickVal})" style="cursor:pointer; color:#2196f3; margin-left:5px;">💿</span>` : '';

        html += `<tr>
                    <td style="padding:4px 0; color:#ccc;">${lift.n} ${lift.isCustom ? '⭐' : ''}</td>
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
// 7. LIBRARY FUNCTIONS
// ==========================================
function initLibraryMenu() {
    const catSel = document.getElementById('libCategory');
    catSel.innerHTML = "";
    Object.keys(smartLibrary).forEach(key => {
        let opt = document.createElement('option');
        opt.value = key; opt.innerText = key; catSel.appendChild(opt);
    });
    updateLibExercises();
}

function updateLibExercises() {
    const cat = document.getElementById('libCategory').value;
    const exSel = document.getElementById('libExercise');
    exSel.innerHTML = "";
    smartLibrary[cat].forEach((item, idx) => {
        let opt = document.createElement('option');
        opt.value = idx; opt.innerText = item.n; exSel.appendChild(opt);
    });
    updateLibDetails();
}

function updateLibDetails() {
    const cat = document.getElementById('libCategory').value;
    const idx = document.getElementById('libExercise').value;
    const item = smartLibrary[cat][idx];
    document.getElementById('libDetails').innerText = `Target: ${item.t} | Logic: ${Math.round(item.p*100)}% of ${item.s.toUpperCase()}`;
}

function addCustomLift() {
    const cat = document.getElementById('libCategory').value;
    const idx = document.getElementById('libExercise').value;
    const day = parseInt(document.getElementById('libDay').value);
    const item = smartLibrary[cat][idx];
    customLifts.push({ ...item, dayIndex: day });
    saveCustomLifts();
    generateProgram();
    document.getElementById('libraryModal').style.display = 'none';
    alert(`Added ${item.n} to Day ${day + 1}`);
}

window.clearCustomLifts = function() {
    customLifts = [];
    saveCustomLifts();
    generateProgram();
    document.getElementById('libraryModal').style.display = 'none';
};

function saveCustomLifts() { localStorage.setItem('baseMapCustomLifts', JSON.stringify(customLifts)); }
function loadCustomLifts() {
    const data = localStorage.getItem('baseMapCustomLifts');
    if(data) customLifts = JSON.parse(data);
}

// *** NEW: ADJUST WEIGHT FUNCTION ***
window.adjustWeight = function(liftName, originalLoad) {
    let input = prompt(`Adjust load for ${liftName}.\nOriginal: ${originalLoad} lbs\n\nEnter the ACTUAL weight you lifted (or 0 to reset):`);
    if (input === null) return;
    
    let actual = parseFloat(input);
    
    if (!actual || actual === 0) {
        delete modifiers[liftName];
        alert(`${liftName} reset to standard programming.`);
    } else {
        let scalar = actual / originalLoad;
        modifiers[liftName] = scalar;
        alert(`${liftName} updated! Future weeks will scale by ${(scalar * 100).toFixed(1)}%`);
    }
    
    saveToCloud(); // Persist modifiers
    render(); // Update UI immediately
};

// ==========================================
// 8. UTILS & DATA
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

function changeMobileWeek(dir) {
  const mode = document.getElementById('dashMode').value;
  let maxW = (mode === 'maintenance' ? 6 : (mode === 'deload' ? 2 : 4));
  activeMobileWeek += dir;
  if(activeMobileWeek < 0) activeMobileWeek = maxW - 1;
  if(activeMobileWeek >= maxW) activeMobileWeek = 0;
  generateProgram();
  saveUIState(); 
}

async function handleLogin() {
    const email = document.getElementById('emailInput').value.trim().toLowerCase();
    const pass = document.getElementById('passwordInput').value;
    if(email && pass) {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            document.getElementById('authModal').style.display='none';
        } catch (e) { alert("Login Failed: " + e.message); }
    }
}

function saveUIState() {
    const state = { mode: document.getElementById('dashMode').value, reps: document.getElementById('dashReps').value, week: activeMobileWeek, fasted: isFasted };
    localStorage.setItem('baseMapUIState', JSON.stringify(state));
}

function loadUIState() {
    const state = JSON.parse(localStorage.getItem('baseMapUIState'));
    if(state) {
        if(state.mode) document.getElementById('dashMode').value = state.mode;
        if(state.reps) document.getElementById('dashReps').value = state.reps;
        if(state.week !== undefined) activeMobileWeek = state.week;
        if(state.fasted !== undefined) {
            isFasted = state.fasted;
            const btn = document.getElementById('fastedBtn');
            if(btn) {
                btn.innerText = isFasted ? "Fasted: ON (-6.5%)" : "Fasted: OFF";
                btn.style.background = isFasted ? "#4caf50" : "#333";
            }
        }
    }
}

function saveLocalInputs() {
    const d = { s: document.getElementById('squatInput').value, b: document.getElementById('benchInput').value, dl: document.getElementById('deadliftInput').value, o: document.getElementById('ohpInput').value };
    localStorage.setItem('baseMapLocalData', JSON.stringify(d));
}

function loadLocalInputs() {
    const d = JSON.parse(localStorage.getItem('baseMapLocalData'));
    if(d) {
        if(d.s) document.getElementById('squatInput').value = d.s;
        if(d.b) document.getElementById('benchInput').value = d.b;
        if(d.dl) document.getElementById('deadliftInput').value = d.dl;
        if(d.o) document.getElementById('ohpInput').value = d.o;
    }
}

async function loadUserData(email) {
    try {
        const snap = await getDoc(doc(db, "users", email));
        if(snap.exists()) {
            const d = snap.data();
            let s = d.s || d.squat || (d.maxes?d.maxes.Squat:0);
            let b = d.b || d.bench || (d.maxes?d.maxes.Bench:0);
            let dl = d.d || d.deadlift || (d.maxes?d.maxes.Deadlift:0);
            let o = d.o || d.ohp || (d.maxes?d.maxes.OHP:0);
            document.getElementById('squatInput').value = s;
            document.getElementById('benchInput').value = b;
            document.getElementById('deadliftInput').value = dl;
            document.getElementById('ohpInput').value = o;
            
            // LOAD MODIFIERS
            if (d.modifiers) modifiers = d.modifiers;

            generateProgram();
            saveLocalInputs(); 
        }
    } catch(e) { console.error(e); }
}

async function saveUserData() {
    if(!currentUserEmail) return;
    const s = parseFloat(document.getElementById('squatInput').value)||0;
    const b = parseFloat(document.getElementById('benchInput').value)||0;
    const dl = parseFloat(document.getElementById('deadliftInput').value)||0;
    const o = parseFloat(document.getElementById('ohpInput').value)||0;
    try {
        await setDoc(doc(db, "users", currentUserEmail), { 
            s: s, b: b, d: dl, o: o, 
            squat: s, bench: b, deadlift: dl, ohp: o, 
            maxes: { Squat:s, Bench:b, Deadlift:dl, OHP:o }, 
            modifiers: modifiers, // SAVE MODIFIERS
            email: currentUserEmail 
        }, {merge:true});
    } catch(e) { console.error(e); }
}

// Helpers
function calculateWarmup(){
    const t=parseFloat(document.getElementById('wuTarget').value);
    if(!t)return;
    const s=document.getElementById('wuStyle').value;
    let p=(s==='big')?[{p:0,r:10},{p:0.5,r:5},{p:0.8,r:3},{p:0.9,r:1}]:[{p:0,r:10},{p:0.4,r:5},{p:0.6,r:3},{p:0.8,r:2},{p:0.9,r:1}];
    let h=''; p.forEach(x=>{ h+=`<div>${Math.round((t*x.p)/5)*5} x ${x.r}</div>`; });
    document.getElementById('warmupDisplay').innerHTML=h;
}
function calculateOneRM(){
    const w=parseFloat(document.getElementById('calcWeight').value);
    const r=parseFloat(document.getElementById('calcReps').value);
    if(w&&r) document.getElementById('oneRmResult').innerText = "Est Max: "+Math.round(w*(1+0.0333*r));
}
function runRandomizer(){
    document.getElementById('randomizerResult').style.display='block';
    const goal = document.getElementById('randGoal').value;
    const w = parseFloat(document.getElementById('prevWeight').value);
    const r = parseFloat(document.getElementById('prevReps').value);
    
    if(!w || !r) {
        document.getElementById('randOutputText').innerText = "Please enter weight and reps.";
        return;
    }
    
    let msg = "";
    if(goal === 'strength') msg = `Target: ${Math.round((w*1.05)/5)*5} lbs x ${Math.max(1, r-1)} Reps (Strength)`;
    if(goal === 'pump') msg = `Target: ${Math.round((w*0.80)/5)*5} lbs x ${r+5} Reps (Pump)`;
    if(goal === 'recovery') msg = `Target: ${Math.round((w*0.60)/5)*5} lbs x ${r} Reps (Recovery)`;
    
    document.getElementById('randOutputText').innerText = msg;
}

function updateAccOptions(){
    const c=document.getElementById('accCategory').value;
    const m=document.getElementById('accExercise'); m.innerHTML='';
    if(accessoryData[c]) accessoryData[c].forEach(x=>{ let o=document.createElement('option'); o.text=x.name; m.add(o); });
}
function displayAccDetails(){
    const c=document.getElementById('accCategory').value;
    const n=document.getElementById('accExercise').value;
    const d=accessoryData[c].find(x=>x.name===n);
    if(d) document.getElementById('accDetails').innerText=d.notes;
}
function updatePtMovements(){
    const d=document.getElementById('ptDisplay'); d.style.display='block'; d.innerText="Drill loaded.";
}

// === BUTTON FIX: EXPOSE FUNCTIONS TO WINDOW ===
window.openPlateLoader = (w) => {
    document.getElementById('plateModal').style.display='flex';
    document.getElementById('plateTarget').innerText = w+" lbs";
    let s=(w-45)/2, p=[45,25,10,5,2.5], r=[];
    p.forEach(x=>{ while(s>=x){ r.push(x); s-=x; } });
    document.getElementById('plateText').innerText = r.length ? r.join(', ') : "Bar";
};
window.runRandomizer = runRandomizer; 
window.calculateWarmup = calculateWarmup;
window.calculateOneRM = calculateOneRM;
window.updateAccOptions = updateAccOptions;
window.displayAccDetails = displayAccDetails;
window.updatePtMovements = updatePtMovements;
window.clearCustomLifts = clearCustomLifts;

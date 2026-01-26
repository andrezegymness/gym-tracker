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
// 2. CONSTANTS
// ==========================================
const basePctMap = { "5": 0.75, "4": 0.79, "3": 0.83, "2": 0.87, "1": 0.91 };
const standardProg = 0.0425, maintProg = 0.02, tempoStartPct = 0.71, tempoProg = 0.04;
const ohpStrengthStart = 0.80, ohpStrengthProg = 0.04, ohpVolPct = 0.60;

const accPeakingReps = [10, 8, 6, 5];
const accSets = [5, 4, 3, 2];
const accRPEs = [10, 9, 8, 7];
const standardSets = [3, 2, 1, 1];
const maintSets = [2, 2, 2, 2, 1, 1];

// Full Accessory List (Uncut)
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
// 5. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. INSTANT MEMORY LOAD
    loadUIState();
    loadLocalInputs();

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

    // Tool Listeners
    document.getElementById('calcWarmupBtn').addEventListener('click', calculateWarmup);
    document.getElementById('runRandBtn').addEventListener('click', runRandomizer);
    document.getElementById('calcOneRmBtn').addEventListener('click', calculateOneRM);
    
    const accCat = document.getElementById('accCategory');
    if(accCat) accCat.addEventListener('change', updateAccOptions);
    
    const accEx = document.getElementById('accExercise');
    if(accEx) accEx.addEventListener('change', displayAccDetails);
    
    const ptArea = document.getElementById('ptArea');
    if(ptArea) ptArea.addEventListener('change', updatePtMovements);

    initProgramData();
    generateProgram();
    updateAccOptions();
});

// ==========================================
// 6. PROGRAM GENERATION
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
    
    let mod = 0;
    let tempoMod = (w * tempoProg);

    if (mode === 'maintenance') {
        mod = w * maintProg;
    } 
    else if (mode === 'deload') {
        // ** RELATIVE DELOAD LOGIC **
        // Week 1: -8% from Start Pct (e.g. 75% -> 67%)
        // Week 2: +4% from Week 1 (e.g. 67% -> 71%)
        if (w === 0) mod = -0.08; 
        if (w === 1) mod = -0.04;
        tempoMod = -0.10; 
    } 
    else {
        mod = w * standardProg;
    }

    const currentTempoPct = tempoStartPct + tempoMod;
    const curSets = (mode === 'maintenance' ? maintSets[w] : (standardSets[w] || 1));
    // Calculate final percent (Base + Modifier)
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
      
      // Standard Acc Injection
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
        
        // --- LOGIC RULES ---
        if (lift.n === "Larsen Press") {
            dReps = 3; // Static 3
        }
        else if (lift.n === "Paused Bench") {
            dReps = reps; // Dynamic (5/4/3/2/1)
        }
        else if (lift.n.includes("Tempo")) { 
            intens = currentTempoPct; dReps = 5; 
        }
        else if (lift.n === "Pause Squats") { 
            intens = psPct; dReps = 4; fSets = (w === 0 ? 4 : (w === 1 ? 3 : 1)); 
        }
        else if (lift.n.includes("Paused") && lift.n !== "Paused Bench") { 
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
        
        let btn = (!lift.isAcc && !lift.n.includes("Tempo")) ? 
            `<span onclick="window.openPlateLoader(${Math.round((mx*intens*fastedMult)/5)*5})" style="cursor:pointer; color:#2196f3; margin-left:5px;">💿</span>` : '';

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
// 7. UTILS & DATA
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
        } catch (e) {
            alert("Login Failed: " + e.message);
        }
    }
}

// --- UI STATE MEMORY ---
function saveUIState() {
    const state = {
        mode: document.getElementById('dashMode').value,
        reps: document.getElementById('dashReps').value,
        week: activeMobileWeek,
        fasted: isFasted
    };
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

// --- LOCAL MAXES MEMORY ---
function saveLocalInputs() {
    const d = {
        s: document.getElementById('squatInput').value,
        b: document.getElementById('benchInput').value,
        dl: document.getElementById('deadliftInput').value,
        o: document.getElementById('ohpInput').value
    };
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
            email: currentUserEmail
        }, {merge:true});
    } catch(e) { console.error(e); }
}

// Tool Helpers
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
    document.getElementById('randOutputText').innerText="Generated Workout.";
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
window.openPlateLoader = (w) => {
    document.getElementById('plateModal').style.display='flex';
    document.getElementById('plateTarget').innerText = w+" lbs";
    let s=(w-45)/2, p=[45,25,10,5,2.5], r=[];
    p.forEach(x=>{ while(s>=x){ r.push(x); s-=x; } });
    document.getElementById('plateText').innerText = r.length ? r.join(', ') : "Bar";
};: "Bar";
};

// ==========================================
// SCRIPT_BASE.JS — Base Map Linear
// Fixed: custom lift sync, Smart Logic dedup,
//        navigation, alerts → toasts
// New:   rest timer, bodyweight chart,
//        PDF export, dark/light theme toggle
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
// CONSTANTS
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
// DATABASES
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
    { name: "Hammer curls", tier: "C", notes: "Mainly for elbow warming." },
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
// SMART LOGIC — SINGLE SOURCE OF TRUTH
// FIX: was copy-pasted in 3 places before
// ==========================================
function resolveSmartLift(lift, weekIndex) {
    let pct = lift.p;
    let reps = lift.r;
    const w = weekIndex; // 0-based

    if (lift.n.includes("Block Pulls (Smart)")) {
        if (w === 0) { pct = 0.80; reps = "4"; }
        else if (w === 1) { pct = 0.85; reps = "3"; }
        else if (w === 2) { pct = 0.90; reps = "3"; }
        else if (w === 3) { pct = 0.75; reps = "1"; }
        else { pct = 0.70; reps = "3"; }
    }
    if (lift.n.includes("Snatch Grip RDL (Smart)")) {
        if (w === 0) { pct = 0.45; reps = "10"; }
        else if (w === 1) { pct = 0.50; reps = "8"; }
        else if (w === 2) { pct = 0.55; reps = "6"; }
        else { pct = 0; reps = "OFF"; }
    }
    if (lift.n.includes("Incline Barbell Bench (Smart)")) {
        if (w === 0) { pct = 0.65; reps = "8"; }
        else if (w === 1) { pct = 0.70; reps = "6"; }
        else if (w === 2) { pct = 0.75; reps = "5"; }
        else { pct = 0.80; reps = "4"; }
    }
    return { pct, reps };
}

const smartLibrary = {
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
    "Bench: Chest Strength": [
        { n: "Incline Barbell Bench (Smart)", t: "Upper Chest", p: 0.65, r: "3x8", s: "bench", note: "W1:3x8@65% | W2:3x6@70% | W3:3x5@75% | W4:3x4@80%" },
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
    "Deadlift: Floor/Start": [
        { n: "Deficit Deadlift", t: "Floor Speed", p: 0.70, r: "3x5", s: "deadlift" },
        { n: "Halting DL", t: "Start Mechanics", p: 0.70, r: "3x5", s: "deadlift" },
        { n: "Paused DL", t: "Positioning", p: 0.70, r: "3x3", s: "deadlift" },
        { n: "Snatch Grip RDL (Smart)", t: "Upper Back", p: 0.40, r: "3x10", s: "deadlift", note: "W1:3x10@40-45% | W2:3x8@45-50% | W3:2x6@50-55% | W4-5:OFF" }
    ],
    "Deadlift: Hips/Lockout": [
        { n: "Block Pulls (Smart)", t: "Lockout", p: 0.80, r: "3x4", s: "deadlift", note: "3-4in Height. W1:3x4@80% | W2:3x3@85% | W3:2x3@90% | W4:2x1@75%" },
        { n: "Dimel Deadlift", t: "Glute Speed", p: 0.40, r: "2x20", s: "deadlift" },
        { n: "Banded Deadlift", t: "Lockout Grind", p: 0.50, r: "5x2", s: "deadlift" },
        { n: "Rack Pull Hold", t: "Grip/Traps", p: 1.10, r: "3x10s", s: "deadlift" },
        { n: "Farmer's Walks", t: "Grip/Core", p: 0.40, r: "3x30s", s: "deadlift" },
        { n: "Tempo Deadlift", t: "Eccentric", p: 0.60, r: "3x3", s: "deadlift" }
    ],
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
// STATE
// ==========================================
let activeMobileWeek = 0;
let userProgram = [];
let isFasted = false;
let currentUserEmail = "";
let customLifts = [];
let modifiers = {};

// ==========================================
// TOAST — replaces all alert() calls
// FIX: removed every alert() — was jarring
// ==========================================
function toast(msg, type = "success") {
    let el = document.getElementById('toast-container');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast-container';
        el.style.cssText = `position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;`;
        document.body.appendChild(el);
    }
    const t = document.createElement('div');
    t.style.cssText = `background:${type==='error'?'#c62828':type==='info'?'#1565c0':'#2e7d32'};color:#fff;padding:12px 18px;border-radius:8px;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.4);opacity:0;transition:opacity 0.3s;max-width:280px;`;
    t.innerText = msg;
    el.appendChild(t);
    requestAnimationFrame(() => t.style.opacity = '1');
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ==========================================
// THEME TOGGLE — NEW FEATURE
// ==========================================
const themes = {
    dark: {
        '--bg': '#0d0d0d', '--surface': '#1e1e1e', '--surface2': '#222',
        '--border': '#333', '--text': '#fff', '--text-muted': '#aaa',
        '--accent': '#2196f3', '--gold': '#FFD700'
    },
    light: {
        '--bg': '#f0f2f5', '--surface': '#ffffff', '--surface2': '#f8f9fa',
        '--border': '#ddd', '--text': '#1a1a1a', '--text-muted': '#666',
        '--accent': '#1565c0', '--gold': '#b8860b'
    }
};
let currentTheme = localStorage.getItem('theme') || 'dark';

function applyTheme(name) {
    const t = themes[name] || themes.dark;
    Object.entries(t).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    document.body.style.background = t['--bg'];
    document.body.style.color = t['--text'];
    currentTheme = name;
    localStorage.setItem('theme', name);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerText = name === 'dark' ? '☀️ Light' : '🌙 Dark';
}

function toggleTheme() {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// ==========================================
// REST TIMER — DRAGGABLE + MINIMIZABLE
// ==========================================
let restTimerInterval = null;
let restTimerSeconds = 0;
let restTimerRunning = false;
let restTimerMinimized = false;

function injectRestTimer() {
    if (document.getElementById('restTimerBar')) return;
    const bar = document.createElement('div');
    bar.id = 'restTimerBar';
    bar.style.cssText = `position:fixed;top:60px;right:15px;z-index:8000;background:var(--surface,#1e1e1e);border:1px solid var(--border,#333);border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.5);min-width:200px;cursor:grab;user-select:none;touch-action:none;`;
    bar.innerHTML = `
        <span id="restTimerDragHandle" style="font-size:20px;cursor:grab;">⏱</span>
        <span id="restTimerDisplay" style="font-size:1.4em;font-weight:900;color:#2196f3;min-width:50px;">0:00</span>
        <div id="restTimerBtns" style="display:flex;gap:6px;">
            <button onclick="startRestTimer(90)" style="background:#2196f3;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-weight:bold;">90s</button>
            <button onclick="startRestTimer(180)" style="background:#ff9800;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-weight:bold;">3m</button>
            <button onclick="startRestTimer(300)" style="background:#9c27b0;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-weight:bold;">5m</button>
            <button onclick="stopRestTimer()" style="background:#555;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;">✕</button>
        </div>
        <button onclick="toggleTimerMinimize()" id="timerMinBtn" style="background:none;border:none;color:var(--text-muted,#aaa);font-size:16px;cursor:pointer;padding:0 4px;line-height:1;">−</button>
    `;
    document.body.appendChild(bar);

    // Drag logic
    let isDragging = false, startX, startY, origX, origY;
    function onDown(e) {
        if(e.target.tagName === 'BUTTON') return;
        isDragging = true;
        bar.style.cursor = 'grabbing';
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX; startY = touch.clientY;
        const rect = bar.getBoundingClientRect();
        origX = rect.left; origY = rect.top;
        e.preventDefault();
    }
    function onMove(e) {
        if(!isDragging) return;
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - startX, dy = touch.clientY - startY;
        bar.style.left = (origX + dx) + 'px';
        bar.style.top = (origY + dy) + 'px';
        bar.style.right = 'auto';
    }
    function onUp() { isDragging = false; bar.style.cursor = 'grab'; }
    bar.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    bar.addEventListener('touchstart', onDown, {passive:false});
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('touchend', onUp);
}

window.toggleTimerMinimize = function() {
    restTimerMinimized = !restTimerMinimized;
    const btns = document.getElementById('restTimerBtns');
    const minBtn = document.getElementById('timerMinBtn');
    if(btns) btns.style.display = restTimerMinimized ? 'none' : 'flex';
    if(minBtn) minBtn.innerText = restTimerMinimized ? '+' : '−';
};

window.startRestTimer = function(seconds) {
    if (restTimerInterval) clearInterval(restTimerInterval);
    restTimerSeconds = seconds;
    restTimerRunning = true;
    const display = document.getElementById('restTimerDisplay');
    restTimerInterval = setInterval(() => {
        restTimerSeconds--;
        const m = Math.floor(restTimerSeconds / 60);
        const s = restTimerSeconds % 60;
        if (display) {
            display.innerText = `${m}:${s.toString().padStart(2,'0')}`;
            display.style.color = restTimerSeconds <= 10 ? '#ff4444' : restTimerSeconds <= 30 ? '#ff9800' : '#2196f3';
        }
        if (restTimerSeconds <= 0) {
            clearInterval(restTimerInterval);
            restTimerRunning = false;
            if (display) display.innerText = '✅ GO';
            // Vibrate on mobile if supported
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            toast('Rest done — time to lift! 💪', 'info');
        }
    }, 1000);
};

window.stopRestTimer = function() {
    if (restTimerInterval) clearInterval(restTimerInterval);
    restTimerRunning = false;
    const display = document.getElementById('restTimerDisplay');
    if (display) { display.innerText = '0:00'; display.style.color = '#2196f3'; }
};

// ==========================================
// BODYWEIGHT CHART — NEW FEATURE
// ==========================================
function getBodyweightHistory() {
    return JSON.parse(localStorage.getItem('bwHistory') || '[]');
}

function saveBodyweightEntry(bw) {
    const history = getBodyweightHistory();
    history.push({ date: new Date().toLocaleDateString('en-US'), bw: parseFloat(bw) });
    // Keep last 90 entries
    if (history.length > 90) history.shift();
    localStorage.setItem('bwHistory', JSON.stringify(history));
}

window.openBWChart = function() {
    const history = getBodyweightHistory();
    const modal = document.createElement('div');
    modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9000;display:flex;align-items:center;justify-content:center;`;

    if (history.length < 2) {
        modal.innerHTML = `<div style="background:#1e1e1e;padding:30px;border-radius:12px;color:#fff;text-align:center;max-width:400px;">
            <h3 style="color:#2196f3;">📈 Bodyweight Chart</h3>
            <p style="color:#aaa;">Not enough data yet. Log your bodyweight in Settings after each workout and come back when you have at least 2 entries.</p>
            <button onclick="this.closest('[style*=\"fixed\"]').remove()" style="background:#2196f3;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;margin-top:15px;">Close</button>
        </div>`;
        document.body.appendChild(modal);
        return;
    }

    const W = Math.min(700, window.innerWidth - 40);
    const H = 300;
    const pad = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const bws = history.map(h => h.bw);
    const minBW = Math.min(...bws) - 2;
    const maxBW = Math.max(...bws) + 2;

    const pts = history.map((h, i) => {
        const x = pad.left + (i / (history.length - 1)) * chartW;
        const y = pad.top + chartH - ((h.bw - minBW) / (maxBW - minBW)) * chartH;
        return { x, y, ...h };
    });

    const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
    const area = `${pts[0].x},${pad.top + chartH} ` + pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${pts[pts.length-1].x},${pad.top + chartH}`;

    // Y-axis labels
    let yLabels = '';
    for (let i = 0; i <= 4; i++) {
        const val = (minBW + (i / 4) * (maxBW - minBW)).toFixed(1);
        const y = pad.top + chartH - (i / 4) * chartH;
        yLabels += `<text x="${pad.left - 8}" y="${y + 4}" fill="#888" font-size="11" text-anchor="end">${val}</text>`;
        yLabels += `<line x1="${pad.left}" y1="${y}" x2="${pad.left + chartW}" y2="${y}" stroke="#333" stroke-width="1" stroke-dasharray="4"/>`;
    }

    // X-axis labels — show every ~7th
    let xLabels = '';
    const step = Math.max(1, Math.floor(history.length / 8));
    pts.forEach((p, i) => {
        if (i % step === 0 || i === pts.length - 1) {
            xLabels += `<text x="${p.x}" y="${pad.top + chartH + 20}" fill="#888" font-size="10" text-anchor="middle">${p.date}</text>`;
        }
    });

    const trend = history.length >= 3 ? (() => {
        const first3 = bws.slice(0, 3).reduce((a,b) => a+b, 0) / 3;
        const last3 = bws.slice(-3).reduce((a,b) => a+b, 0) / 3;
        const diff = (last3 - first3).toFixed(1);
        return diff > 0 ? `+${diff} lbs trend ↑` : `${diff} lbs trend ↓`;
    })() : '';

    modal.innerHTML = `<div style="background:#1e1e1e;padding:20px;border-radius:12px;color:#fff;width:${W+40}px;max-width:95vw;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
            <h3 style="margin:0;color:#2196f3;">📈 Bodyweight History</h3>
            <button onclick="this.closest('[style*=\"fixed\"]').remove()" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;">✕</button>
        </div>
        <svg width="${W}" height="${H}" style="display:block;">
            <defs>
                <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#2196f3" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#2196f3" stop-opacity="0"/>
                </linearGradient>
            </defs>
            ${yLabels}${xLabels}
            <polygon points="${area}" fill="url(#bwGrad)"/>
            <polyline points="${polyline}" fill="none" stroke="#2196f3" stroke-width="2.5"/>
            ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#2196f3" stroke="#1e1e1e" stroke-width="2">
                <title>${p.date}: ${p.bw} lbs</title></circle>`).join('')}
        </svg>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid #333;">
            <span style="color:#aaa;font-size:13px;">${history.length} entries | ${trend}</span>
            <button onclick="if(confirm('Clear all bodyweight history?')){localStorage.removeItem('bwHistory');this.closest('[style*=\"fixed\"]').remove();toast('History cleared');}" 
                style="background:#c62828;color:#fff;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;font-size:12px;">Clear History</button>
        </div>
    </div>`;
    document.body.appendChild(modal);
};

// ==========================================
// PR TRACKER — NEW FEATURE
// Stores all-time PRs per lift, logs history
// with date + weight, shows chart + badge
// ==========================================
function getPRData() {
    return JSON.parse(localStorage.getItem('prData') || '{}');
}
function savePRData(data) {
    localStorage.setItem('prData', JSON.stringify(data));
}

// Call this whenever a weight is confirmed as a PR
window.logPR = function(liftName, weight, reps) {
    const data = getPRData();
    if (!data[liftName]) data[liftName] = { current: 0, history: [] };
    const entry = { date: new Date().toLocaleDateString('en-US'), weight: parseFloat(weight), reps: parseInt(reps) || 1 };
    data[liftName].history.push(entry);
    // Update current PR if heavier
    if (entry.weight > data[liftName].current) {
        data[liftName].current = entry.weight;
        savePRData(data);
        toast(`🏆 New PR on ${liftName}: ${weight} lbs!`);
    } else {
        savePRData(data);
        toast(`Logged ${weight} lbs x${entry.reps} for ${liftName}`, 'info');
    }
};

window.openPRTracker = function(filterMonths) {
    const data = getPRData();
    const lifts = Object.keys(data);
    filterMonths = filterMonths || 0; // 0 = all time

    const modal = document.createElement('div');
    modal.id = 'prTrackerModal';
    modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:9000;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px 0;`;
    const W = Math.min(720, window.innerWidth - 40);

    // Filter history by date range
    function filterHistory(history) {
        if (!filterMonths) return history;
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - filterMonths);
        return history.filter(h => new Date(h.date) >= cutoff);
    }

    // Range buttons
    const ranges = [{label:'1M', months:1},{label:'3M', months:3},{label:'6M', months:6},{label:'1Y', months:12},{label:'All', months:0}];
    const rangeHtml = ranges.map(r =>
        `<button onclick="document.getElementById('prTrackerModal').remove();openPRTracker(${r.months})"
            style="background:${filterMonths===r.months?'#FFD700':'#222'};color:${filterMonths===r.months?'#000':'#aaa'};border:1px solid ${filterMonths===r.months?'#FFD700':'#444'};border-radius:5px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:bold;">${r.label}</button>`
    ).join('');

    let chartsHtml = '';
    if (lifts.length === 0) {
        chartsHtml = `<p style="color:#aaa;text-align:center;margin:30px 0;">No PRs logged yet.<br>Hit the 🏆 button next to any lift to log a PR.</p>`;
    } else {
        lifts.forEach(liftName => {
            const d = data[liftName];
            if (!d.history || d.history.length === 0) return;
            const filtered = filterHistory(d.history);
            if (filtered.length === 0) return;

            const weights = filtered.map(h => h.weight);
            const minW = Math.min(...weights) - 5, maxW = Math.max(...weights) + 5;
            const cW = Math.min(W - 40, 620), cH = 160;
            const pad = { top:15, right:15, bottom:38, left:48 };
            const chartW = cW - pad.left - pad.right, chartH = cH - pad.top - pad.bottom;

            const pts = filtered.map((h, i) => ({
                x: pad.left + (filtered.length > 1 ? (i/(filtered.length-1))*chartW : chartW/2),
                y: pad.top + chartH - ((h.weight - minW) / (maxW - minW || 1)) * chartH,
                ...h
            }));

            const polyline = pts.map(p=>`${p.x},${p.y}`).join(' ');
            const area = `${pts[0].x},${pad.top+chartH} `+pts.map(p=>`${p.x},${p.y}`).join(' ')+` ${pts[pts.length-1].x},${pad.top+chartH}`;

            // Y axis — 4 gridlines
            let yLabels = '';
            [0, 0.33, 0.66, 1].forEach(frac => {
                const val = Math.round(minW + frac*(maxW-minW));
                const y = pad.top + chartH - frac*chartH;
                yLabels += `<text x="${pad.left-6}" y="${y+4}" fill="#555" font-size="10" text-anchor="end">${val}</text>`;
                yLabels += `<line x1="${pad.left}" y1="${y}" x2="${pad.left+chartW}" y2="${y}" stroke="#2a2a2a" stroke-width="1"/>`;
            });

            // X axis — sparse date labels
            let xLabels = '';
            const step = Math.max(1, Math.floor(filtered.length / 6));
            pts.forEach((p, i) => {
                if (i % step === 0 || i === pts.length-1)
                    xLabels += `<text x="${p.x}" y="${pad.top+chartH+18}" fill="#555" font-size="9" text-anchor="middle">${p.date}</text>`;
            });

            // Personal best line
            const allTimeBest = Math.max(...d.history.map(h=>h.weight));
            const pbY = pad.top + chartH - ((allTimeBest - minW)/(maxW - minW || 1))*chartH;
            const pbLine = allTimeBest <= maxW && allTimeBest >= minW
                ? `<line x1="${pad.left}" y1="${pbY}" x2="${pad.left+chartW}" y2="${pbY}" stroke="#FFD700" stroke-width="1" stroke-dasharray="4" opacity="0.4"/>
                   <text x="${pad.left+chartW+2}" y="${pbY+4}" fill="#FFD700" font-size="9">PB</text>`
                : '';

            const gradId = `grad_${liftName.replace(/\W/g,'_')}`;
            const entryCount = d.history.length;
            const filteredMax = Math.max(...filtered.map(h=>h.weight));
            const trend = filtered.length >= 2
                ? (() => { const diff = filtered[filtered.length-1].weight - filtered[0].weight; return diff >= 0 ? `+${diff} lbs ↑` : `${diff} lbs ↓`; })()
                : '';

            chartsHtml += `<div style="background:#111;border:1px solid #2a2a2a;border-radius:10px;padding:15px;margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div>
                        <span style="font-weight:900;font-size:1em;color:#fff;">${liftName}</span>
                        <span style="color:#555;font-size:11px;margin-left:8px;">${entryCount} sessions total</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="color:#FFD700;font-weight:900;font-size:1.1em;">🏆 ${allTimeBest} lbs</span>
                        ${trend ? `<span style="font-size:11px;color:${trend.includes('↑')?'#4caf50':'#ff5722'};">${trend}</span>` : ''}
                        <button onclick="clearLiftPR('${liftName}')" style="background:none;border:1px solid #333;color:#555;border-radius:4px;padding:2px 7px;cursor:pointer;font-size:11px;">Clear</button>
                    </div>
                </div>
                <svg width="${cW}" height="${cH}" style="display:block;overflow:visible;">
                    <defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#FFD700" stop-opacity="0.2"/>
                        <stop offset="100%" stop-color="#FFD700" stop-opacity="0"/>
                    </linearGradient></defs>
                    ${yLabels}${xLabels}${pbLine}
                    <polygon points="${area}" fill="url(#${gradId})"/>
                    <polyline points="${polyline}" fill="none" stroke="#FFD700" stroke-width="2"/>
                    ${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="${p.weight===allTimeBest?5:3.5}" fill="${p.weight===allTimeBest?'#FFD700':'#b8860b'}" stroke="#111" stroke-width="2">
                        <title>${p.date}: ${p.weight} lbs x${p.reps}</title></circle>`).join('')}
                </svg>
                <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                    ${filtered.slice(-6).reverse().map(h =>
                        `<span style="background:#1a1a1a;border:1px solid ${h.weight===allTimeBest?'#FFD700':'#333'};border-radius:4px;padding:3px 8px;font-size:11px;color:#aaa;">
                            ${h.date}: <strong style="color:${h.weight===allTimeBest?'#FFD700':'#fff'};">${h.weight}</strong> x${h.reps}</span>`
                    ).join('')}
                </div>
            </div>`;
        });
        if (!chartsHtml) chartsHtml = `<p style="color:#aaa;text-align:center;margin:20px 0;">No entries in this time range.</p>`;
    }

    const liftOptions = ['Squat','Bench','Deadlift','OHP','Pause Squat','Floor Press','Close Grip Bench','Block Pulls (Smart)','Other'];
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.innerHTML = `<div style="background:#1a1a1a;border:1px solid #333;border-radius:14px;padding:22px;width:${W}px;max-width:95vw;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h2 style="margin:0;color:#FFD700;">🏆 PR Tracker</h2>
            <button id="prTrackerCloseBtn" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;line-height:1;">✕</button>

        <!-- Date range filter -->
        <div style="display:flex;gap:6px;margin-bottom:18px;align-items:center;">
            <span style="color:#555;font-size:12px;margin-right:4px;">Range:</span>
            ${rangeHtml}
        </div>

        <!-- Quick log form -->
        <div style="background:#111;border:1px solid #333;border-radius:8px;padding:14px;margin-bottom:20px;">
            <div style="font-size:12px;color:#aaa;margin-bottom:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Log a Session</div>
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;align-items:end;">
                <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Lift</label>
                    <select id="prLiftName" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:8px;border-radius:5px;">${liftOptions.map(l=>`<option>${l}</option>`).join('')}</select></div>
                <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Weight (lbs)</label>
                    <input type="number" id="prWeight" placeholder="315" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:8px;border-radius:5px;"></div>
                <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Reps</label>
                    <input type="number" id="prReps" placeholder="1" value="1" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:8px;border-radius:5px;"></div>
                <button onclick="
                    const n=document.getElementById('prLiftName').value;
                    const w=document.getElementById('prWeight').value;
                    const r=document.getElementById('prReps').value;
                    if(w){logPR(n,w,r);document.getElementById('prTrackerModal').remove();setTimeout(()=>openPRTracker(${filterMonths}),200);}"
                    style="background:#FFD700;color:#000;border:none;padding:8px 14px;border-radius:5px;cursor:pointer;font-weight:900;font-size:13px;">Log</button>
            </div>
        </div>

        <div>${chartsHtml}</div>
    </div>`;
    document.body.appendChild(modal);
    document.getElementById('prTrackerCloseBtn').addEventListener('click', () => modal.remove());
};

window.clearLiftPR = function(liftName) {
    if (!confirm(`Clear all PR history for ${liftName}?`)) return;
    const data = getPRData();
    delete data[liftName];
    savePRData(data);
    toast(`${liftName} PR history cleared`, 'info');
    const existing = document.getElementById('prTrackerModal');
    if (existing) existing.remove();
    setTimeout(() => window.openPRTracker(), 200);
};

// ==========================================
// RPE LOGGING — NEW FEATURE
// Log RPE 1-10 per set, stored by lift+date
// Shown inline as colored dots under set/rep
// ==========================================
function getRPELog() {
    return JSON.parse(localStorage.getItem('rpeLog') || '{}');
}
function saveRPELog(log) {
    localStorage.setItem('rpeLog', JSON.stringify(log));
}

function rpeColor(rpe) {
    if (rpe <= 6) return '#4caf50';
    if (rpe <= 7) return '#8bc34a';
    if (rpe === 8) return '#ff9800';
    if (rpe === 9) return '#ff5722';
    return '#f44336';
}

function rpeLabel(rpe) {
    const labels = { 6:'Easy', 7:'Moderate', 8:'Hard', 9:'Very Hard', 10:'Max' };
    return labels[rpe] || '';
}

window.logRPE = function(liftId, rpe) {
    const log = getRPELog();
    const today = new Date().toLocaleDateString('en-US');
    if (!log[today]) log[today] = {};
    log[today][liftId] = parseInt(rpe);
    // Keep full history — no expiry
    saveRPELog(log);
    // Re-render the RPE badge inline without full re-render
    const badge = document.getElementById(`rpe-badge-${CSS.escape(liftId)}`);
    if (badge) {
        const color = rpeColor(rpe);
        badge.innerHTML = `<span style="background:${color};color:#000;border-radius:3px;padding:1px 5px;font-size:10px;font-weight:900;">RPE ${rpe}</span>`;
    }
    toast(`RPE ${rpe} — ${rpeLabel(rpe)} logged`, 'info');
};

// Builds the inline RPE picker HTML for a given lift row
function buildRPEPicker(liftId) {
    const log = getRPELog();
    const today = new Date().toLocaleDateString('en-US');
    const existing = log[today] && log[today][liftId];
    const color = existing ? rpeColor(existing) : null;
    const safeId = liftId.replace(/'/g, '_');

    const badge = existing
        ? `<span style="background:${color};color:#000;border-radius:3px;padding:1px 5px;font-size:10px;font-weight:900;">RPE ${existing}</span>`
        : `<span style="color:#444;font-size:10px;">RPE?</span>`;

    const dots = [6,7,8,9,10].map(r => {
        const c = rpeColor(r);
        const sel = existing === r ? 'border:2px solid #fff;' : 'border:2px solid transparent;';
        return `<span onclick="logRPE('${safeId}',${r})" title="RPE ${r}" style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${c};cursor:pointer;${sel}vertical-align:middle;"></span>`;
    }).join('');

    return `<div id="rpe-badge-${safeId}" style="margin-top:3px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">${badge}<span style="color:#333;font-size:10px;">|</span>${dots}</div>`;
}

// ==========================================
// MISSED LIFT DIAGNOSTIC — NEW FEATURE
// ==========================================
const missedLiftReasons = [
    { id:'injury',   label:'Small Injuries (Knee/Back)', pct:30, detail:'Neurological inhibition from patellar tendon or SI joint tweaks. Your brain shuts down power production to protect the joint, shifting your bar path out of the groove.' },
    { id:'program',  label:'Programming / Fatigue Mismanagement', pct:25, detail:'CNS fatigue masking fitness. If volume was pushed too hard last week or the taper was mismanaged, speed off the chest or out of the hole won\'t be there.' },
    { id:'equip',    label:'Change in Equipment', pct:15, detail:'Switching racks, bars, pads, or even new sleeves changes your brace, walkout timing, and stretch reflex. Calibration to a specific setup matters at elite weights.' },
    { id:'eating',   label:'Under Eating / Low Fuel', pct:15, detail:'Low glycogen = less ATP. Less food volume = weaker brace against the belt. CNS sluggishness makes the weight feel 20 lbs heavier before you even unrack.' },
    { id:'hormonal', label:'Hormonal / Cycle Factors (optional)', pct:10, detail:'Fluctuations in estrogen and progesterone can impact recovery, core temp, joint laxity, and how belts/sleeves fit — measurable variables on a max-effort day.' },
    { id:'schedule', label:'Schedule / Circadian Shift', pct:5, detail:'Circadian rhythm affects CNS readiness. A shift from your adapted training time leaves the body flat. Caffeine and environment can partially override this.' }
];

window.openMissedLiftDiag = function() {
    const existing = document.getElementById('missedLiftModal');
    if(existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'missedLiftModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:9500;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px 0;';
    modal.addEventListener('click', e => { if(e.target === modal) modal.remove(); });

    const currentWeek = activeMobileWeek + 1;
    const mode = document.getElementById('dashMode').value;
    const modeName = document.getElementById('dashMode').options[document.getElementById('dashMode').selectedIndex].text;

    // Get day names from current program
    let availableDays = [];
    if(userProgram.length > 0 && userProgram[activeMobileWeek]) {
        availableDays = userProgram[activeMobileWeek].days.map(d => d.name);
    } else {
        availableDays = ['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6'];
    }

    const sMax = parseFloat(document.getElementById('squatInput').value) || 0;
    const bMax = parseFloat(document.getElementById('benchInput').value) || 0;
    const dMax = parseFloat(document.getElementById('deadliftInput').value) || 0;

    const reasonCheckboxes = missedLiftReasons.map(r => `
        <label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:#1a1a1a;border:1px solid #333;border-radius:8px;cursor:pointer;transition:all 0.2s;"
               onmouseover="this.style.borderColor='#555'" onmouseout="this.style.borderColor=this.querySelector('input').checked?'#d32f2f':'#333'">
            <input type="checkbox" value="${r.id}" data-pct="${r.pct}" style="margin-top:3px;accent-color:#d32f2f;width:18px;height:18px;flex-shrink:0;"
                   onchange="updateMissedLiftCalc()">
            <div>
                <div style="font-weight:700;color:#fff;font-size:0.95em;">${r.label} <span style="color:#d32f2f;font-size:0.8em;">(−${r.pct}%)</span></div>
                <div style="color:#777;font-size:0.75em;margin-top:4px;line-height:1.4;">${r.detail}</div>
            </div>
        </label>
    `).join('');

    const dayOptions = availableDays.map((d,i) => `<option value="${d}"${i===0?' selected':''}>${d}</option>`).join('');

    modal.innerHTML = `
    <div style="background:#111;border:1px solid #333;border-radius:14px;padding:24px;width:95%;max-width:600px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <h2 style="margin:0;color:#d32f2f;font-size:1.3em;">❌ Missed Lift Diagnostic</h2>
            <button onclick="document.getElementById('missedLiftModal').remove()" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;">✕</button>
        </div>

        <div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:16px;margin-bottom:18px;">
            <div style="font-size:0.75em;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:bold;">Step 1 — What happened?</div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Athlete Name</label>
                    <input type="text" id="mld-name" placeholder="Full Name" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:10px;border-radius:6px;font-size:0.9em;">
                </div>
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Which Lift?</label>
                    <select id="mld-lift" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:10px;border-radius:6px;font-size:0.9em;">
                        <option value="Squat">Squat</option>
                        <option value="Bench">Bench</option>
                        <option value="Deadlift">Deadlift</option>
                    </select>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Weight Missed (lbs)</label>
                    <input type="number" id="mld-weight" placeholder="e.g. 455" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:10px;border-radius:6px;font-size:0.9em;" oninput="updateMissedLiftCalc()">
                </div>
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Session Day</label>
                    <select id="mld-day" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:10px;border-radius:6px;font-size:0.9em;">
                        ${dayOptions}
                    </select>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Current Week / Mode</label>
                    <div style="background:#222;border:1px solid #444;padding:10px;border-radius:6px;color:#2196f3;font-weight:bold;font-size:0.85em;">
                        Week ${currentWeek} · ${modeName}
                    </div>
                </div>
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Program Max</label>
                    <div id="mld-programmax" style="background:#222;border:1px solid #444;padding:10px;border-radius:6px;color:#FFD700;font-weight:bold;font-size:0.9em;">—</div>
                </div>
            </div>
        </div>

        <div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:16px;margin-bottom:18px;">
            <div style="font-size:0.75em;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:bold;">Step 2 — Why did you miss? <span style="color:#555;">(select all that apply)</span></div>
            <div style="display:flex;flex-direction:column;gap:8px;" id="mld-reasons">
                ${reasonCheckboxes}
            </div>
        </div>

        <div id="mld-result" style="background:#0a1a0a;border:2px solid #2e7d32;border-radius:10px;padding:16px;margin-bottom:18px;display:none;">
            <div style="font-size:0.75em;color:#4caf50;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:bold;">Adjusted Weight Recommendation</div>
            <div style="display:flex;align-items:baseline;gap:12px;">
                <span id="mld-adjusted" style="font-size:2em;font-weight:900;color:#4caf50;">—</span>
                <span id="mld-reduction" style="color:#888;font-size:0.9em;"></span>
            </div>
            <div id="mld-breakdown" style="margin-top:10px;font-size:0.8em;color:#666;"></div>
        </div>

        <div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:16px;margin-bottom:18px;">
            <div style="font-size:0.75em;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:bold;">Step 3 — Notes <span style="color:#555;">(optional)</span></div>
            <textarea id="mld-notes" rows="3" placeholder="Any additional context — how the warm-ups felt, sleep quality, where in the lift you missed, etc."
                style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:10px;border-radius:6px;font-size:0.85em;resize:vertical;font-family:inherit;"></textarea>
        </div>

        <button onclick="sendMissedLiftEmail()" style="width:100%;padding:16px;background:#d32f2f;color:#fff;border:none;border-radius:8px;font-weight:900;font-size:1em;cursor:pointer;text-transform:uppercase;letter-spacing:1px;transition:all 0.2s;"
                onmouseover="this.style.background='#f44336'" onmouseout="this.style.background='#d32f2f'">
            📧 Send Diagnostic Report to Coach
        </button>
        <p style="text-align:center;color:#555;font-size:0.7em;margin-top:8px;">Opens your email client with the full report pre-filled → andreze@me.com</p>
    </div>`;

    document.body.appendChild(modal);

    // Auto-fill program max based on selected lift
    const liftSel = document.getElementById('mld-lift');
    function updateProgramMax() {
        const lift = liftSel.value;
        const max = lift === 'Squat' ? sMax : lift === 'Bench' ? bMax : dMax;
        document.getElementById('mld-programmax').innerText = max > 0 ? max + ' lbs' : 'Not set';
    }
    liftSel.addEventListener('change', () => { updateProgramMax(); updateMissedLiftCalc(); });
    updateProgramMax();
};

window.updateMissedLiftCalc = function() {
    const weight = parseFloat(document.getElementById('mld-weight').value) || 0;
    const resultBox = document.getElementById('mld-result');
    const adjustedEl = document.getElementById('mld-adjusted');
    const reductionEl = document.getElementById('mld-reduction');
    const breakdownEl = document.getElementById('mld-breakdown');

    const checked = document.querySelectorAll('#mld-reasons input[type="checkbox"]:checked');
    let totalPct = 0;
    let reasons = [];

    checked.forEach(cb => {
        const pct = parseInt(cb.dataset.pct);
        totalPct += pct;
        const r = missedLiftReasons.find(x => x.id === cb.value);
        reasons.push({ label: r.label, pct });
        cb.closest('label').style.borderColor = '#d32f2f';
    });

    document.querySelectorAll('#mld-reasons input[type="checkbox"]:not(:checked)').forEach(cb => {
        cb.closest('label').style.borderColor = '#333';
    });

    if(weight > 0 && totalPct > 0) {
        const cappedPct = Math.min(totalPct, 80);
        const adjusted = Math.round((weight * (1 - cappedPct/100)) / 5) * 5;
        resultBox.style.display = 'block';
        adjustedEl.innerText = adjusted + ' lbs';
        reductionEl.innerText = `(−${cappedPct}% from ${weight} lbs)`;
        breakdownEl.innerHTML = reasons.map(r => `<span style="display:inline-block;background:#1a2a1a;border:1px solid #2e7d32;border-radius:4px;padding:2px 8px;margin:2px;">${r.label}: −${r.pct}%</span>`).join(' ');
    } else if(weight > 0 && totalPct === 0) {
        resultBox.style.display = 'block';
        adjustedEl.innerText = weight + ' lbs';
        reductionEl.innerText = '(no reasons selected — select at least one)';
        breakdownEl.innerHTML = '';
    } else {
        resultBox.style.display = 'none';
    }
};

window.sendMissedLiftEmail = function() {
    const name = document.getElementById('mld-name').value.trim();
    const lift = document.getElementById('mld-lift').value;
    const weight = document.getElementById('mld-weight').value;
    const day = document.getElementById('mld-day').value;
    const notes = document.getElementById('mld-notes').value.trim();
    const currentWeek = activeMobileWeek + 1;
    const mode = document.getElementById('dashMode').value;
    const modeName = document.getElementById('dashMode').options[document.getElementById('dashMode').selectedIndex].text;

    const sMax = parseFloat(document.getElementById('squatInput').value) || 0;
    const bMax = parseFloat(document.getElementById('benchInput').value) || 0;
    const dMax = parseFloat(document.getElementById('deadliftInput').value) || 0;
    const oMax = parseFloat(document.getElementById('ohpInput').value) || 0;
    const programMax = lift === 'Squat' ? sMax : lift === 'Bench' ? bMax : dMax;

    if(!name) { toast('Enter the athlete name', 'error'); return; }
    if(!weight) { toast('Enter the weight that was missed', 'error'); return; }

    const checked = document.querySelectorAll('#mld-reasons input[type="checkbox"]:checked');
    if(checked.length === 0) { toast('Select at least one reason', 'error'); return; }

    let totalPct = 0;
    let reasonLines = [];
    checked.forEach(cb => {
        const pct = parseInt(cb.dataset.pct);
        totalPct += pct;
        const r = missedLiftReasons.find(x => x.id === cb.value);
        reasonLines.push(`• ${r.label} (−${r.pct}%)`);
    });

    const cappedPct = Math.min(totalPct, 80);
    const adjusted = Math.round((parseFloat(weight) * (1 - cappedPct/100)) / 5) * 5;

    // Build overview snapshot from current program
    let overviewLines = [];
    if(userProgram.length > 0) {
        const reps = parseInt(document.getElementById('dashReps').value) || 5;
        const startPct = basePctMap[reps] || 0.75;
        const overloadPct = parseFloat(document.getElementById('overloadInput').value) || 0;
        const fastedMult = isFasted ? 0.935 : 1.0;

        for(let w = 0; w < userProgram.length; w++) {
            let mod = (mode === 'maintenance' ? w * maintProg : w * standardProg);
            if(mode === 'deload') mod = (w === 0 ? -0.08 : -0.04);
            let curPct = startPct + mod;

            let weekLines = [`Week ${w+1} (${Math.round((curPct+overloadPct)*100*fastedMult)}%):`];
            userProgram[w].days.forEach(day => {
                let dayLifts = day.lifts.filter(l => !l.isLabel).map(l => {
                    const mx = l.t==='ohp' ? oMax : l.t==='squat' ? sMax : l.t==='deadlift' ? dMax : bMax;
                    const load = mx > 0 ? Math.round((mx * (curPct + overloadPct) * fastedMult) / 5) * 5 : Math.round(curPct * 100) + '%';
                    return `  ${l.n}: @ ${load}${typeof load === 'number' ? ' lbs' : ''}`;
                }).join('\n');
                weekLines.push(`  ${day.name}:\n${dayLifts}`);
            });
            overviewLines.push(weekLines.join('\n'));
        }
    }

    const today = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    const subject = `Missed Lift — ${name} — ${lift} — ${today}`;

    const body = `MISSED LIFT DIAGNOSTIC REPORT
================================
Date: ${today}
Athlete: ${name}
Program: Base Map Linear
Mode: ${modeName}
Week: ${currentWeek}
Session: ${day}
Fasted: ${isFasted ? 'YES' : 'No'}

MISSED LIFT
-----------
Lift: ${lift}
Program Max: ${programMax} lbs
Weight Missed: ${weight} lbs

REASONS IDENTIFIED
------------------
${reasonLines.join('\n')}

Total Adjustment: −${cappedPct}%

RECOMMENDED WEIGHT FOR TODAY
-----------------------------
${adjusted} lbs (down from ${weight} lbs)

${notes ? `ATHLETE NOTES\n-------------\n${notes}\n` : ''}
PROGRAM OVERVIEW
${'='.repeat(30)}
Maxes: S:${sMax} | B:${bMax} | D:${dMax} | OHP:${oMax}

${overviewLines.join('\n\n')}

================================
Sent from Andre's Calibrations
Missed Lift Diagnostic Tool`;

    const mailto = `mailto:andreze@me.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    toast('Opening email client…', 'info');

    setTimeout(() => {
        const m = document.getElementById('missedLiftModal');
        if(m) m.remove();
    }, 1000);
};

// ==========================================
// DOTS CALCULATOR — MALE/FEMALE + CLICKABLE
// ==========================================
let userSex = localStorage.getItem('userSex') || 'male';

function calculateDots(total, bw, sex) {
    if(!bw||!total) return '-';
    let w=parseFloat(bw)/2.20462, t=parseFloat(total)/2.20462;
    sex = sex || userSex || 'male';
    let den;
    if(sex === 'female') {
        den = -0.0000010706*Math.pow(w,4)+0.0005158568*Math.pow(w,3)-0.1126655495*Math.pow(w,2)+13.6175032*w-57.96288;
    } else {
        den = -0.000001093*Math.pow(w,4)+0.0007391293*Math.pow(w,3)-0.1918751679*Math.pow(w,2)+24.0900756*w-307.75076;
    }
    return (t*(500/den)).toFixed(2);
}

window.openDotsCalc = function() {
    const existing = document.getElementById('dotsCalcModal');
    if(existing) existing.remove();
    const sMax = parseFloat(document.getElementById('squatInput').value)||0;
    const bMax = parseFloat(document.getElementById('benchInput').value)||0;
    const dMax = parseFloat(document.getElementById('deadliftInput').value)||0;
    const total = sMax+bMax+dMax;
    const bw = localStorage.getItem('baseBW') || '';
    const sex = userSex;
    const modal = document.createElement('div');
    modal.id = 'dotsCalcModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:9000;display:flex;align-items:center;justify-content:center;';
    modal.addEventListener('click', e => { if(e.target === modal) modal.remove(); });
    modal.innerHTML = `<div style="background:var(--surface,#1e1e1e);border:1px solid var(--border,#333);border-radius:14px;padding:24px;width:90%;max-width:380px;color:var(--text,#fff);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 style="margin:0;color:#FFD700;">DOTS Calculator</h3>
            <button onclick="document.getElementById('dotsCalcModal').remove()" style="background:none;border:none;color:var(--text,#fff);font-size:22px;cursor:pointer;">✕</button>
        </div>
        <div style="display:grid;gap:12px;">
            <div>
                <label style="font-size:0.7em;color:var(--text-muted,#888);display:block;margin-bottom:4px;">Total (S+B+D)</label>
                <input type="number" id="dotsTotal" value="${total}" style="width:100%;background:var(--surface2,#222);color:var(--text,#fff);border:1px solid var(--border,#444);padding:10px;border-radius:6px;" oninput="recalcDots()">
            </div>
            <div>
                <label style="font-size:0.7em;color:var(--text-muted,#888);display:block;margin-bottom:4px;">Bodyweight (lbs)</label>
                <input type="number" id="dotsBW" value="${bw}" placeholder="Enter bodyweight" style="width:100%;background:var(--surface2,#222);color:var(--text,#fff);border:1px solid var(--border,#444);padding:10px;border-radius:6px;" oninput="recalcDots()">
            </div>
            <div>
                <label style="font-size:0.7em;color:var(--text-muted,#888);display:block;margin-bottom:4px;">Sex</label>
                <div style="display:flex;gap:8px;">
                    <button onclick="setDotsSex('male')" id="dotsSexM" style="flex:1;padding:10px;border-radius:6px;font-weight:bold;cursor:pointer;border:2px solid ${sex==='male'?'#2196f3':'var(--border,#444)'};background:${sex==='male'?'rgba(33,150,243,0.15)':'var(--surface2,#222)'};color:var(--text,#fff);">Male</button>
                    <button onclick="setDotsSex('female')" id="dotsSexF" style="flex:1;padding:10px;border-radius:6px;font-weight:bold;cursor:pointer;border:2px solid ${sex==='female'?'#e91e63':'var(--border,#444)'};background:${sex==='female'?'rgba(233,30,99,0.15)':'var(--surface2,#222)'};color:var(--text,#fff);">Female</button>
                </div>
            </div>
            <div style="text-align:center;padding:16px;background:var(--surface2,#222);border-radius:8px;border:1px solid #FFD700;">
                <div style="font-size:0.7em;color:#FFD700;text-transform:uppercase;letter-spacing:1px;">DOTS Score</div>
                <div id="dotsValue" style="font-size:2.5em;font-weight:900;color:#FFD700;margin-top:4px;">${calculateDots(total,bw,sex)}</div>
            </div>
        </div>
    </div>`;
    document.body.appendChild(modal);
};

window.setDotsSex = function(sex) {
    userSex = sex;
    localStorage.setItem('userSex', sex);
    const mBtn = document.getElementById('dotsSexM');
    const fBtn = document.getElementById('dotsSexF');
    if(mBtn) { mBtn.style.borderColor = sex==='male' ? '#2196f3' : 'var(--border,#444)'; mBtn.style.background = sex==='male' ? 'rgba(33,150,243,0.15)' : 'var(--surface2,#222)'; }
    if(fBtn) { fBtn.style.borderColor = sex==='female' ? '#e91e63' : 'var(--border,#444)'; fBtn.style.background = sex==='female' ? 'rgba(233,30,99,0.15)' : 'var(--surface2,#222)'; }
    recalcDots();
};

window.recalcDots = function() {
    const t = parseFloat(document.getElementById('dotsTotal').value)||0;
    const b = parseFloat(document.getElementById('dotsBW').value)||0;
    const el = document.getElementById('dotsValue');
    if(el) el.innerText = calculateDots(t,b,userSex);
};

// ==========================================
// AUTO ACCESSORIES CALCULATOR — NEW FEATURE
// Same decision tree as Andre Map
// ==========================================
const accDecisionTree = {
    squat: {
        q1: { text:"Where does the bar slow down or stop?", options:[
            {label:"In the hole — I get stuck at the bottom", id:"hole"},
            {label:"Midway up — past the hole but before lockout", id:"mid"},
            {label:"At lockout — can't finish standing up", id:"lockout"},
            {label:"On the walkout or unrack — feels too heavy before I even squat", id:"walkout"}
        ]},
        hole: { q2: { text:"When you get stuck in the hole, what happens?", options:[
            {label:"My back rounds and I fold forward", id:"hole_fold"},
            {label:"My hips shoot up but the bar stays low", id:"hole_hips"},
            {label:"I just can't reverse direction — I sink and it dies", id:"hole_dead"}
        ]},
            hole_fold: { name:"Upper Back / Brace Weakness", accessories:[
                {n:"SSB Squat",s:"squat",pctByWeek:[0.65,0.70,0.73,0.68],repsByWeek:["3x6","3x5","3x4","2x3"]},
                {n:"Front Squat",s:"squat",pctByWeek:[0.55,0.60,0.63,0.58],repsByWeek:["3x6","3x5","3x4","2x3"]},
                {n:"Weighted Planks",s:"squat",pctByWeek:[0,0,0,0],repsByWeek:["3x45s","3x50s","3x55s","3x45s"]}
            ]},
            hole_hips: { name:"Quad Weakness", accessories:[
                {n:"Pause Squat (3s)",s:"squat",pctByWeek:[0.62,0.67,0.70,0.65],repsByWeek:["3x4","3x3","3x3","2x2"]},
                {n:"Belt Squat",s:"squat",pctByWeek:[0.55,0.60,0.63,0.58],repsByWeek:["3x10","3x8","3x6","3x5"]},
                {n:"Leg Press",s:"squat",pctByWeek:[1.20,1.30,1.40,1.20],repsByWeek:["4x10","4x8","3x8","3x6"]}
            ]},
            hole_dead: { name:"Reversal Strength", accessories:[
                {n:"Pin Squat (Low)",s:"squat",pctByWeek:[0.60,0.65,0.70,0.65],repsByWeek:["3x3","3x3","3x2","2x2"]},
                {n:"1.5 Rep Squat",s:"squat",pctByWeek:[0.55,0.58,0.60,0.55],repsByWeek:["3x5","3x4","3x3","2x3"]},
                {n:"Box Squat",s:"squat",pctByWeek:[0.65,0.70,0.73,0.68],repsByWeek:["4x3","3x3","3x2","2x2"]}
            ]}
        },
        mid: { name:"Midrange Grind", accessories:[
            {n:"Tempo Squat (5-3-0)",s:"squat",pctByWeek:[0.55,0.58,0.60,0.55],repsByWeek:["3x5","3x4","3x3","2x3"]},
            {n:"Anderson Squat",s:"squat",pctByWeek:[0.70,0.75,0.80,0.73],repsByWeek:["3x3","3x2","2x2","2x1"]},
            {n:"Pause Squat (3s)",s:"squat",pctByWeek:[0.62,0.67,0.70,0.65],repsByWeek:["3x4","3x3","3x3","2x2"]}
        ]},
        lockout: { name:"Lockout Weakness", accessories:[
            {n:"Anderson Squat",s:"squat",pctByWeek:[0.75,0.80,0.85,0.78],repsByWeek:["3x3","3x2","2x2","2x1"]},
            {n:"Heavy Walkout",s:"squat",pctByWeek:[1.05,1.08,1.10,1.05],repsByWeek:["3x15s","3x15s","2x15s","2x10s"]}
        ]},
        walkout: { name:"CNS / Confidence Issue", accessories:[
            {n:"Heavy Walkout",s:"squat",pctByWeek:[1.05,1.08,1.10,1.05],repsByWeek:["3x15s","3x15s","2x15s","2x10s"]},
            {n:"Supramax Eccentric",s:"squat",pctByWeek:[1.0,1.03,1.05,1.0],repsByWeek:["3x1","2x1","2x1","2x1"]}
        ]}
    },
    bench: {
        q1: { text:"Where does the bar slow down or stop?", options:[
            {label:"Off the chest — can't reverse it after the pause", id:"chest"},
            {label:"Midrange — gets past the chest but stalls halfway up", id:"mid"},
            {label:"At lockout — almost there but can't finish", id:"lockout"},
            {label:"Unrack feels shaky — unstable before I even start", id:"unrack"}
        ]},
        chest: { q2: { text:"When it stalls off the chest, what do you feel?", options:[
            {label:"The bar sinks into me — I lose tightness", id:"chest_sink"},
            {label:"I can push but there's no speed — it's just slow", id:"chest_slow"},
            {label:"My shoulders feel weak — like they can't initiate", id:"chest_shoulders"}
        ]},
            chest_sink: { name:"Arch / Tightness Issue", accessories:[
                {n:"Long Pause Bench",s:"bench",pctByWeek:[0.65,0.70,0.73,0.68],repsByWeek:["4x3","3x3","3x2","2x2"]},
                {n:"Larsen Press",s:"bench",pctByWeek:[0.60,0.65,0.68,0.63],repsByWeek:["3x6","3x5","3x4","2x3"]},
                {n:"Spoto Press",s:"bench",pctByWeek:[0.62,0.67,0.70,0.65],repsByWeek:["3x5","3x4","3x3","2x3"]}
            ]},
            chest_slow: { name:"Starting Strength / Speed", accessories:[
                {n:"Dead Press",s:"bench",pctByWeek:[0.65,0.70,0.75,0.70],repsByWeek:["5x1","4x1","3x1","3x1"]},
                {n:"Long Pause Bench",s:"bench",pctByWeek:[0.65,0.70,0.73,0.68],repsByWeek:["4x3","3x3","3x2","2x2"]},
                {n:"Weighted Dips",s:"bench",pctByWeek:[0.20,0.23,0.25,0.20],repsByWeek:["3x8","3x6","3x5","2x5"]}
            ]},
            chest_shoulders: { name:"Anterior Delt Weakness", accessories:[
                {n:"Incline Barbell Bench (Smart)",s:"bench",pctByWeek:[0.60,0.65,0.68,0.63],repsByWeek:["3x8","3x6","3x5","3x4"]},
                {n:"Seated DB Press",s:"ohp",pctByWeek:[0.30,0.33,0.35,0.30],repsByWeek:["3x10","3x8","3x6","2x6"]}
            ]}
        },
        mid: { name:"Midrange Sticking Point", accessories:[
            {n:"Spoto Press",s:"bench",pctByWeek:[0.65,0.70,0.73,0.68],repsByWeek:["3x5","3x4","3x3","2x3"]},
            {n:"Floor Press",s:"bench",pctByWeek:[0.70,0.75,0.78,0.73],repsByWeek:["3x5","3x4","3x3","2x3"]},
            {n:"Close Grip Bench",s:"bench",pctByWeek:[0.65,0.68,0.72,0.67],repsByWeek:["3x8","3x6","3x5","2x5"]}
        ]},
        lockout: { name:"Tricep / Lockout Weakness", accessories:[
            {n:"Floor Press",s:"bench",pctByWeek:[0.72,0.77,0.80,0.75],repsByWeek:["3x5","3x4","3x3","2x3"]},
            {n:"Close Grip Bench",s:"bench",pctByWeek:[0.68,0.72,0.75,0.70],repsByWeek:["3x8","3x6","3x5","2x5"]},
            {n:"Pin Lockouts",s:"bench",pctByWeek:[0.90,0.95,1.00,0.90],repsByWeek:["3x5","3x3","2x3","2x2"]}
        ]},
        unrack: { name:"Stability / Lat Engagement", accessories:[
            {n:"Bamboo Bar",s:"bench",pctByWeek:[0.40,0.43,0.45,0.40],repsByWeek:["3x15","3x12","3x10","2x10"]},
            {n:"Larsen Press",s:"bench",pctByWeek:[0.60,0.65,0.68,0.63],repsByWeek:["3x6","3x5","3x4","2x3"]},
            {n:"Heavy Hold",s:"bench",pctByWeek:[1.05,1.10,1.15,1.05],repsByWeek:["3x15s","3x15s","2x15s","2x10s"]}
        ]}
    },
    deadlift: {
        q1: { text:"Where does the bar slow down or stop?", options:[
            {label:"Off the floor — it barely moves or breaks really slowly", id:"floor"},
            {label:"Around the knees — it clears the floor but stalls at knee height", id:"knees"},
            {label:"At lockout — I can't finish the hip extension", id:"lockout"},
            {label:"Grip fails before the lift does", id:"grip"}
        ]},
        floor: { q2: { text:"When it's slow off the floor, what happens to your body?", options:[
            {label:"My back rounds immediately — I can't keep position", id:"floor_round"},
            {label:"My hips shoot up and it turns into a stiff-leg pull", id:"floor_hips"},
            {label:"I just can't break it — it feels glued to the floor", id:"floor_stuck"}
        ]},
            floor_round: { name:"Upper Back / Lat Weakness", accessories:[
                {n:"Paused DL",s:"deadlift",pctByWeek:[0.60,0.65,0.70,0.65],repsByWeek:["3x3","3x3","3x2","2x2"]},
                {n:"Seal Row",s:"deadlift",pctByWeek:[0.35,0.38,0.40,0.35],repsByWeek:["4x10","4x8","3x8","3x6"]},
                {n:"Pendlay Row",s:"deadlift",pctByWeek:[0.50,0.55,0.58,0.53],repsByWeek:["4x6","4x5","3x5","3x3"]}
            ]},
            floor_hips: { name:"Quad Weakness off Floor", accessories:[
                {n:"Deficit Deadlift",s:"deadlift",pctByWeek:[0.60,0.65,0.68,0.63],repsByWeek:["3x5","3x4","3x3","2x3"]},
                {n:"Front Squat",s:"squat",pctByWeek:[0.55,0.60,0.63,0.58],repsByWeek:["3x6","3x5","3x4","2x3"]},
                {n:"Leg Press",s:"squat",pctByWeek:[1.20,1.30,1.40,1.20],repsByWeek:["4x10","4x8","3x8","3x6"]}
            ]},
            floor_stuck: { name:"Raw Floor Strength", accessories:[
                {n:"Deficit Deadlift",s:"deadlift",pctByWeek:[0.60,0.65,0.68,0.63],repsByWeek:["3x5","3x4","3x3","2x3"]},
                {n:"Halting DL",s:"deadlift",pctByWeek:[0.60,0.65,0.68,0.63],repsByWeek:["3x5","3x4","3x3","2x3"]},
                {n:"Paused DL",s:"deadlift",pctByWeek:[0.60,0.65,0.70,0.65],repsByWeek:["3x3","3x3","3x2","2x2"]}
            ]}
        },
        knees: { name:"Knee Pass / Positional Weakness", accessories:[
            {n:"Paused DL",s:"deadlift",pctByWeek:[0.62,0.67,0.72,0.67],repsByWeek:["3x3","3x3","3x2","2x2"]},
            {n:"Halting DL",s:"deadlift",pctByWeek:[0.62,0.67,0.70,0.65],repsByWeek:["3x5","3x4","3x3","2x3"]},
            {n:"Pendlay Row",s:"deadlift",pctByWeek:[0.50,0.55,0.58,0.53],repsByWeek:["4x6","4x5","3x5","3x3"]}
        ]},
        lockout: { name:"Hip Extension / Glute Weakness", accessories:[
            {n:"Block Pulls (Smart)",s:"deadlift",pctByWeek:[0.75,0.80,0.85,0.78],repsByWeek:["3x4","3x3","2x3","2x1"]},
            {n:"Hip Thrust",s:"deadlift",pctByWeek:[0.45,0.50,0.53,0.48],repsByWeek:["4x10","4x8","3x8","3x6"]},
            {n:"Banded Deadlift",s:"deadlift",pctByWeek:[0.45,0.48,0.50,0.45],repsByWeek:["5x2","5x2","4x2","3x2"]}
        ]},
        grip: { name:"Grip Strength Deficit", accessories:[
            {n:"Rack Pull Hold",s:"deadlift",pctByWeek:[1.00,1.05,1.10,1.00],repsByWeek:["3x10s","3x12s","3x15s","2x10s"]},
            {n:"Farmer's Walks",s:"deadlift",pctByWeek:[0.35,0.38,0.40,0.35],repsByWeek:["3x30s","3x35s","3x40s","2x30s"]},
            {n:"Tempo Deadlift",s:"deadlift",pctByWeek:[0.55,0.58,0.60,0.55],repsByWeek:["3x3","3x3","3x2","2x2"]}
        ]}
    }
};

const accDayPlacement = { squat:2, bench:1, deadlift:5, ohp:4 };

window.openAutoAccessories = function() {
    const existing = document.getElementById('autoAccModal');
    if(existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'autoAccModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:9500;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px 0;';
    modal.addEventListener('click', e => { if(e.target === modal) modal.remove(); });
    modal.innerHTML = `
    <div id="autoAccInner" style="background:#111;border:1px solid var(--border,#333);border-radius:14px;padding:24px;width:95%;max-width:550px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <h2 style="margin:0;color:#4caf50;font-size:1.3em;">🔧 Weak Point Rx</h2>
            <button onclick="document.getElementById('autoAccModal').remove()" style="background:none;border:none;color:var(--text,#fff);font-size:24px;cursor:pointer;">✕</button>
        </div>
        <p style="color:var(--text-muted,#aaa);font-size:0.85em;margin-bottom:18px;">Tell me what's giving you trouble and I'll prescribe the right accessories, auto-loaded into your program with periodized weights.</p>
        <div style="margin-bottom:18px;">
            <div style="font-size:0.75em;color:var(--text-muted,#888);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:bold;">Which lift needs work?</div>
            <div style="display:flex;gap:8px;">
                <button onclick="startAccTree('squat')" style="flex:1;padding:14px;border-radius:8px;border:2px solid #4caf50;background:rgba(76,175,80,0.1);color:#4caf50;font-weight:900;font-size:1em;cursor:pointer;">Squat</button>
                <button onclick="startAccTree('bench')" style="flex:1;padding:14px;border-radius:8px;border:2px solid #2196f3;background:rgba(33,150,243,0.1);color:#2196f3;font-weight:900;font-size:1em;cursor:pointer;">Bench</button>
                <button onclick="startAccTree('deadlift')" style="flex:1;padding:14px;border-radius:8px;border:2px solid #9c27b0;background:rgba(156,39,176,0.1);color:#9c27b0;font-weight:900;font-size:1em;cursor:pointer;">Deadlift</button>
            </div>
        </div>
        <div id="accTreeFlow"></div>
    </div>`;
    document.body.appendChild(modal);
};

let accTreeState = { lift: null, path: [] };

window.startAccTree = function(lift) {
    accTreeState = { lift, path: [] };
    renderAccQuestion(accDecisionTree[lift].q1, lift);
};

function renderAccQuestion(q) {
    const flow = document.getElementById('accTreeFlow');
    flow.innerHTML = `
        <div style="background:#1a1a1a;border:1px solid var(--border,#333);border-radius:10px;padding:16px;">
            <div style="font-size:1em;font-weight:700;color:var(--text,#fff);margin-bottom:14px;line-height:1.4;">${q.text}</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${q.options.map(o => `
                    <button onclick="handleAccAnswer('${accTreeState.lift}','${o.id}')"
                        style="text-align:left;padding:14px;background:var(--surface2,#222);border:1px solid var(--border,#333);border-radius:8px;color:var(--text,#fff);cursor:pointer;font-size:0.9em;transition:all 0.2s;line-height:1.3;"
                        onmouseover="this.style.borderColor='#4caf50'" onmouseout="this.style.borderColor='var(--border,#333)'">${o.label}</button>
                `).join('')}
            </div>
        </div>`;
}

window.handleAccAnswer = function(lift, answerId) {
    accTreeState.path.push(answerId);
    const tree = accDecisionTree[lift];
    let node;
    if(tree[answerId]) node = tree[answerId];
    else { for(const key of Object.keys(tree)) { if(typeof tree[key]==='object'&&tree[key][answerId]) { node=tree[key][answerId]; break; } } }
    if(!node) { toast('Something went wrong','error'); return; }
    if(node.q2) { renderAccQuestion(node.q2); return; }
    if(node.accessories || node.name) renderAccPrescription(node, lift);
};

function renderAccPrescription(node, lift) {
    const flow = document.getElementById('accTreeFlow');
    const sMax = parseFloat(document.getElementById('squatInput').value)||0;
    const bMax = parseFloat(document.getElementById('benchInput').value)||0;
    const dMax = parseFloat(document.getElementById('deadliftInput').value)||0;
    const oMax = parseFloat(document.getElementById('ohpInput').value)||0;
    const liftColors = {squat:'#4caf50',bench:'#2196f3',deadlift:'#9c27b0'};
    const color = liftColors[lift]||'#4caf50';
    const numWeeks = node.accessories[0].pctByWeek.length;

    let accHtml = node.accessories.map((acc, idx) => {
        const accMax = acc.s==='squat'?sMax:acc.s==='bench'?bMax:acc.s==='deadlift'?dMax:oMax;
        const weekPreviews = acc.pctByWeek.map((pct,w) => {
            if(pct===0) return `<span style="color:#555;">W${w+1}: OFF</span>`;
            const load = accMax>0 ? Math.round((accMax*pct)/5)*5+' lbs' : Math.round(pct*100)+'%';
            return `<span style="color:${w>=numWeeks-1?'#4caf50':w>=numWeeks-2?'#ff9800':'var(--text,#fff)'};">W${w+1}: ${acc.repsByWeek[w]} @ ${load}</span>`;
        }).join('<br>');
        return `<div style="background:var(--surface2,#222);border:1px solid var(--border,#333);border-radius:8px;padding:14px;${idx?'margin-top:8px;':''}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:900;color:var(--text,#fff);">${acc.n}</span>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                    <input type="checkbox" checked data-acc-idx="${idx}" class="acc-toggle-cb" style="accent-color:${color};width:18px;height:18px;">
                    <span style="color:var(--text-muted,#888);font-size:0.75em;">Add</span>
                </label>
            </div>
            <div style="margin-top:8px;font-size:0.8em;line-height:1.8;color:var(--text-muted,#aaa);">${weekPreviews}</div>
        </div>`;
    }).join('');

    flow.innerHTML = `<div>
        <div style="background:rgba(76,175,80,0.08);border:2px solid ${color};border-radius:10px;padding:16px;margin-bottom:14px;">
            <div style="font-size:0.75em;color:${color};text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Diagnosis</div>
            <div style="font-size:1.2em;font-weight:900;color:var(--text,#fff);margin-top:4px;">${node.name}</div>
        </div>
        ${accHtml}
        <button onclick="applyAccPrescription('${lift}')" style="width:100%;padding:14px;background:${color};color:#fff;border:none;border-radius:8px;font-weight:900;font-size:1em;cursor:pointer;margin-top:16px;text-transform:uppercase;">Add to Program</button>
        <button onclick="startAccTree('${lift}')" style="width:100%;padding:10px;background:none;border:1px solid var(--border,#333);color:var(--text-muted,#aaa);border-radius:8px;cursor:pointer;margin-top:8px;font-size:0.85em;">← Start Over</button>
    </div>`;
    flow.dataset.prescription = JSON.stringify(node.accessories);
}

window.applyAccPrescription = function(lift) {
    const flow = document.getElementById('accTreeFlow');
    const accessories = JSON.parse(flow.dataset.prescription||'[]');
    const checkboxes = flow.querySelectorAll('.acc-toggle-cb');
    let added = 0;
    checkboxes.forEach((cb, idx) => {
        if(!cb.checked) return;
        const acc = accessories[idx];
        if(!acc) return;
        const dayIdx = accDayPlacement[acc.s]||2;
        customLifts.push({
            n: acc.n+' 🔧', t:acc.n, p:acc.pctByWeek[0], r:acc.repsByWeek[0],
            s:acc.s, dayIndex:dayIdx, isAutoAcc:true,
            pctByWeek:acc.pctByWeek, repsByWeek:acc.repsByWeek
        });
        added++;
    });
    if(added>0) {
        saveCustomLifts();
        saveUserData();
        generateProgram();
        toast(`🔧 ${added} accessor${added===1?'y':'ies'} added!`);
    }
    document.getElementById('autoAccModal').remove();
};

// ==========================================
// PDF EXPORT — NEW FEATURE
// Uses browser print for clean PDF output
// ==========================================
window.exportToPDF = function() {
    const sMax = parseFloat(document.getElementById('squatInput').value) || 0;
    const bMax = parseFloat(document.getElementById('benchInput').value) || 0;
    const dMax = parseFloat(document.getElementById('deadliftInput').value) || 0;
    const oMax = parseFloat(document.getElementById('ohpInput').value) || 0;
    const total = sMax + bMax + dMax;
    const mode = document.getElementById('dashMode').value;

    const win = window.open('', '_blank');
    const grid = document.getElementById('dashboardGrid');

    win.document.write(`<!DOCTYPE html><html><head>
        <title>Base Map Linear — ${new Date().toLocaleDateString()}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 20px; }
            .header { text-align:center; margin-bottom:20px; border-bottom:2px solid #000; padding-bottom:10px; }
            .header h1 { font-size:20px; font-weight:900; }
            .header .meta { display:flex; justify-content:center; gap:30px; margin-top:8px; color:#555; font-size:11px; }
            .grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; }
            .week-card { border:1px solid #ccc; border-radius:6px; padding:10px; break-inside:avoid; }
            .week-title { font-weight:900; font-size:13px; border-bottom:1px solid #ddd; padding-bottom:5px; margin-bottom:8px; color:#1565c0; }
            .day-block { margin-bottom:8px; }
            .day-name { font-weight:bold; font-size:10px; color:#555; margin-bottom:3px; text-transform:uppercase; letter-spacing:0.5px; }
            table { width:100%; border-collapse:collapse; }
            td { padding:2px 4px; border-bottom:1px solid #f0f0f0; vertical-align:top; }
            td:last-child { text-align:right; font-weight:bold; color:#1565c0; }
            .footer { margin-top:20px; text-align:center; color:#999; font-size:10px; border-top:1px solid #ddd; padding-top:10px; }
            @media print { body { padding:10px; } .grid { grid-template-columns:repeat(2, 1fr); } }
        </style>
    </head><body>
    <div class="header">
        <h1>BASE MAP LINEAR — ${mode.toUpperCase().replace(/_/g,' ')}</h1>
        <div class="meta">
            <span>S: ${sMax} | B: ${bMax} | D: ${dMax} | OHP: ${oMax}</span>
            <span>Total: ${total} lbs</span>
            <span>Generated: ${new Date().toLocaleDateString()}</span>
        </div>
    </div>
    <div class="grid">${grid ? grid.innerHTML : '<p>No program loaded.</p>'}</div>
    <div class="footer">Andre's Calibrations &copy; 2026 — Printed from Base Map Linear</div>
    </body></html>`);

    win.document.close();
    setTimeout(() => { win.print(); }, 500);
    toast('Opening print dialog for PDF export...', 'info');
};

// ==========================================
// PROGRAM GENERATION
// ==========================================
function initProgramData() {
  userProgram = [];
  const mode = document.getElementById('dashMode').value;
  let weeks = 4;
  if(mode === 'maintenance' || mode === 'building_offseason' || mode === 'peak_push') weeks = 6;
  if(mode === 'deload') weeks = 2;

  let daysTemplate = [];

  if (mode === 'building_offseason') {
      daysTemplate = [
          { name: "Day 1: Squat Var", lifts: [{n:"Safety Bar Squat",t:"squat"},{n:"Belt Squat",t:"squat"},{n:"RDL",t:"deadlift"},{n:"Weighted Planks",t:"squat"}] },
          { name: "Day 2: Bench Var", lifts: [{n:"Close Grip Bench",t:"bench"},{n:"Incline DB Press",t:"bench"},{n:"Weighted Dips",t:"bench"},{n:"Barbell Rows",t:"deadlift"}] },
          { name: "Day 3: Deadlift Var", lifts: [{n:"Deficit Deadlift",t:"deadlift"},{n:"Lat Pulldown",t:"deadlift"},{n:"GHR",t:"squat"},{n:"Rear Delt Fly",t:"bench"}] },
          { name: "Day 4: Upper/GPP", lifts: [{n:"OHP (Strict)",t:"ohp"},{n:"Pull-ups",t:"deadlift"},{n:"Hammer Curls",t:"deadlift"},{n:"Lateral Raises",t:"ohp"}] },
          { name: "Day 5: Secondary", lifts: [{n:"Squat (Low)",t:"squat"},{n:"Bench (Low)",t:"bench"},{n:"Split Squats",t:"squat"},{n:"Face Pulls",t:"bench"}] },
          { name: "Day 6: Extra (Opt)", lifts: [{n:"Arm Pump",t:"bench"},{n:"Calves",t:"squat"},{n:"Sled Drags",t:"deadlift"}] }
      ];
  } else if (mode === 'peak_push') {
      daysTemplate = [
          { name: "Day 1: Squat/DL Spec", lifts: [{n:"Comp Squat",t:"squat"},{n:"Comp Deadlift",t:"deadlift"},{n:"Block Pulls",t:"deadlift"}] },
          { name: "Day 2: Bench Spec", lifts: [{n:"Comp Bench",t:"bench"},{n:"Floor Press",t:"bench"},{n:"Weighted Dips",t:"bench"}] },
          { name: "Day 3: Squat Vol", lifts: [{n:"Squat (Vol)",t:"squat"},{n:"Core Stability",t:"squat"}] },
          { name: "Day 4: Bench Vol", lifts: [{n:"Bench (Vol)",t:"bench"},{n:"Tricep Pushdown",t:"bench"},{n:"Rear Delt Fly",t:"bench"}] },
          { name: "Day 5: Heavy/OHP", lifts: [{n:"Squat (Peak)",t:"squat"},{n:"OHP (Heavy)",t:"ohp"},{n:"Leg Extensions",t:"squat"}] },
          { name: "Day 6: Weak Points", lifts: [{n:"Heavy Holds",t:"squat"},{n:"Tricep Pushdowns",t:"bench"},{n:"Grip Work",t:"deadlift"}] }
      ];
  } else {
      daysTemplate = [
        { name: "Day 1 (Mon)", lifts: [{n:"Primer Bench",t:"bench"},{n:"Tempo Squat",t:"squat"},{n:"Cluster DL",t:"deadlift"}]},
        { name: "Day 2 (Tue)", lifts: [{n:"Primary Bench",t:"bench"},{n:"Larsen Press",t:"bench"},{n:"Close Grip Bench (Optional)",t:"bench"}]},
        { name: "Day 3 (Wed)", lifts: [{n:"Comp Squat",t:"squat"}]},
        { name: "Day 4 (Thu) - Back Day", lifts: [{n:"⚠️ Use +Add Workout",t:"bench",isLabel:true},{n:"Pendlay Row",t:"deadlift"},{n:"Weighted Pull-ups",t:"deadlift"},{n:"Lat Pulldown",t:"deadlift"},{n:"Chest Supported Row",t:"deadlift"},{n:"Face Pulls",t:"bench"}]},
        { name: "Day 5 (Fri) - Shoulder Day", lifts: [{n:"⚠️ Use +Add Workout",t:"ohp",isLabel:true},{n:"OHP (Strength)",t:"ohp"},{n:"Seated DB Press",t:"ohp"},{n:"Egyptian Lateral Raise",t:"ohp"},{n:"Rear Delt Fly",t:"bench"},{n:"Upright Rows",t:"ohp"}]},
        { name: "Day 6 (Sat)", lifts: [{n:"Secondary Bench",t:"bench"},{n:"Tempo Bench",t:"bench"},{n:"Pause Squat",t:"squat"},{n:"Paused DL Cluster",t:"deadlift"}]}
      ];
  }

  for (let w = 0; w < weeks; w++) userProgram.push({ week: w + 1, days: JSON.parse(JSON.stringify(daysTemplate)) });
}

function generateProgram() {
  if (userProgram.length === 0) initProgramData();

  const sMax = parseFloat(document.getElementById('squatInput').value) || 0;
  const bMax = parseFloat(document.getElementById('benchInput').value) || 0;
  const dMax = parseFloat(document.getElementById('deadliftInput').value) || 0;
  const oMax = parseFloat(document.getElementById('ohpInput').value) || 0;
  const overloadPct = parseFloat(document.getElementById('overloadInput').value) || 0;

  const totalEl = document.getElementById('currentTotal');
  if(totalEl) totalEl.innerText = (sMax + bMax + dMax + oMax);

  const repsVal = document.getElementById('dashReps').value;
  const reps = parseInt(repsVal);
  const mode = document.getElementById('dashMode').value;
  let startPct = basePctMap[reps] || 0.75;

  const randCard = document.getElementById('randomizerCard');
  const dashGrid = document.getElementById('dashboardGrid');
  const mobileNav = document.querySelector('.mobile-nav');
  if (mode === 'randomizer') {
      randCard.style.display = 'block';
      dashGrid.style.display = 'none';
      if (mobileNav) mobileNav.style.display = 'none';
      return;
  } else {
      randCard.style.display = 'none';
      dashGrid.style.display = 'grid';
      if (mobileNav) mobileNav.style.display = 'block';
  }

  let numW = userProgram.length;
  const mobLabel = document.getElementById('mobileWeekLabel');
  if(mobLabel) mobLabel.innerText = `Week ${activeMobileWeek + 1}`;

  let html = '';
  const fastedMult = isFasted ? 0.935 : 1.0;

  for (let w = 0; w < numW; w++) {
    let mod = (mode === 'maintenance' ? w * maintProg : w * standardProg);
    if (mode === 'deload') mod = (w === 0 ? -0.08 : -0.04);

    let currentTempoPct = tempoStartPct + (w * tempoProg);
    let curPct = startPct + mod;
    let psPct = 0.70 + mod;

    let activeClass = (w === activeMobileWeek) ? 'active-week' : '';
    let styleDef = (window.innerWidth <= 768 && w !== activeMobileWeek) ? 'display:none;' : '';
    let headerColor = (mode === 'deload' || w === 5) ? '#4caf50' : '#2196f3';
    if(mode === 'peak_push' && w === 4) headerColor = '#FFD700';

    html += `<div class="program-card ${activeClass}" style="background:var(--surface,#1e1e1e);padding:15px;border-radius:8px;margin-bottom:15px;border:1px solid var(--border,#333);${styleDef}">
                <h3 style="color:${headerColor};border-bottom:1px solid var(--border,#444);padding-bottom:5px;">
                    Week ${w+1} <span style="font-size:0.8em;color:var(--text-muted,#aaa);">(${Math.round((curPct+overloadPct)*100*fastedMult)}%)</span>
                </h3>`;

    userProgram[w].days.forEach((day, dIdx) => {
      let rawLifts = [...day.lifts];
      let activeLifts = [];

      rawLifts.forEach(l => {
          if (l.n === "Primary Bench") {
              activeLifts.push({ n: "Primary Bench (Top)", t: "bench", isPrimaryTop: true });
              activeLifts.push({ n: "Primary Bench (Backoff)", t: "bench", isPrimaryBackoff: true });
          } else {
              activeLifts.push(l);
          }
      });

      if (mode === 'standard_acc') {
        const aReps = accPeakingReps[w] || 8;
        if (dIdx === 0) activeLifts.push({n:"OHP (Volume)",s:5,r:10,p:ohpVolPct,t:"bench",isOHP:true});
        if (dIdx === 1) { activeLifts.push({n:"Close Grip Bench",s:accSets[w]||3,r:aReps,p:0,t:"bench",isAcc:true},{n:"Weighted Dips",s:3,r:aReps,p:0,t:"bench",isAcc:true},{n:"Floor Press",s:3,r:aReps,p:0,t:"bench",isAcc:true}); }
        if (dIdx === 2) { activeLifts.push({n:"Hack Squat",s:3,r:aReps,p:0,t:"squat",isAcc:true},{n:"Leg Press",s:3,r:aReps,p:0,t:"squat",isAcc:true}); }
        if (dIdx === 3) { activeLifts.push({n:"Seal Rows",s:3,r:aReps,p:0,t:"deadlift",isAcc:true},{n:"Pull-ups",s:3,r:8,p:0,t:"deadlift",isAcc:true}); }
      }

      // FIX: use resolveSmartLift() — single source of truth
      customLifts.forEach((cl, originalIndex) => {
          if (cl.dayIndex === dIdx) {
              let dynPct, dynReps;
              if(cl.isAutoAcc && cl.pctByWeek) {
                  const wIdx = Math.min(w, cl.pctByWeek.length - 1);
                  dynPct = cl.pctByWeek[wIdx] || 0;
                  dynReps = cl.repsByWeek ? cl.repsByWeek[wIdx] : cl.r;
                  if(dynReps === 'OFF' || dynPct === 0) return;
              } else {
                  const resolved = resolveSmartLift(cl, w);
                  dynPct = resolved.pct;
                  dynReps = resolved.reps;
              }
              if (dynPct > 0) {
                  activeLifts.push({ n: cl.n, t: cl.s, isCustom: true, p: dynPct, r: dynReps, dbIndex: originalIndex });
              }
          }
      });

      html += `<div style="margin-top:10px;background:var(--surface2,#222);padding:8px;border-radius:5px;">
                <div style="font-size:0.9em;font-weight:bold;color:var(--text,#ddd);border-bottom:1px solid var(--border,#444);margin-bottom:5px;">${day.name}</div>
                <table style="width:100%;font-size:13px;border-collapse:collapse;">`;

      activeLifts.forEach(lift => {
        let mx = lift.t==="ohp" ? oMax : lift.t==="squat" ? sMax : lift.t==="deadlift" ? dMax : bMax;
        let intens = curPct, dReps = reps, fSets = 3, weightDisplay = "";
        let finalIntens = lift.isOHP ? lift.p : intens;
        let setsDisplay = "";
        let speedNote = "";

        // =========================================
        // LOGIC FOR PHASE 1: BUILDING
        // =========================================
        if (mode === 'building_offseason') {
            const p1Chart = [
                {p:0.65, s:3, r:8}, {p:0.67, s:3, r:8}, {p:0.69, s:4, r:6},
                {p:0.72, s:4, r:6}, {p:0.75, s:5, r:5}, {p:0.50, s:3, r:5}
            ];
            const p1Acc     = [0.60, 0.60, 0.70, 0.70, 0.80, 0.50];
            const p1AccReps = [15,   15,   12,   12,   8,    10  ];
            let c = p1Chart[w];

            if (["Safety Bar Squat","Close Grip Bench","Deficit Deadlift","OHP (Strict)"].includes(lift.n)) {
                finalIntens = c.p; fSets = c.s; dReps = c.r;
                if (lift.n === "OHP (Strict)")       { dReps = 10; fSets = 3; finalIntens = 0.60 + (w * 0.02); }
                if (lift.n === "Safety Bar Squat")   { mx = sMax * 0.90; }
                if (lift.n === "Deficit Deadlift")   { mx = dMax * 0.90; }
            }
            else if (lift.n.includes("(Low)")) {
                finalIntens = 0.60; fSets = 3; dReps = 8;
            }
            else if (lift.n === "Belt Squat" || lift.n === "Leg Press") {
                finalIntens = 0.50 + (w * 0.02); fSets = 3; dReps = p1AccReps[w];
                mx = sMax;
            }
            else if (lift.n === "RDL" || lift.n === "Good Mornings") {
                finalIntens = 0.45 + (w * 0.02); fSets = 3; dReps = 12;
                mx = dMax;
            }
            else if (lift.n === "Incline DB Press" || lift.n === "Weighted Dips") {
                finalIntens = 0.55 + (w * 0.02); fSets = 3; dReps = 12;
                mx = bMax;
            }
            else if (lift.n === "Barbell Rows" || lift.n === "Lat Pulldown") {
                finalIntens = 0.50; fSets = 4; dReps = 12;
                mx = dMax;
            }
            else if (["Arm Pump","Calves","Sled Drags"].includes(lift.n)) {
                finalIntens = 0; fSets = 3; dReps = "3x20";
                weightDisplay = "RPE 7-8";
            }
            else {
                finalIntens = p1Acc[w]; dReps = p1AccReps[w]; fSets = 3;
                weightDisplay = "RPE 7-8";
            }
        }

        // =========================================
        // LOGIC FOR PHASE 2: PEAKING
        // =========================================
        else if (mode === 'peak_push') {
            const p2Chart = [
                {p:0.85, s:4, r:3}, // W1 High Vol
                {p:0.88, s:4, r:2}, // W2 High Vol
                {p:0.91, s:3, r:2}, // W3 Mod
                {p:0.93, s:3, r:1}, // W4 Taper
                {p:0.95, s:2, r:1}, // W5 Peak
                {p:0.50, s:1, r:1}  // W6 Deload
            ];
            let c = p2Chart[w];

            if (["Comp Squat","Comp Deadlift","Comp Bench","Squat (Peak)"].includes(lift.n)) {
                finalIntens = c.p; fSets = c.s; dReps = c.r;
                if (w === 5) fSets = 1; // strict taper peak week
            }
            else if (lift.n === "OHP (Heavy)") {
                finalIntens = 0.75 + (w * 0.02); fSets = 4; dReps = 8;
            }
            else if (lift.n.includes("(Vol)")) {
                finalIntens = 0.65; fSets = 2; dReps = 3; speedNote = "Speed Focus";
            }
            else if (lift.n === "Block Pulls") {
                finalIntens = 0.90 + (w * 0.02); fSets = 3; dReps = 3; mx = dMax;
            }
            else if (lift.n === "Floor Press" || lift.n === "Board Press") {
                finalIntens = 0.85 + (w * 0.02); fSets = 3; dReps = 4; mx = bMax;
            }
            else if (lift.n === "Weighted Dips") {
                finalIntens = 0.30; fSets = 3; dReps = 8; mx = bMax;
            }
            else if (lift.n === "Heavy Holds") {
                finalIntens = 1.05; fSets = 3; dReps = "15s"; mx = sMax;
            }
            else {
                let accR = [8, 6, 5, 3, 5, 5];
                fSets = (w >= 3) ? 2 : 3;
                dReps = accR[w];
                weightDisplay = "Heavy RPE";
            }
        }

        // =========================================
        // LOGIC FOR DELOAD (2 Weeks)
        // =========================================
        else if (mode === 'deload') {
            if (w === 0) {
                fSets = 2; dReps = 5; finalIntens = 0.50;
                weightDisplay = "Recover";
            }
            if (w === 1) {
                fSets = 3; dReps = 3; finalIntens = 0.70;
                weightDisplay = "Prime CNS";
            }
        }

        // =========================================
        // MAINTENANCE (6 Weeks)
        // =========================================
        else if (mode === 'maintenance') {
            finalIntens = startPct + (w * maintProg);
            fSets = maintSets[w] || 2;
            dReps = reps;
        }

        // =========================================
        // STANDARD LOGIC (4 Weeks) — TAPER APPLIED
        // =========================================
        else {
            if (lift.n === "Primer Bench") {
                let pMod = 0.12;
                if (w === 0) { fSets=4; dReps=2; finalIntens = curPct - pMod; }
                else if (w === 1) { fSets=3; dReps=1; finalIntens = curPct - (pMod - 0.02); }
                else if (w === 2) { fSets=3; dReps=1; finalIntens = curPct - (pMod - 0.04); }
                else if (w >= 3) { fSets=1; dReps=1; finalIntens = 0.70; }
            }
            else if (lift.isPrimaryTop) {
                if (w === 0) { fSets=4; setsDisplay="3-4"; speedNote="Drop set if slow"; }
                if (w === 1) { fSets=3; setsDisplay="3"; }
                if (w === 2) { fSets=2; setsDisplay="1-2"; speedNote="Drop set if slow"; }
                if (w === 3) { fSets=1; setsDisplay="1"; }
                dReps = reps; finalIntens = curPct;
            }
            else if (lift.isPrimaryBackoff) {
                fSets = 3; dReps = reps; finalIntens = curPct - 0.05;
                if (w === 2) fSets = 2;
                if (w === 3) fSets = 1;
            }
            else if (lift.n === "Secondary Bench") {
                let sMod = 0.15;
                if (w === 0) { fSets=4; dReps=4; finalIntens = curPct - sMod; }
                else if (w === 1) { fSets=4; dReps=3; finalIntens = curPct - (sMod - 0.02); }
                else if (w === 2) { fSets=3; dReps=3; finalIntens = curPct - (sMod - 0.04); }
                else if (w >= 3) { fSets=2; dReps=3; finalIntens = 0.70; }
            }
            else if (lift.n === "Larsen Press")        { dReps = 3; finalIntens = 0.70; }
            else if (lift.n.includes("Close Grip"))    { dReps = 8; finalIntens = 0.75; }
            else if (lift.n === "Paused Bench")        { dReps = reps; }
            else if (lift.n.includes("Tempo"))         { finalIntens = currentTempoPct; dReps = 5; speedNote = "3-1-3 Tempo"; }
            else if (lift.n.includes("Pause Squat")) {
                finalIntens = (psPct - 0.06);
                dReps = 4;
                fSets = (w === 0 ? 4 : (w === 1 ? 3 : 1));
                speedNote = "3s Pause";
            }
            else if (lift.n.includes("Paused"))        { dReps = 3; }
            else if (lift.n === "Comp Squat" || lift.n === "Cluster DL" || lift.n === "Paused DL Cluster") {
                if (w === 0) { fSets=4; setsDisplay="3-4"; speedNote="Drop set if slow"; }
                if (w === 1) { fSets=3; setsDisplay="3"; }
                if (w === 2) { fSets=2; setsDisplay="1-2"; speedNote="Drop set if slow"; }
                if (w === 3) { fSets=1; setsDisplay="1"; }
                if (lift.n.includes("Cluster")) speedNote = (speedNote ? speedNote + " | " : "") + "20s between mini-sets";
            }

            // Back Day
            if (lift.n === "Pendlay Row")         { finalIntens = 0.60; dReps = 6;  fSets = 4; }
            if (lift.n === "Weighted Pull-ups")   { finalIntens = 0.30; dReps = 8;  fSets = 3; }
            if (lift.n === "Lat Pulldown")        { finalIntens = 0.40; dReps = 12; fSets = 3; }
            if (lift.n === "Chest Supported Row") { finalIntens = 0.30; dReps = 12; fSets = 3; }
            if (lift.n === "Face Pulls")          { finalIntens = 0.15; dReps = 20; fSets = 3; }

            // OHP & Shoulder Day
            if (lift.n === "OHP (Strength)") {
                if (w === 0) { fSets=4; dReps=6; finalIntens=0.70; }
                if (w === 1) { fSets=4; dReps=5; finalIntens=0.75; }
                if (w === 2) { fSets=4; dReps=4; finalIntens=0.80; }
                if (w >= 3) { fSets=3; dReps=3; finalIntens=0.85; }
            }
            if (["Seated DB Press","Egyptian Lateral Raise","Rear Delt Fly","Upright Rows"].includes(lift.n)) {
                fSets = (w >= 3) ? 2 : 3;
                dReps = 12;
                if (lift.n.includes("Seated"))   finalIntens = 0.35;
                if (lift.n.includes("Egyptian")) finalIntens = 0.15;
                if (lift.n.includes("Rear"))     finalIntens = 0.15;
                if (lift.n.includes("Upright"))  finalIntens = 0.30;
            }
        }

        if (lift.isLabel) {
            html += `<tr><td colspan="3" style="padding:5px;color:#FFD700;font-style:italic;font-size:0.9em;text-align:center;">${lift.n}</td></tr>`;
            return;
        }

        let baseWeight = 0;
        let effectivePct = finalIntens + overloadPct;

        if (lift.isCustom) {
            fSets = "3"; dReps = lift.r;
            baseWeight = Math.round((mx*(lift.p+overloadPct)*fastedMult)/5)*5;
        } else if (lift.isAcc) {
            fSets=accSets[w]; dReps=lift.r;
            weightDisplay=`<span style="color:#aaa;">RPE ${accRPEs[w]}</span>`;
        } else {
            if(finalIntens > 0) baseWeight = Math.round((mx*effectivePct*fastedMult)/5)*5;
        }

        let modifier = modifiers[lift.n] || 1.0;
        let finalWeight = Math.round((baseWeight*modifier)/5)*5;
        let style = "color:var(--text,#fff);";
        let warning = "";
        if ((modifier!==1.0||overloadPct!==0) && baseWeight>0) { style="color:#ff4444;font-weight:bold;"; warning=" ⚠️"; }

        if (baseWeight > 0 && !weightDisplay) {
            weightDisplay = `<strong style="${style}">${finalWeight} lbs${warning}</strong>`;
            weightDisplay += ` <span onclick="adjustWeight('${lift.n}',${baseWeight})" style="cursor:pointer;font-size:14px;margin-left:5px;color:#aaa;">✎</span>`;
        } else if(!weightDisplay) {
            weightDisplay = "See Notes";
        }

        let btn = (finalWeight > 0) ? `<span onclick="window.openPlateLoader(${finalWeight})" style="cursor:pointer;color:#2196f3;margin-left:5px;">💿</span>` : '';

        // Add rest timer button to each row
        let timerBtn = `<span onclick="startRestTimer(180)" title="Start 3min rest timer" style="cursor:pointer;margin-left:4px;opacity:0.6;font-size:12px;">⏱</span>`;

        let setRepStr = "";
        if (lift.isCustom) {
            setRepStr = String(lift.r).includes('x') ? lift.r : `${fSets} x ${dReps}`;
            setRepStr += ` <span onclick="removeCustomLift(${lift.dbIndex})" style="cursor:pointer;color:red;margin-left:5px;">🗑️</span>`;
        } else {
            let finalS = setsDisplay ? setsDisplay : fSets;
            setRepStr = `${finalS}x${dReps}`;
            if (speedNote) setRepStr += `<div style="font-size:9px;color:#aaa;">${speedNote}</div>`;
        }

        // Unique ID for RPE logging keyed by lift name + week
        const liftId = `base_w${w}_${lift.n.replace(/\W/g,'_')}`;
        const rpePicker = buildRPEPicker(liftId);
        // PR badge — show trophy if this lift is a main compound
        const isMainLift = ['Comp Squat','Primary Bench (Top)','Comp Deadlift','OHP (Strength)'].includes(lift.n);
        const prBtn = (isMainLift && finalWeight > 0) ? `<span onclick="logPR('${lift.n}',${finalWeight},${dReps})" title="Log as PR" style="cursor:pointer;font-size:13px;margin-left:4px;opacity:0.7;">🏆</span>` : '';

        html += `<tr>
                 <td style="padding:4px 0;color:var(--text,#ccc);">
                     ${lift.n}${lift.isCustom?' ⭐':''}
                     ${rpePicker}
                 </td>
                 <td style="padding:4px 0;text-align:center;color:#2196f3;">${setRepStr}</td>
                 <td style="padding:4px 0;text-align:right;">${weightDisplay} ${btn}${timerBtn}${prBtn}</td>
                </tr>`;
      });
      html += `</table></div>`;
    });
    html += `</div>`;
  }

  if(dashGrid) dashGrid.innerHTML = html;
}

// ==========================================
// LIBRARY FUNCTIONS
// ==========================================
function initLibraryMenu() {
    const catSel = document.getElementById('libCategory');
    if (!catSel) return;
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
    if (!exSel) return;
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
    const item = smartLibrary[cat] && smartLibrary[cat][idx];
    const el = document.getElementById('libDetails');
    if (item && el) el.innerText = `Target: ${item.t} | Logic: ${Math.round(item.p*100)}% of ${item.s.toUpperCase()}${item.note?' | '+item.note:''}`;
}

function addCustomLift() {
    const cat = document.getElementById('libCategory').value;
    const idx = document.getElementById('libExercise').value;
    const day = parseInt(document.getElementById('libDay').value);
    const item = smartLibrary[cat][idx];
    customLifts.push({ ...item, dayIndex: day });
    // FIX: save to BOTH localStorage AND Firebase (was only saving to one)
    saveCustomLifts();
    saveUserData();
    generateProgram();
    document.getElementById('libraryModal').style.display = 'none';
    toast(`✅ Added ${item.n} to Day ${day + 1}`);
}

window.removeCustomLift = function(index) {
    if(!confirm("Remove this workout?")) return;
    customLifts.splice(index, 1);
    saveCustomLifts();
    saveUserData();
    generateProgram();
    toast('Workout removed', 'info');
};

window.clearCustomLifts = function() {
    if(!confirm("Clear ALL custom workouts?")) return;
    customLifts = [];
    saveCustomLifts();
    saveUserData();
    generateProgram();
    document.getElementById('libraryModal').style.display = 'none';
    toast('All custom workouts cleared', 'info');
};

// FIX: Both localStorage AND Firebase now stay in sync
function saveCustomLifts() { localStorage.setItem('baseMapCustomLifts', JSON.stringify(customLifts)); }
function loadCustomLifts() {
    const data = localStorage.getItem('baseMapCustomLifts');
    if(data) customLifts = JSON.parse(data);
}

// ==========================================
// WEIGHT ADJUSTMENT
// ==========================================
window.adjustWeight = function(liftName, originalLoad) {
    let input = prompt(`Adjust load for ${liftName}.\nOriginal: ${originalLoad} lbs\n\nEnter weight you actually lifted (or 0 to reset):`);
    if (input === null) return;
    let actual = parseFloat(input);
    if (!actual || actual === 0) {
        delete modifiers[liftName];
        toast(`${liftName} reset to standard.`, 'info');
    } else {
        modifiers[liftName] = actual / originalLoad;
        toast(`${liftName} updated — scales by ${((actual/originalLoad)*100).toFixed(1)}%`);
    }
    saveUserData();
    generateProgram();
};

// ==========================================
// FIREBASE — AUTH, SAVE, LOAD
// ==========================================
async function saveUserData() {
    console.log('[BASE] saveUserData called. email:', currentUserEmail, 'authUser:', !!auth.currentUser);
    if(!currentUserEmail) { console.warn('[BASE] SKIP: no email'); return; }
    const user = auth.currentUser;
    if(!user) { console.warn('[BASE] SKIP: no auth.currentUser'); return; }

    const s = parseFloat(document.getElementById('squatInput').value)||0;
    const b = parseFloat(document.getElementById('benchInput').value)||0;
    const dl = parseFloat(document.getElementById('deadliftInput').value)||0;
    const o = parseFloat(document.getElementById('ohpInput').value)||0;
    console.log(`[BASE] Saving: uid=${user.uid} S=${s} B=${b} D=${dl} total=${s+b+dl}`);

    // Save user data — use uid (not email) for consistency with Andre Map
    try {
        await setDoc(doc(db, "users", user.uid), {
            s, b, d:dl, o,
            squat:s, bench:b, deadlift:dl, ohp:o,
            maxes:{ Squat:s, Bench:b, Deadlift:dl, OHP:o },
            modifiers,
            customLifts,
            email: currentUserEmail,
            name: baseUserName || currentUserEmail,
            program: 'base'
        }, {merge:true});
        console.log('[BASE] Users doc saved OK');
    } catch(e) { console.error('[BASE] Users doc FAILED:', e.code, e.message); }

    // Save leaderboard — separate try/catch so it always attempts
    const total = s + b + dl;
    if(total > 0) {
        try {
            const displayName = baseUserName || currentUserEmail || "Anonymous";
            const mode = document.getElementById('dashMode');
            const modeName = mode ? mode.options[mode.selectedIndex].text : 'Standard';
            console.log(`[BASE] Leaderboard write: id=${user.uid} name=${displayName} total=${total}`);
            await setDoc(doc(db, "leaderboard", user.uid), {
                email: currentUserEmail, name: displayName,
                total, squat:s, bench:b, deadlift:dl, unit:'LBS',
                program: 'Base Map Linear',
                week: activeMobileWeek + 1,
                mode: modeName,
                updatedAt: Date.now()
            });
            console.log('[BASE] Leaderboard saved OK');
        } catch(e) { console.error('[BASE] Leaderboard FAILED:', e.code, e.message); }
    } else {
        console.log('[BASE] Leaderboard skipped: total=0');
    }
}

async function loadUserData(email) {
    try {
        const user = auth.currentUser;
        // Try uid first (new format), fall back to email (old format)
        let snap = null;
        if(user) {
            snap = await getDoc(doc(db, "users", user.uid));
        }
        // If no data under uid, try email key for backwards compatibility
        if((!snap || !snap.exists()) && email) {
            snap = await getDoc(doc(db, "users", email));
            // If found under email, migrate to uid
            if(snap && snap.exists() && user) {
                const oldData = snap.data();
                await setDoc(doc(db, "users", user.uid), oldData, {merge:true});
            }
        }
        if(snap && snap.exists()) {
            const d = snap.data();
            let s = d.s||d.squat||(d.maxes?d.maxes.Squat:0)||0;
            let b = d.b||d.bench||(d.maxes?d.maxes.Bench:0)||0;
            let dl = d.d||d.deadlift||(d.maxes?d.maxes.Deadlift:0)||0;
            let o = d.o||d.ohp||(d.maxes?d.maxes.OHP:0)||0;
            document.getElementById('squatInput').value = s||'';
            document.getElementById('benchInput').value = b||'';
            document.getElementById('deadliftInput').value = dl||'';
            document.getElementById('ohpInput').value = o||'';
            if (d.modifiers) modifiers = d.modifiers;
            // FIX: load customLifts from cloud (merged with localStorage)
            if (d.customLifts && d.customLifts.length > 0) {
                customLifts = d.customLifts;
                saveCustomLifts(); // sync to localStorage too
            }
            generateProgram();
            saveLocalInputs();
            // Restore name if saved
            if(d.name) {
                baseUserName = d.name;
                localStorage.setItem('baseUserName', baseUserName);
                const nameField = document.getElementById('userName');
                if(nameField) nameField.value = baseUserName;
                updateBrandName();
            }
            if(!baseUserName) showNamePrompt();
            toast(`Welcome back! Data loaded ✓`);
        } else {
            // New user — no data yet, still prompt for name
            if(!baseUserName) showNamePrompt();
        }
    } catch(e) { console.error('Load error:', e); }
}

function handleLogin() {
    const email = document.getElementById('emailInput').value.trim().toLowerCase();
    // support both id variants
    const passEl = document.getElementById('passwordInput') || document.getElementById('passInput');
    const pass = passEl ? passEl.value : '';
    if(email && pass) {
        signInWithEmailAndPassword(auth, email, pass)
            .then(() => {
                document.getElementById('authModal').style.display='none';
                toast('Logged in!');
            })
            .catch(e => toast('Login failed: ' + e.message, 'error'));
    } else {
        toast('Please enter email and password', 'error');
    }
}

function handleSignup() {
    const email = document.getElementById('emailInput').value.trim().toLowerCase();
    const passEl = document.getElementById('passwordInput') || document.getElementById('passInput');
    const pass = passEl ? passEl.value : '';
    if(!email || !pass) { toast('Enter email and password first', 'error'); return; }
    if(pass.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    createUserWithEmailAndPassword(auth, email, pass)
        .then(() => {
            document.getElementById('authModal').style.display='none';
            toast('Account created! Logged in.');
        })
        .catch(e => toast('Sign up failed: ' + e.message, 'error'));
}

// ==========================================
// LOCAL STORAGE STATE
// ==========================================
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

function saveLocalInputs() {
    localStorage.setItem('baseMapLocalData', JSON.stringify({
        s: document.getElementById('squatInput').value,
        b: document.getElementById('benchInput').value,
        dl: document.getElementById('deadliftInput').value,
        o: document.getElementById('ohpInput').value
    }));
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

// ==========================================
// TOOLS
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
    let maxW = 4;
    if(mode==='maintenance'||mode==='building_offseason'||mode==='peak_push') maxW=6;
    if(mode==='deload') maxW=2;
    activeMobileWeek += dir;
    if(activeMobileWeek < 0) activeMobileWeek = maxW-1;
    if(activeMobileWeek >= maxW) activeMobileWeek = 0;
    generateProgram();
    saveUIState();
}

function calculateWarmup() {
    const t = parseFloat(document.getElementById('wuTarget').value);
    if(!t) return;
    const s = document.getElementById('wuStyle').value;
    let p = (s==='big') ? [{p:0,r:10},{p:0.5,r:5},{p:0.8,r:3},{p:0.9,r:1}]
                        : [{p:0,r:10},{p:0.4,r:5},{p:0.6,r:3},{p:0.8,r:2},{p:0.9,r:1}];
    let h = '';
    p.forEach(x => { h += `<div style="padding:4px 0;border-bottom:1px solid #333;display:flex;justify-content:space-between;"><span>${Math.round((t*x.p)/5)*5} lbs</span><span>x ${x.r}</span></div>`; });
    document.getElementById('warmupDisplay').innerHTML = h;
}

function calculateOneRM() {
    const w = parseFloat(document.getElementById('calcWeight').value);
    const r = parseFloat(document.getElementById('calcReps').value);
    if(w && r) document.getElementById('oneRmResult').innerText = "Est Max: " + Math.round(w*(1+0.0333*r)) + " lbs";
}

function runRandomizer() {
    document.getElementById('randomizerResult').style.display='block';
    const goal = document.getElementById('randGoal').value;
    const w = parseFloat(document.getElementById('prevWeight').value);
    const r = parseFloat(document.getElementById('prevReps').value);
    if(!w || !r) { document.getElementById('randOutputText').innerText = "Please enter weight and reps."; return; }
    let msg = "";
    if(goal==='strength') msg=`Target: ${Math.round((w*1.05)/5)*5} lbs x ${Math.max(1,r-1)} Reps (Strength Focus)`;
    if(goal==='pump') msg=`Target: ${Math.round((w*0.80)/5)*5} lbs x ${r+5} Reps (Pump Focus)`;
    if(goal==='recovery') msg=`Target: ${Math.round((w*0.60)/5)*5} lbs x ${r} Reps (Recovery Focus)`;
    document.getElementById('randOutputText').innerText = msg;
}

function updateAccOptions() {
    const c = document.getElementById('accCategory').value;
    const m = document.getElementById('accExercise');
    if (!m) return;
    m.innerHTML = '';
    if(accessoryData[c]) accessoryData[c].forEach(x => { let o=document.createElement('option'); o.text=x.name; m.add(o); });
}

function displayAccDetails() {
    const c = document.getElementById('accCategory').value;
    const n = document.getElementById('accExercise').value;
    const d = accessoryData[c] && accessoryData[c].find(x=>x.name===n);
    if(d) {
        const el = document.getElementById('accDetails');
        el.style.display='block';
        el.innerHTML = `<strong style="color:#FFD700;">Tier ${d.tier}</strong> — ${d.notes}`;
    }
}

function updatePtMovements() {
    const d = document.getElementById('ptDisplay');
    if(d) { d.style.display='block'; d.innerText="Select an area above for mobility drills."; }
}

window.openPlateLoader = function(w) {
    document.getElementById('plateModal').style.display='flex';
    document.getElementById('plateTarget').innerText = w+" lbs";
    let s=(w-45)/2, p=[45,25,10,5,2.5], r=[];
    p.forEach(x=>{ while(s>=x){ r.push(x); s-=x; } });
    document.getElementById('plateText').innerText = r.length ? r.join(' + ') + ' per side' : 'Bar only';
};

window.adjustWeight = window.adjustWeight; // already defined above

// ==========================================
// NAME PROMPT + BRAND NAME — BASE MAP
// ==========================================
let baseUserName = localStorage.getItem('baseUserName') || '';

function showNamePrompt() {
    if(baseUserName) return;
    const existing = document.getElementById('namePromptModal');
    if(existing) return;
    const modal = document.createElement('div');
    modal.id = 'namePromptModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
    <div style="background:var(--surface,#1e1e1e);border:1px solid var(--border,#333);border-radius:14px;padding:30px;width:90%;max-width:400px;text-align:center;">
        <div style="font-size:2rem;margin-bottom:10px;">👋</div>
        <h2 style="color:#fff;margin:0 0 8px 0;">Welcome to Andre's Calibrations</h2>
        <p style="color:var(--text-muted,#aaa);font-size:0.85rem;margin-bottom:20px;">Enter your first name to personalize your program.</p>
        <input type="text" id="namePromptInput" placeholder="First Name"
            style="width:100%;padding:14px;background:var(--surface2,#222);color:#fff;border:1px solid var(--border,#444);border-radius:8px;font-size:1.1rem;text-align:center;text-transform:capitalize;font-family:inherit;margin-bottom:14px;"
            onkeydown="if(event.key==='Enter')submitNamePrompt()">
        <button onclick="submitNamePrompt()"
            style="width:100%;padding:14px;background:#1565c0;color:#fff;border:none;border-radius:8px;font-weight:900;font-size:1rem;cursor:pointer;text-transform:uppercase;letter-spacing:1px;">
            Let's Go
        </button>
    </div>`;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('namePromptInput').focus(), 100);
}

window.submitNamePrompt = function() {
    const input = document.getElementById('namePromptInput');
    const name = input ? input.value.trim() : '';
    if(!name) { input.style.borderColor = '#f44336'; return; }
    baseUserName = name;
    localStorage.setItem('baseUserName', name);
    const nameField = document.getElementById('userName');
    if(nameField) nameField.value = name;
    updateBrandName();
    saveUserData();
    const modal = document.getElementById('namePromptModal');
    if(modal) modal.remove();
    toast(`Welcome, ${name}! 💪`);
};

function updateBrandName() {
    const brand = document.querySelector('.brand');
    if(!brand) return;
    if(baseUserName) {
        brand.innerText = `${baseUserName.toUpperCase()}'S BASE MAP LINEAR`;
    } else {
        brand.innerText = 'BASE MAP LINEAR';
    }
}

window.saveBaseSettings = function() {
    const nameField = document.getElementById('userName');
    if(nameField && nameField.value.trim()) {
        baseUserName = nameField.value.trim();
        localStorage.setItem('baseUserName', baseUserName);
    }
    const bwField = document.getElementById('bodyweight');
    if(bwField && bwField.value) {
        localStorage.setItem('baseBW', bwField.value);
        saveBodyweightEntry(bwField.value);
    }
    updateBrandName();
    saveUserData();
    generateProgram();
    toast('Settings saved');
};

// ==========================================
// EXPOSE GLOBALS
// ==========================================
window.runRandomizer = runRandomizer;
window.calculateWarmup = calculateWarmup;
window.calculateOneRM = calculateOneRM;
window.updateAccOptions = updateAccOptions;
window.displayAccDetails = displayAccDetails;
window.updatePtMovements = updatePtMovements;
window.clearCustomLifts = function() {
    if(!confirm("Clear ALL custom workouts?")) return;
    customLifts = [];
    saveCustomLifts();
    saveUserData();
    generateProgram();
    const lm = document.getElementById('libraryModal');
    if(lm) lm.style.display='none';
    toast('All custom workouts cleared', 'info');
};
window.toggleTheme = toggleTheme;
window.exportToPDF = window.exportToPDF;
window.openBWChart = window.openBWChart;

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);
    loadUIState();
    loadLocalInputs();
    loadCustomLifts();
    initLibraryMenu();
    injectRestTimer();
    updateBrandName();

    // Inject theme toggle + PDF export + BW chart into header actions
    const actions = document.querySelector('.header-actions');
    if (actions) {
        const themeBtn = document.createElement('button');
        themeBtn.id = 'themeToggleBtn';
        themeBtn.className = 'action-btn';
        themeBtn.innerText = currentTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
        themeBtn.onclick = toggleTheme;
        actions.insertBefore(themeBtn, actions.firstChild);

        const pdfBtn = document.createElement('button');
        pdfBtn.className = 'action-btn';
        pdfBtn.innerText = '📄 PDF';
        pdfBtn.onclick = window.exportToPDF;
        actions.insertBefore(pdfBtn, actions.children[1]);

        const chartBtn = document.createElement('button');
        chartBtn.className = 'action-btn';
        chartBtn.innerText = '📈 BW Chart';
        chartBtn.onclick = window.openBWChart;
        actions.insertBefore(chartBtn, actions.children[2]);

        const prBtn = document.createElement('button');
        prBtn.className = 'action-btn';
        prBtn.innerText = '🏆 PRs';
        prBtn.onclick = window.openPRTracker;
        actions.insertBefore(prBtn, actions.children[3]);
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserEmail = user.email;
            const btn = document.getElementById('login-btn');
            if(btn) {
                btn.innerText = "Log Out";
                btn.onclick = () => {
                    signOut(auth);
                    localStorage.removeItem('baseMapLocalData');
                    localStorage.removeItem('baseMapUIState');
                    localStorage.removeItem('baseMapCustomLifts');
                    localStorage.removeItem('baseUserName');
                    location.reload();
                };
            }
            loadUserData(user.email).then(() => {
                // Show name prompt if user hasn't set one yet
                if(!baseUserName) showNamePrompt();
            });
        }
    });

    ['squatInput','benchInput','deadliftInput','ohpInput'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', () => {
            generateProgram();
            saveUserData();
            saveLocalInputs();
            // Log bodyweight when bw field changes
        });
    });

    document.getElementById('dashMode').addEventListener('change', () => { activeMobileWeek=0; userProgram=[]; generateProgram(); saveUIState(); });
    document.getElementById('dashReps').addEventListener('change', () => { activeMobileWeek=0; generateProgram(); saveUIState(); });
    document.getElementById('overloadInput').addEventListener('change', () => generateProgram());

    const fBtn = document.getElementById('fastedBtn');
    if(fBtn) fBtn.addEventListener('click', () => { toggleFasted(); saveUIState(); });

    document.getElementById('prevWeekBtn').addEventListener('click', () => changeMobileWeek(-1));
    document.getElementById('nextWeekBtn').addEventListener('click', () => changeMobileWeek(1));

    const emailBtn = document.getElementById('emailLoginBtn');
    if(emailBtn) emailBtn.addEventListener('click', handleLogin);

    const signupBtn = document.getElementById('emailSignupBtn');
    if(signupBtn) signupBtn.addEventListener('click', handleSignup);

    const toggleHint = document.getElementById('authToggleHint');
    if(toggleHint) toggleHint.addEventListener('click', () => {
        const lb = document.getElementById('emailLoginBtn');
        const sb = document.getElementById('emailSignupBtn');
        const title = document.getElementById('authModalTitle');
        const isLogin = lb.style.display !== 'none';
        lb.style.display = isLogin ? 'none' : '';
        sb.style.display = isLogin ? '' : 'none';
        if(title) title.innerText = isLogin ? 'Create Account' : 'Login';
        const hint = document.getElementById('authToggleHint');
        if(hint) hint.parentElement.innerHTML = isLogin
            ? 'Already have an account? <span style="color:#2196f3;cursor:pointer;text-decoration:underline;" id="authToggleHint">Log in</span>'
            : 'Don\'t have an account? <span style="color:#2196f3;cursor:pointer;text-decoration:underline;" id="authToggleHint">Sign up</span>';
        // re-wire after innerHTML replace
        const newHint = document.getElementById('authToggleHint');
        if(newHint) newHint.addEventListener('click', arguments.callee.bind(this));
    });

    document.getElementById('libCategory').addEventListener('change', updateLibExercises);
    document.getElementById('libExercise').addEventListener('change', updateLibDetails);
    document.getElementById('addLiftBtn').addEventListener('click', addCustomLift);

    document.getElementById('calcWarmupBtn').addEventListener('click', calculateWarmup);
    document.getElementById('runRandBtn').addEventListener('click', runRandomizer);
    document.getElementById('calcOneRmBtn').addEventListener('click', calculateOneRM);

    const accCat = document.getElementById('accCategory');
    if(accCat) accCat.addEventListener('change', updateAccOptions);
    const accEx = document.getElementById('accExercise');
    if(accEx) accEx.addEventListener('change', displayAccDetails);
    const ptArea = document.getElementById('ptArea');
    if(ptArea) ptArea.addEventListener('change', updatePtMovements);

    // Bodyweight tracking — save when bw field changes in tools
    const bwField = document.getElementById('bodyweight');
    if(bwField) bwField.addEventListener('change', () => {
        if(bwField.value) saveBodyweightEntry(bwField.value);
    });

    generateProgram();
    updateAccOptions();
});

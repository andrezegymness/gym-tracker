import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyB_1QW2BtfK5eZzakW858fg2UlAS5tZY7M", authDomain: "powerlifting-programs.firebaseapp.com", projectId: "powerlifting-programs", storageBucket: "powerlifting-programs.firebasestorage.app", messagingSenderId: "961044250962", appId: "1:961044250962:web:c45644c186e9bb6ee67a8b", measurementId: "G-501TXRLMSQ" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ==========================================
// 1. FULL ANDRE MAP DATA (DO NOT TRUNCATE)
// ==========================================
const andreData = {
  1: {
    "Monday": [ 
        { name: "Pause Squat", sets: 2, reps: 2, pct: 0.701, type: "Squat" }, 
        { name: "Pause Squat", sets: 1, reps: 3, pct: 0.721, type: "Squat" }, 
        { name: "Pause Squat", sets: 2, reps: 2, pct: 0.74, type: "Squat" }, 
        { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, 
        { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" }, 
        { name: "OHP", sets: 3, reps: 4, pct: 0.75, type: "OHP" } 
    ],
    "Tuesday": [ 
        { name: "Bench", sets: 1, reps: 3, pct: 0.733, type: "Bench" }, 
        { name: "Bench", sets: 4, reps: 3, pct: 0.844, type: "Bench" }, 
        { name: "Floor Press", sets: 5, reps: 5, pct: 0.756, type: "Bench" } 
    ],
    "Wednesday": [ 
        { name: "Squat", sets: 1, reps: 3, pct: 0.727, type: "Squat" }, 
        { name: "Squat", sets: 2, reps: 3, pct: 0.799, type: "Squat" }, 
        { name: "Squat", sets: 1, reps: 3, pct: 0.838, type: "Squat" } 
    ],
    "Thursday": [ 
        { name: "Bench", sets: 2, reps: 2, pct: 0.756, type: "Bench" }, 
        { name: "Bench", sets: 1, reps: 3, pct: 0.844, type: "Bench" }, 
        { name: "Bench", sets: 2, reps: 2, pct: 0.8, type: "Bench" }, 
        { name: "AMRAP Bench", sets: 1, reps: "AMRAP", pct: 0.8, type: "Bench" } 
    ],
    "Friday": [ 
        { name: "Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" }, 
        { name: "Squat", sets: 2, reps: 2, pct: 0.799, type: "Squat" }, 
        { name: "Squat (Heavy)", sets: 1, reps: 1, pct: 0.903, type: "Squat" }, 
        { name: "OHP", sets: 4, reps: 8, pct: 0.68, type: "OHP" } 
    ],
    "Saturday": [ 
        { name: "Bench (Heavy)", sets: 2, reps: 1, pct: 0.933, type: "Bench" }, 
        { name: "Bench", sets: 3, reps: 4, pct: 0.756, type: "Bench" }, 
        { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, 
        { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" } 
    ]
  },
  2: {
    "Monday": [ 
        { name: "Squat", sets: 1, reps: 3, pct: 0.753, type: "Squat" }, 
        { name: "Squat", sets: 1, reps: 5, pct: 0.773, type: "Squat" }, 
        { name: "Squat", sets: 1, reps: 4, pct: 0.831, type: "Squat" }, 
        { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, 
        { name: "Deadlift", sets: 2, reps: 3, pct: 0.811, type: "Deadlift" }, 
        { name: "Deadlift", sets: 1, reps: 3, pct: 0.866, type: "Deadlift" },
        { name: "OHP", sets: 3, reps: 4, pct: 0.79, type: "OHP" } 
    ],
    "Tuesday": [ 
        { name: "Bench", sets: 1, reps: 5, pct: 0.767, type: "Bench" }, 
        { name: "Bench", sets: 3, reps: 4, pct: 0.811, type: "Bench" }, 
        { name: "Floor Press", sets: 5, reps: 5, pct: 0.778, type: "Bench" } 
    ],
    "Wednesday": [ 
        { name: "Pause Squat", sets: 2, reps: 2, pct: 0.708, type: "Squat" }, 
        { name: "Pause Squat", sets: 1, reps: 2, pct: 0.734, type: "Squat" }, 
        { name: "Pause Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" } 
    ],
    "Thursday": [ 
        { name: "Bench", sets: 1, reps: 3, pct: 0.856, type: "Bench" }, 
        { name: "Bench", sets: 2, reps: 2, pct: 0.8, type: "Bench" }, 
        { name: "AMRAP Bench", sets: 1, reps: "AMRAP", pct: 0.8, type: "Bench" } 
    ],
    "Friday": [ 
        { name: "Squat", sets: 1, reps: 3, pct: 0.753, type: "Squat" }, 
        { name: "Squat", sets: 1, reps: 5, pct: 0.825, type: "Squat" }, 
        { name: "Squat", sets: 2, reps: 5, pct: 0.799, type: "Squat" },
        { name: "OHP", sets: 4, reps: 8, pct: 0.72, type: "OHP" } 
    ],
    "Saturday": [ 
        { name: "Bench", sets: 4, reps: 5, pct: 0.822, type: "Bench" }, 
        { name: "Deadlift", sets: 2, reps: 2, pct: 0.799, type: "Deadlift" }, 
        { name: "Deadlift", sets: 1, reps: 2, pct: 0.86, type: "Deadlift" } 
    ]
  },
  3: {
    "Monday": [ 
        { name: "Squat", sets: 1, reps: 3, pct: 0.753, type: "Squat" }, 
        { name: "Squat", sets: 2, reps: 2, pct: 0.753, type: "Squat" }, 
        { name: "Squat", sets: 1, reps: 2, pct: 0.779, type: "Squat" }, 
        { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, 
        { name: "Deadlift", sets: 1, reps: 3, pct: 0.89, type: "Deadlift" }, 
        { name: "OHP", sets: 3, reps: 4, pct: 0.83, type: "OHP" } 
    ],
    "Tuesday": [ 
        { name: "Bench", sets: 2, reps: 7, pct: 0.756, type: "Bench" }, 
        { name: "Bench", sets: 2, reps: 6, pct: 0.8, type: "Bench" }, 
        { name: "Floor Press", sets: 5, reps: 5, pct: 0.789, type: "Bench" } 
    ],
    "Wednesday": [ 
        { name: "Squat", sets: 1, reps: 7, pct: 0.76, type: "Squat" }, 
        { name: "Squat", sets: 2, reps: 6, pct: 0.799, type: "Squat" }
    ],
    "Thursday": [ 
        { name: "Bench", sets: 4, reps: 5, pct: 0.7, type: "Bench" } 
    ],
    "Friday": [ 
        { name: "Pause Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" }, 
        { name: "Pause Squat", sets: 3, reps: 2, pct: 0.727, type: "Squat" }, 
        { name: "OHP", sets: 4, reps: 8, pct: 0.76, type: "OHP" } 
    ],
    "Saturday": [ 
        { name: "Bench (Heavy)", sets: 2, reps: 1, pct: 0.933, type: "Bench" }, 
        { name: "Deadlift", sets: 2, reps: 2, pct: 0.841, type: "Deadlift" }, 
        { name: "Deadlift", sets: 1, reps: 3, pct: 0.738, type: "Deadlift" } 
    ]
  },
  4: {
    "Monday": [ 
        { name: "Squat", sets: 1, reps: 4, pct: 0.753, type: "Squat" }, 
        { name: "Squat", sets: 1, reps: 4, pct: 0.773, type: "Squat" }, 
        { name: "Squat (Heavy)", sets: 1, reps: 4, pct: 0.903, type: "Squat" }, 
        { name: "Squat (Backoff)", sets: 1, reps: 4, pct: 0.87, type: "Squat" }, 
        { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, 
        { name: "Deadlift", sets: 2, reps: 3, pct: 0.738, type: "Deadlift" },
        { name: "OHP", sets: 3, reps: 4, pct: 0.87, type: "OHP" } 
    ],
    "Wednesday": [ 
        { name: "Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" }, 
        { name: "Squat", sets: 2, reps: 2, pct: 0.792, type: "Squat" }, 
        { name: "Bench", sets: 1, reps: 4, pct: 0.756, type: "Bench" }, 
        { name: "Bench", sets: 1, reps: 4, pct: 0.8, type: "Bench" }, 
        { name: "Bench", sets: 1, reps: 4, pct: 0.867, type: "Bench" } 
    ],
    "Friday": [ 
        { name: "Squat", sets: 1, reps: 3, pct: 0.903, type: "Squat" }, 
        { name: "Squat", sets: 1, reps: 3, pct: 0.942, type: "Squat" },
        { name: "OHP", sets: 4, reps: 8, pct: 0.80, type: "OHP" } 
    ],
    "Saturday": [ 
        { name: "Bench", sets: 2, reps: 2, pct: 0.756, type: "Bench" }, 
        { name: "Bench", sets: 1, reps: 3, pct: 0.8, type: "Bench" }, 
        { name: "Bench (Peak)", sets: 1, reps: 1, pct: 0.989, type: "Bench" }, 
        { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, 
        { name: "Deadlift (Heavy)", sets: 1, reps: 1, pct: 0.89, type: "Deadlift" } 
    ]
  },
  5: {
    "Monday": [ 
        { name: "Squat", sets: 2, reps: 2, pct: 0.727, type: "Squat" }, 
        { name: "Squat", sets: 2, reps: 2, pct: 0.76, type: "Squat" }, 
        { name: "Bench", sets: 1, reps: 2, pct: 0.6, type: "Bench" }, 
        { name: "Bench", sets: 2, reps: 2, pct: 0.7, type: "Bench" }, 
        { name: "Bench", sets: 2, reps: 2, pct: 0.744, type: "Bench" }, 
        { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, 
        { name: "Deadlift (Heavy)", sets: 1, reps: 3, pct: 0.909, type: "Deadlift" },
        { name: "OHP (Recovery)", sets: 3, reps: 5, pct: 0.60, type: "OHP" } 
    ],
    "Wednesday": [ 
        { name: "Squat (Peak)", sets: 1, reps: 2, pct: 0.929, type: "Squat" }, 
        { name: "Squat (Max Effort)", sets: 1, reps: 2, pct: 0.961, type: "Squat" }, 
        { name: "Bench", sets: 1, reps: 3, pct: 0.889, type: "Bench" } 
    ],
    "Friday": [ 
        { name: "Squat", sets: 2, reps: 2, pct: 0.753, type: "Squat" }, 
        { name: "Squat", sets: 4, reps: 2, pct: 0.799, type: "Squat" } 
    ],
    "Saturday": [ 
        { name: "Bench", sets: 2, reps: 2, pct: 0.756, type: "Bench" }, 
        { name: "Bench", sets: 4, reps: 2, pct: 0.8, type: "Bench" }, 
        { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, 
        { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" } 
    ]
  }
};
// Deload Logic
andreData[6] = {}; Object.keys(andreData[1]).forEach(d => { andreData[6][d] = andreData[1][d].filter(e => !(e.sets === 5 && e.reps === 5)).map(e => ({ ...e, name: `Tempo ${e.type}`, pct: e.pct * 0.95 })); });

const andreAccessories = {
  "Tuesday": [ { name: "Close Grip Bench", sets: "3x4", weeks: [1,2,3,4,6], base: 'Bench', basePct: 0.72 }, { name: "Larsen Press", sets: "3x4", weeks: [1,2,3,4,6], base: 'Bench', basePct: 0.68 }, { name: "Tricep Pushdowns", sets: "3x12", weeks: [1,2,3,6] } ],
  "Wednesday": [ { name: "Leg Extensions", sets: "3x15", weeks: [1,2,3,4,6] }, { name: "Pendulum Squat", sets: "3x8", weeks: [1,2,3,4,6] }, { name: "Walking Lunges", sets: "3x12", weeks: [1,2,3,6] }, { name: "Leg Press", sets: "4x10", weeks: [1,2,3,4,6] }, { name: "GHR", sets: "3x8", weeks: [1,2,3,4,6] } ],
  "Thursday": [ { name: "Pendlay Rows", sets: "4x6", weeks: [1,2,3,4,6] }, { name: "Weighted Pull-ups", sets: "3x8", weeks: [1,2,3,4,6] }, { name: "T-Bar Row (Chest Supp)", sets: "3x10", weeks: [1,2,3,4,6] }, { name: "Face Pulls", sets: "4x15", weeks: [1,2,3,4,5,6] } ],
  "Friday": [ { name: "DB Shoulder Press", sets: "4x10", weeks: [1,2,3,6] }, { name: "DB Lateral Raise", sets: "4x15", weeks: [1,2,3,6] }, { name: "Rear Delt Fly", sets: "4x15", weeks: [1,2,3,6] }, { name: "Arnold Press", sets: "3x10", weeks: [1,2,3,6] } ],
  "Saturday": [ { name: "RDL", sets: "4x6", weeks: [1,2,3,4,6], base: 'Deadlift', basePct: 0.55 }, { name: "Hamstring Curls", sets: "5x10", weeks: [1,2,3,4,6] }, { name: "Leg Press (High Feet)", sets: "4x12", weeks: [1,2,3,6] }, { name: "GHR", sets: "3x3", weeks: [1,2,3,4,5,6] } ]
};

// FULL TOOL DATABASES
const accessoryData = { squat: [{name:"ATG Squats",notes:"Full depth"}, {name:"Pause Squat",notes:"Position"}], bench: [{name:"Larsen Press",notes:"No legs"}, {name:"Spoto Press",notes:"Pause off chest"}], deadlift: [{name:"Seal Rows",notes:"Back saver"}, {name:"RDL",notes:"Hinge"}] };
const ptDatabase = { knees: [{name:"Spanish Squats", rx:"3x45s", context:"Max quad tension."}, {name:"TKE", rx:"3x20", context:"VMO Firing"}], back: [{name:"McGill Big 3", rx:"3x10s", context:"Core stiffness."}], shoulders: [{name:"Dead Hangs", rx:"3x30s", context:"Decompress"}] };

// ==========================================
// NEW: SMART LIBRARY (THE 70+ EXERCISE DB)
// ==========================================
// Keys: n=name, t=target, p=percent(0.65=65%), r=reps, s=source_max
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
        { n: "Halting DL", t: "Start Mechanics", p: 0.70, r: "3x5", s: "deadlift" },
        { n: "Paused DL", t: "Positioning", p: 0.70, r: "3x3", s: "deadlift" },
        
        // ** NEW SMART ADDITION **
        { n: "Snatch Grip RDL (Smart)", t: "Upper Back", p: 0.40, r: "3x10", s: "deadlift", note: "W1:3x10@40-45% | W2:3x8@45-50% | W3:2x6@50-55% | W4-5:OFF" }
    ],
    "Deadlift: Hips/Lockout": [
        // ** NEW SMART ADDITION **
        { n: "Block Pulls (Smart)", t: "Lockout", p: 0.80, r: "3x4", s: "deadlift", note: "3-4in Height. W1:3x4@80% | W2:3x3@85% | W3:2x3@90% | W4:2x1@75%" },
        
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
        { n: "Rear Delt Fly", t: "Rear Iso", p: 0.10, r: "3x15", s: "bench" }
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

const state = { maxes: { Squat:0, Bench:0, Deadlift:0, OHP:0 }, activeWeek: 1, unit: 'LBS', completed: {}, accWeights: {}, notes: {}, settings: { bw: '' }, customLifts: [] };
const inputs = { Squat: document.getElementById('squatInput'), Bench: document.getElementById('benchInput'), Deadlift: document.getElementById('deadliftInput'), OHP: document.getElementById('ohpInput') };

// *** NEW: MODIFIERS ***
let modifiers = {};

function init() {
    // 1. Initial Load
    loadCustomLifts();
    initLibraryMenu();

    // Input Listeners
    Object.keys(inputs).forEach(k => { inputs[k].addEventListener('input', e => { state.maxes[k] = parseFloat(e.target.value) || 0; saveToCloud(); render(); }); });

    onAuthStateChanged(auth, user => {
        if(user) { loadFromCloud(user.uid); document.getElementById('login-btn').style.display='none'; }
    });
    
    setupAuthButtons();
    
    // Globals
    window.setWeek = (n) => { state.activeWeek = n; saveToCloud(); render(); };
    window.toggleComplete = (id) => { state.completed[id] = !state.completed[id]; saveToCloud(); render(); };
    window.toggleAcc = (day) => { state.accOpen = state.accOpen || {}; state.accOpen[day] = !state.accOpen[day]; render(); };
    window.updateAccWeight = (id, val) => { state.accWeights[id] = val; saveToCloud(); };
    window.openTools = () => { document.getElementById('toolsModal').style.display='flex'; if(state.settings.bw) document.getElementById('bodyweight').value = state.settings.bw; };
    window.openAuthModal = () => document.getElementById('authModal').style.display='flex';
    window.closeModal = (id) => document.getElementById(id).style.display='none';
    window.saveSettings = () => { state.settings.bw = document.getElementById('bodyweight').value; saveToCloud(); };
    window.copyData = () => alert("Data Saved");
    window.onclick = e => { if(e.target.classList.contains('modal')) e.target.style.display='none'; };

    // TOOL FUNCTIONS (Full features included)
    window.openMeetPlanner = () => { const m=document.getElementById('meetModal'); const g=document.getElementById('meetGrid'); m.style.display='flex'; let h=''; ['Squat','Bench','Deadlift'].forEach(x=>{ const mx=state.maxes[x]||0; h+=`<div class="meet-col"><h4>${x}</h4><div class="attempt-row"><span>Opener</span><span class="attempt-val">${getLoad(0.91,mx)}</span></div><div class="attempt-row"><span>2nd</span><span class="attempt-val">${getLoad(0.96,mx)}</span></div><div class="attempt-row"><span>3rd</span><span class="attempt-val pr">${getLoad(1.02,mx)}</span></div></div>`; }); g.innerHTML=h; };
    window.openPlateCalc = (w) => {
        if(String(w).includes('%')) return; document.getElementById('plateModal').style.display='flex';
        const wt=parseFloat(w); document.getElementById('plateTarget').innerText=wt+" "+state.unit;
        document.getElementById('plateVisuals').innerHTML=getPlates(wt); document.getElementById('plateText').innerText="Per Side (45lb Bar)";
    };
    window.calculateOneRM = () => { const w=parseFloat(document.getElementById('calcWeight').value),r=parseFloat(document.getElementById('calcReps').value); if(w&&r) document.getElementById('oneRmResult').innerText = "Est 1RM: " + Math.round(w*(1+0.0333*r)); };
    
    // WARMUP
    window.calculateWarmup = () => {
        const t=parseFloat(document.getElementById('wuTarget').value); 
        const style=document.getElementById('wuStyle').value; 
        const lift=document.getElementById('wuLiftType').value;
        if(!t)return;
        
        let protocol = [];
        if (style === 'big') protocol = [{p:0.45,r:'5'}, {p:0.68,r:'3'}, {p:0.84,r:'1'}, {p:0.92,r:'1'}, {p:0.97,r:'OPT'}];
        else if (style === 'tight') protocol = [{p:0.40,r:'8'}, {p:0.52,r:'5'}, {p:0.64,r:'3'}, {p:0.75,r:'2'}, {p:0.84,r:'1'}, {p:0.90,r:'1'}, {p:0.94,r:'1'}, {p:0.98,r:'OPT'}];
        else protocol = [{p:0.505,r:'5'}, {p:0.608,r:'3'}, {p:0.72,r:'2'}, {p:0.834,r:'1'}, {p:0.93,r:'1'}, {p:0.97,r:'OPT'}];

        const cues = {
            squat: ["Move fast, open hips.", "Focus foot pressure.", "Start bracing.", "BELT ON.", "Max pressure.", "Final heavy feel."],
            bench: ["Active lats.", "Drive heels.", "Tight arch.", "Explode.", "Comp pause.", "Final heavy feel."],
            deadlift: ["Pull slack.", "Chest up.", "Squeeze lats.", "BELT ON.", "Comp speed.", "Final heavy feel."]
        };

        let h=''; 
        protocol.forEach((s, i) => {
            let lb = Math.round((t * s.p) / 5) * 5;
            let showBelt = (lift === 'squat' && s.p >= 0.70) || (lift === 'deadlift' && s.p >= 0.83);
            let cue = cues[lift][i] || "Focus on speed";
            let reps = s.r === 'OPT' ? 'Optional' : s.r + ' Reps';
            h += `<div class="warmup-row"><div class="warmup-meta"><span class="warmup-weight">${lb} lbs ${showBelt?'<span class="belt-badge">BELT</span>':''}</span><span>${reps}</span></div><div class="warmup-cue">${cue}</div></div>`;
        });
        document.getElementById('warmupDisplay').innerHTML = h;
    };

    window.updatePtMovements = () => { const a=document.getElementById('ptArea').value; const m=document.getElementById('ptMovement'); m.innerHTML='<option>Select...</option>'; if(ptDatabase[a]) ptDatabase[a].forEach((x,i)=>{ let o=document.createElement('option'); o.value=i; o.innerText=x.name; m.appendChild(o); }); };
    window.displayPtLogic = () => { const a=document.getElementById('ptArea').value, i=document.getElementById('ptMovement').value; if(a&&i) { const d=ptDatabase[a][i]; document.getElementById('ptDisplay').style.display='block'; document.getElementById('ptDisplay').innerHTML=`<b>${d.name}</b><br>${d.context}<br><i>RX: ${d.rx}</i>`; } };
    window.updateAccOptions = () => { const c=document.getElementById('accCategory').value; const m=document.getElementById('accExercise'); m.innerHTML=''; accessoryData[c].forEach(x=>{ let o=document.createElement('option'); o.value=x.name; o.innerText=x.name; m.appendChild(o); }); };
    window.displayAccDetails = () => { const c=document.getElementById('accCategory').value, n=document.getElementById('accExercise').value; const d=accessoryData[c].find(x=>x.name===n); if(d) { document.getElementById('accDetails').style.display='block'; document.getElementById('accDetails').innerText = d.notes; } };

    // LIBRARY LISTENERS
    document.getElementById('libCategory').addEventListener('change', updateLibExercises);
    document.getElementById('libExercise').addEventListener('change', updateLibDetails);
    document.getElementById('addLiftBtn').addEventListener('click', addCustomLift);

    render();
}

function setupAuthButtons() {
    document.getElementById('googleLoginBtn').addEventListener('click', () => signInWithPopup(auth, provider));
    document.getElementById('emailLoginBtn').addEventListener('click', () => signInWithEmailAndPassword(auth, document.getElementById('emailInput').value, document.getElementById('passInput').value));
}

// === SAVE TO USERS & LEADERBOARD ===
async function saveToCloud() {
    const user = auth.currentUser; if(!user) return;
    try { 
        // 1. Private Data
        await setDoc(doc(db, "users", user.uid), state, { merge: true }); 
        
        // 2. Leaderboard Data
        const total = (state.maxes.Squat||0) + (state.maxes.Bench||0) + (state.maxes.Deadlift||0);
        if(total > 0) {
            await setDoc(doc(db, "leaderboard", user.uid), {
                email: user.email || "Anonymous",
                total: total,
                squat: state.maxes.Squat || 0,
                bench: state.maxes.Bench || 0,
                deadlift: state.maxes.Deadlift || 0,
                unit: state.unit
            });
        }
    } catch(e) {}
}

async function loadFromCloud(uid) {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if(snap.exists()) {
            const d = snap.data();
            // Data Hydration
            if(d.maxes) { state.maxes.Squat = d.maxes.Squat||d.maxes.squat||0; state.maxes.Bench = d.maxes.Bench||d.maxes.bench||0; state.maxes.Deadlift = d.maxes.Deadlift||d.maxes.deadlift||0; state.maxes.OHP = d.maxes.OHP||d.maxes.ohp||0; }
            if(d.activeWeek) state.activeWeek = d.activeWeek;
            if(d.completed) state.completed = d.completed;
            if(d.settings) state.settings = d.settings;
            if(d.accWeights) state.accWeights = d.accWeights || {}; // Restore Accessory Weights
            if(d.customLifts) state.customLifts = d.customLifts || [];
            
            // LOAD MODIFIERS
            if (d.modifiers) modifiers = d.modifiers || {}; 

            // Visual Update
            inputs.Squat.value = state.maxes.Squat||''; inputs.Bench.value = state.maxes.Bench||'';
            inputs.Deadlift.value = state.maxes.Deadlift||''; inputs.OHP.value = state.maxes.OHP||'';
            if(state.settings.bw && document.getElementById('bodyweight')) document.getElementById('bodyweight').value = state.settings.bw;
            
            render();
        }
    } catch(e) {}
}

function getLoad(pct, max) { let v = max * pct; return Math.round(v/5)*5; }
function calculateDots(total, bw) { if(!bw || !total) return '-'; let w=parseFloat(bw)/2.20462; let t=parseFloat(total)/2.20462; const den = -0.000001093*Math.pow(w,4) + 0.0007391293*Math.pow(w,3) - 0.1918751679*Math.pow(w,2) + 24.0900756*w - 307.75076; return (t*(500/den)).toFixed(2); }
function getPlates(w) { let t=parseFloat(w); if(isNaN(t)) return ""; let s=(t-45)/2; if(s<=0)return""; const p=[45,35,25,10,5,2.5]; let h=""; p.forEach(x=>{ while(s>=x){ s-=x; h+=`<span class="plate p${String(x).replace('.','_')}-lbs">${x}</span>`; } }); return h; }

// ==========================================
// LIBRARY UI FUNCTIONS
// ==========================================
function initLibraryMenu() {
    const catSel = document.getElementById('libCategory');
    if(!catSel) return;
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
    const day = parseInt(document.getElementById('libDay').value); // 0=Monday, 1=Tuesday...
    const item = smartLibrary[cat][idx];
    
    state.customLifts.push({ ...item, dayIndex: day });
    
    saveToCloud(); // Save to Firebase for Andre User
    render();
    document.getElementById('libraryModal').style.display = 'none';
    alert(`Added ${item.n} to Week Plan`);
}

window.clearCustomLifts = function() {
    state.customLifts = [];
    saveToCloud();
    render();
    document.getElementById('libraryModal').style.display = 'none';
};

function saveCustomLifts() { localStorage.setItem('andreMapCustomLifts', JSON.stringify(state.customLifts)); }
function loadCustomLifts() {
    const data = localStorage.getItem('andreMapCustomLifts');
    if(data) state.customLifts = JSON.parse(data);
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
    
    // Save modifiers to cloud inside user object
    state.modifiers = modifiers; 
    saveToCloud(); 
    render(); 
};

// ==========================================
// RENDER (WITH CUSTOM LIFTS & MODIFIERS)
// ==========================================
function render() {
    const total = (state.maxes.Squat||0) + (state.maxes.Bench||0) + (state.maxes.Deadlift||0);
    document.getElementById('currentTotal').innerText = total;
    document.getElementById('currentDots').innerText = calculateDots(total, state.settings.bw);

    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        if(b.innerText.includes(`Week ${state.activeWeek}`) || (state.activeWeek===6 && b.innerText.includes('Deload'))) b.classList.add('active');
    });

    const cont = document.getElementById('programContent');
    cont.innerHTML = '';
    
    // WEEK CHECK
    let weekData = andreData[state.activeWeek];
    if(!weekData) { weekData = andreData[1]; state.activeWeek = 1; }

    const dayMap = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    Object.keys(weekData).forEach(day => {
        const exs = [...weekData[day]]; // Copy existing workouts
        
        // ** INJECT CUSTOM WORKOUTS **
        const dayIdx = dayMap.indexOf(day);
        state.customLifts.forEach(c => {
            if (c.dayIndex === dayIdx) {
                let typeMap = { 'squat': 'Squat', 'bench': 'Bench', 'deadlift': 'Deadlift', 'ohp': 'OHP' };
                
                // ** ANDRE SMART LOGIC (BLOCK PULLS / SNATCH GRIP) **
                let pct = c.p;
                let reps = c.r;
                let week = state.activeWeek;

                if (c.n.includes("Block Pulls (Smart)")) {
                    if (week === 1) { pct = 0.80; reps = "4"; }
                    if (week === 2) { pct = 0.85; reps = "3"; }
                    if (week === 3) { pct = 0.90; reps = "3"; } // Range 88-90
                    if (week === 4) { pct = 0.75; reps = "1"; } // Range 70-75
                    // W5/6 logic defaults to 0.70/Deload
                }
                
                if (c.n.includes("Snatch Grip RDL (Smart)")) {
                     if (week === 1) { pct = 0.45; reps = "10"; }
                     if (week === 2) { pct = 0.50; reps = "8"; }
                     if (week === 3) { pct = 0.55; reps = "6"; }
                     if (week >= 4) { pct = 0; reps = "OFF"; } // Off logic
                }
                
                if (pct > 0) {
                    // Deload check
                    if (state.activeWeek === 6) pct = pct * 0.90; 
                    
                    exs.push({
                        name: c.n + " ⭐", 
                        sets: "3", 
                        reps: reps, 
                        pct: pct, 
                        type: typeMap[c.s] 
                    });
                }
            }
        });

        const accList = andreAccessories[day];
        const showAcc = accList && (state.activeWeek < 5 || state.activeWeek === 6);
        
        const card = document.createElement('div'); card.className = 'day-container';
        let head = `<div class="day-header"><span>${day}</span></div>`;
        let html = `<table>`;
        
        exs.forEach((m, i) => {
            const uid = `Andre-${state.activeWeek}-${day}-${i}`;
            const max = state.maxes[m.type] || 0;
            // Handle Custom Rep Strings like "3x15s" vs Andre numbers "3"
            let setRepStr = (typeof m.sets === 'string') ? `${m.sets} Sets` : `${m.sets} x ${m.reps}`;
            if (m.name.includes("⭐")) setRepStr = `${m.reps}`; 

            let baseLoad = (max > 0) ? Math.round((max * m.pct)/5)*5 : 0;
            
            // *** APPLY MODIFIER ***
            let modifier = modifiers[m.name] || 1.0;
            let finalLoad = Math.round((baseLoad * modifier) / 5) * 5;
            let loadDisplay = "";
            let style = "";
            let warn = "";

            if (baseLoad > 0) {
                if (modifier !== 1.0) {
                    style = "color:#ff4444; font-weight:bold;";
                    warn = " ⚠️";
                }
                loadDisplay = `<span style="${style}">${finalLoad} LBS${warn}</span> <span onclick="adjustWeight('${m.name}', ${baseLoad})" style="cursor:pointer; font-size:12px; color:#aaa; margin-left:5px;">✎</span>`;
            } else {
                loadDisplay = Math.round(m.pct*100) + "%";
            }

            html += `<tr class="row-${m.type} ${state.completed[uid]?'completed':''}" onclick="toggleComplete('${uid}')"><td>${m.name}</td><td>${setRepStr}</td><td class="load-cell" onclick="event.stopPropagation();openPlateCalc('${finalLoad}')">${loadDisplay}</td></tr>`;
        });
        html += `</table>`;

        if(showAcc) {
            let accHtml = `<div class="acc-section"><div class="acc-toggle" onclick="toggleAcc('${day}')"><span>Accessories</span><span>▼</span></div><div class="acc-content ${state.accOpen && state.accOpen[day]?'open':''}">`;
            accList.filter(a => a.weeks.includes(state.activeWeek)).forEach(a => {
                const accId = `acc-${day}-${a.name}`;
                let recHtml = '';
                if(a.base && state.maxes[a.base] > 0) {
                    let w = state.activeWeek === 6 ? 0 : state.activeWeek - 1;
                    let load = Math.round((state.maxes[a.base] * (a.basePct + (w * 0.025)))/5)*5;
                    recHtml = `<span class="acc-rec">Rec: ${load} LBS</span>`;
                }
                // Use stored weight or empty
                const val = state.accWeights[accId] || '';
                accHtml += `<div class="acc-row"><div class="acc-info"><span class="acc-name">${a.name}</span>${recHtml}</div><span class="acc-sets">${a.sets}</span><input class="acc-input" value="${val}" onchange="updateAccWeight('${accId}',this.value)"></div>`;
            });
            html += accHtml + `</div></div>`;
        }
        card.innerHTML = head + html;
        cont.appendChild(card);
    });
}

init();

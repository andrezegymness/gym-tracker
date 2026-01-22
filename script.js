/* =========================================
   1. FIREBASE SETUP & IMPORTS
   ========================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// ADDED: setPersistence, browserLocalPersistence
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, getRedirectResult, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// YOUR KEYS
const firebaseConfig = {
    apiKey: "AIzaSyB_1QW2BtfK5eZzakW858fg2UlAS5tZY7M",
    authDomain: "powerlifting-programs.firebaseapp.com",
    projectId: "powerlifting-programs",
    storageBucket: "powerlifting-programs.firebasestorage.app",
    messagingSenderId: "961044250962",
    appId: "1:961044250962:web:c45644c186e9bb6ee67a8b",
    measurementId: "G-501TXRLMSQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

/* =========================================
   2. YOUR PROGRAM DATA
   ========================================= */
const programData = {
  1: {
    "Monday": [
      { name: "Pause Squat", sets: 2, reps: 2, pct: 0.701, type: "Squat" },
      { name: "Pause Squat", sets: 1, reps: 3, pct: 0.721, type: "Squat" },
      { name: "Pause Squat", sets: 2, reps: 2, pct: 0.74, type: "Squat" },
      { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" },
      { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" },
      { name: "OHP", sets: 4, reps: 2, pct: 0.804, type: "OHP" }
    ],
    "Tuesday": [
      { name: "Bench", sets: 1, reps: 3, pct: 0.733, type: "Bench" },
      { name: "Bench", sets: 4, reps: 3, pct: 0.844, type: "Bench" },
      { name: "Floor Press", sets: 5, reps: 5, pct: 0.756, type: "Bench" }
    ],
    "Wednesday": [
      { name: "Squat", sets: 1, reps: 3, pct: 0.727, type: "Squat" },
      { name: "Squat", sets: 2, reps: 3, pct: 0.799, type: "Squat" },
      { name: "Squat", sets: 1, reps: 3, pct: 0.838, type: "Squat" },
      { name: "OHP", sets: 4, reps: 3, pct: 0.804, type: "OHP" }
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
      { name: "OHP", sets: 4, reps: 2, pct: 0.804, type: "OHP" }
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
      { name: "Deadlift", sets: 1, reps: 3, pct: 0.866, type: "Deadlift" }
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
      { name: "Squat", sets: 2, reps: 5, pct: 0.799, type: "Squat" }
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
      { name: "OHP", sets: 4, reps: 2, pct: 0.826, type: "OHP" }
    ],
    "Tuesday": [
      { name: "Bench", sets: 2, reps: 7, pct: 0.756, type: "Bench" },
      { name: "Bench", sets: 2, reps: 6, pct: 0.8, type: "Bench" },
      { name: "Floor Press", sets: 5, reps: 5, pct: 0.789, type: "Bench" }
    ],
    "Wednesday": [
      { name: "Squat", sets: 1, reps: 7, pct: 0.76, type: "Squat" },
      { name: "Squat", sets: 2, reps: 6, pct: 0.799, type: "Squat" },
      { name: "OHP", sets: 4, reps: 6, pct: 0.783, type: "OHP" }
    ],
    "Thursday": [
      { name: "Bench", sets: 4, reps: 5, pct: 0.7, type: "Bench" }
    ],
    "Friday": [
      { name: "Pause Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" },
      { name: "Pause Squat", sets: 3, reps: 2, pct: 0.727, type: "Squat" },
      { name: "OHP", sets: 4, reps: 2, pct: 0.783, type: "OHP" }
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
      { name: "Deadlift", sets: 2, reps: 3, pct: 0.738, type: "Deadlift" }
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
      { name: "Squat", sets: 1, reps: 3, pct: 0.942, type: "Squat" }
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
      { name: "Deadlift (Heavy)", sets: 1, reps: 3, pct: 0.909, type: "Deadlift" }
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

// Generate DELOAD Week 6
programData[6] = {};
const deloadSource = programData[1];
Object.keys(deloadSource).forEach(day => {
  const exercises = deloadSource[day]
    .filter(e => !(e.sets === 5 && e.reps === 5)) 
    .map(e => ({
      ...e,
      name: e.type === "OHP" ? "Tempo OHP (3-1-1)" : `Tempo ${e.type} (3-2-1)`,
      pct: e.pct * 0.95, 
      originalType: e.type
    }));
  programData[6][day] = exercises;
});

const accessories = {
  "Tuesday": [
    { name: "Close Grip Bench", sets: "3x4", weeks: [1,2,3,4,6], base: 'Bench', basePct: 0.72 },
    { name: "Larsen Press", sets: "3x4", weeks: [1,2,3,4,6], base: 'Bench', basePct: 0.68 },
    { name: "Tricep Pushdowns", sets: "3x12", weeks: [1,2,3,6] }
  ],
  "Wednesday": [
    { name: "Leg Extensions", sets: "3x15", weeks: [1,2,3,4,6] },
    { name: "Pendulum Squat", sets: "3x8", weeks: [1,2,3,4,6] },
    { name: "Walking Lunges", sets: "3x12", weeks: [1,2,3,6] },
    { name: "Leg Press", sets: "4x10", weeks: [1,2,3,4,6] },
    { name: "GHR", sets: "3x8", weeks: [1,2,3,4,6] }
  ],
  "Thursday": [
    { name: "Pendlay Rows", sets: "4x6", weeks: [1,2,3,4,6] },
    { name: "Weighted Pull-ups", sets: "3x8", weeks: [1,2,3,4,6] },
    { name: "T-Bar Row (Chest Supp)", sets: "3x10", weeks: [1,2,3,4,6] },
    { name: "Face Pulls", sets: "4x15", weeks: [1,2,3,4,5,6] }
  ],
  "Friday": [
    { name: "DB Shoulder Press", sets: "4x10", weeks: [1,2,3,6] },
    { name: "DB Lateral Raise", sets: "4x15", weeks: [1,2,3,6] },
    { name: "Rear Delt Fly", sets: "4x15", weeks: [1,2,3,6] },
    { name: "Arnold Press", sets: "3x10", weeks: [1,2,3,6] }
  ],
  "Saturday": [
    { name: "RDL", sets: "4x6", weeks: [1,2,3,4,6], base: 'Deadlift', basePct: 0.55 },
    { name: "Hamstring Curls", sets: "5x10", weeks: [1,2,3,4,6] },
    { name: "Leg Press (High Feet)", sets: "4x12", weeks: [1,2,3,6] },
    { name: "GHR", sets: "3x3", weeks: [1,2,3,4,5,6] }
  ]
};

const technicalCues = {
  Squat: ["Root feet", "Brace 360", "Pull bar into traps", "Chest up"],
  Bench: ["Retract scapula", "Leg drive", "Meet bar with chest", "Bend bar"],
  Deadlift: ["Slack out", "Wedge hips", "Push floor away", "Lats on"],
  OHP: ["Squeeze glutes", "Ribs down", "Head through window"],
  Tempo: ["Count 3-2-1 down", "Explode up", "Perfect positioning"]
};

/* =========================================
   3. APP LOGIC (State & Functions)
   ========================================= */

// --- APP STATE ---
const state = {
  maxes: { Squat: 0, Bench: 0, Deadlift: 0, OHP: 0 },
  activeWeek: 1,
  unit: 'LBS',
  completed: {}, 
  accWeights: {}, 
  notes: {}, 
  settings: { rackSquat: '', rackBench: '', bw: '' },
  warmupTarget: 0, warmupType: 'Squat', accOpen: {},
  timer: 180, timerRunning: false, timerInterval: null
};

// Inputs from HTML
const inputs = {
  Squat: document.getElementById('squatInput'),
  Bench: document.getElementById('benchInput'),
  Deadlift: document.getElementById('deadliftInput'),
  OHP: document.getElementById('ohpInput')
};

// --- INIT ---
function init() {
  // 1. Listen for Inputs (Typing)
  Object.keys(inputs).forEach(key => {
    inputs[key].addEventListener('input', (e) => {
      state.maxes[key] = parseFloat(e.target.value) || 0;
      deferredSave(); 
      render();
    });
  });

  // 2. CHECK FOR REDIRECT RESULT (The "Catcher" Logic)
  // This must run before Auth State Listener
  getRedirectResult(auth)
    .then((result) => {
        if (result && result.user) {
            console.log("Returned from Redirect Login:", result.user.email);
            // We don't need to do anything else, the AuthListener below will handle the rest
        }
    })
    .catch((error) => {
        console.error("Redirect Error:", error);
    });

  // 3. Auth Listener (The Key to Firebase)
  onAuthStateChanged(auth, (user) => {
      if (user) {
          console.log("User found, loading cloud data...");
          loadFromCloud(user.uid);
          const loginBtn = document.getElementById('login-btn');
          const logoutBtn = document.getElementById('logout-btn');
          if(loginBtn) loginBtn.style.display = 'none';
          if(logoutBtn) {
             logoutBtn.style.display = 'flex';
             logoutBtn.innerHTML = `<span class="icon">👋</span> ${user.displayName.split(' ')[0]}`;
          }
      } else {
          console.log("No user, empty state.");
          const loginBtn = document.getElementById('login-btn');
          const logoutBtn = document.getElementById('logout-btn');
          if(loginBtn) loginBtn.style.display = 'flex';
          if(logoutBtn) logoutBtn.style.display = 'none';
          render(); 
      }
  });

  // 4. Login/Logout Buttons
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');

  if(loginBtn) {
      loginBtn.addEventListener('click', () => {
          // MOBILE FIX: Set Persistence FIRST, then Redirect
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          
          if (isMobile) {
            // Force browser to REMEMBER the user before redirecting
            setPersistence(auth, browserLocalPersistence)
                .then(() => {
                    return signInWithRedirect(auth, provider);
                })
                .catch((error) => {
                    alert("Login Error: " + error.message);
                });
          } else {
            // Computers: Use Popup
            signInWithPopup(auth, provider).catch(console.error);
          }
      });
  }
  if(logoutBtn) {
      logoutBtn.addEventListener('click', () => {
          signOut(auth).then(() => {
              location.reload(); 
          });
      });
  }

  // 5. Modal Closer
  window.onclick = function(e) { if (e.target.classList.contains('modal')) e.target.style.display = "none"; }
  
  // 6. Initial Render
  render();
  updateTimerDisplay();
}

// --- CLOUD SAVING ---
let saveTimeout;
function deferredSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToCloud, 1500); 
}

async function saveToCloud() { 
  const user = auth.currentUser;
  if (!user) return; 

  state.ownerEmail = user.email;
  state.ownerName = user.displayName;
  state.lastSaved = new Date().toDateString();

  try {
      await setDoc(doc(db, "users", user.uid), state, { merge: true });
      console.log("Saved to Cloud!");
      
      const brand = document.querySelector('.brand');
      if(brand) {
          brand.style.color = '#4caf50';
          setTimeout(() => brand.style.color = '#fff', 500);
      }
  } catch(e) {
      console.error("Save failed:", e);
  }
}

async function loadFromCloud(uid) {
  try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
          const cloudData = docSnap.data();
          
          if(cloudData.maxes) state.maxes = cloudData.maxes;
          if(cloudData.activeWeek) state.activeWeek = cloudData.activeWeek;
          if(cloudData.unit) state.unit = cloudData.unit;
          if(cloudData.completed) state.completed = cloudData.completed;
          if(cloudData.accWeights) state.accWeights = cloudData.accWeights;
          if(cloudData.notes) state.notes = cloudData.notes;
          if(cloudData.settings) state.settings = cloudData.settings;
          
          Object.keys(state.maxes).forEach(k => { 
            if(inputs[k] && state.maxes[k] > 0) inputs[k].value = state.maxes[k]; 
          });
          document.getElementById('rackSquat').value = state.settings.rackSquat || '';
          document.getElementById('rackBench').value = state.settings.rackBench || '';
          document.getElementById('bodyweight').value = state.settings.bw || '';

          render(); 
      }
  } catch(e) {
      console.error("Load failed:", e);
  }
}

// --- GLOBAL ACTIONS ---
window.setWeek = (n) => { state.activeWeek = n; deferredSave(); render(); }
window.toggleUnit = () => { state.unit = state.unit === 'LBS' ? 'KG' : 'LBS'; deferredSave(); render(); }
window.toggleComplete = (id) => { state.completed[id] = !state.completed[id]; deferredSave(); render(); }
window.toggleAcc = (day) => { state.accOpen[day] = !state.accOpen[day]; render(); }
window.updateAccWeight = (id, val) => { state.accWeights[id] = val; deferredSave(); }
window.updateNote = (id, val) => { state.notes[id] = val; deferredSave(); }
window.saveSettings = () => {
  state.settings.rackSquat = document.getElementById('rackSquat').value;
  state.settings.rackBench = document.getElementById('rackBench').value;
  state.settings.bw = document.getElementById('bodyweight').value;
  deferredSave();
  render(); 
}

// --- TOOLS ---
window.openTools = () => { document.getElementById('toolsModal').style.display = 'flex'; }
window.copyData = () => {
  const code = JSON.stringify(state);
  document.getElementById("exportArea").value = code;
  alert("Data Ready to Export (Check the box)");
}

// --- CALCS ---
function calculateDots(total, bw, unit) {
  if(!bw || !total) return '-';
  let w = parseFloat(bw);
  let t = parseFloat(total);
  if (unit === 'LBS') { w /= 2.20462; t /= 2.20462; }
  const denominator = -0.000001093 * Math.pow(w, 4) + 0.0007391293 * Math.pow(w, 3) - 0.1918751679 * Math.pow(w, 2) + 24.0900756 * w - 307.75076;
  const score = (500 / denominator) * t;
  return score.toFixed(2);
}

function getLoad(pct, max) {
  let v = max * pct;
  if(state.unit === 'KG') { v = v*0.453592; v = Math.round(v/2.5)*2.5; }
  else { v = Math.round(v/5)*5; }
  return v;
}

// --- RENDER ---
function render() {
  document.getElementById('unitLabel').innerText = state.unit;
  
  const total = (state.maxes.Squat || 0) + (state.maxes.Bench || 0) + (state.maxes.Deadlift || 0);
  document.getElementById('currentTotal').innerText = total > 0 ? `${total}` : '0';
  document.getElementById('currentDots').innerText = calculateDots(total, state.settings.bw, state.unit);
  
  let totalItems = 0; let completedItems = 0;
  const wd = programData[state.activeWeek];
  if(wd) {
      ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].forEach(d => {
       if(wd[d]) wd[d].forEach((_,i) => {
         totalItems++;
         if(state.completed[`${state.activeWeek}-${d}-${i}`]) completedItems++;
       });
      });
  }
  const pct = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  document.getElementById('progressBar').style.width = `${pct}%`;

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('active');
    if(b.innerText.includes(`Week ${state.activeWeek}`) || b.innerText === `Week ${state.activeWeek}` || (state.activeWeek===6 && b.innerText.includes('Deload'))) b.classList.add('active');
  });

  const cont = document.getElementById('programContent');
  cont.innerHTML = '';
  
  const weekData = programData[state.activeWeek];
  if(!weekData) return;
  
  ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].forEach(day => {
    const exs = weekData[day];
    const accList = accessories[day];
    const showAcc = accList && (state.activeWeek < 5 || state.activeWeek === 6);

    if(!exs && !showAcc) return; 

    const card = document.createElement('div');
    card.className = 'day-container';
    
    let head = `<div class="day-header"><span>${day}</span>`;
    if(exs) {
      const main = exs.find(e => ["Squat","Bench","Deadlift","OHP"].includes(e.type));
      if(main && state.maxes[main.type] > 0) {
        head += `<button class="warmup-btn" onclick="openWarmup('${main.type}','${getLoad(main.pct, state.maxes[main.type])}')">Warm-up</button>`;
      }
    }
    head += `</div>`;
    
    let table = '';
    if(exs) {
      let rows = exs.map((m, i) => {
        const uid = `${state.activeWeek}-${day}-${i}`;
        const lookupType = m.originalType || m.type; 
        const max = state.maxes[lookupType] || 0;
        let ld = '-', rl = 0;
        if(max > 0) { rl = getLoad(m.pct, max); ld = `${rl} ${state.unit}`; }
        else { ld = `${Math.round(m.pct*100)}%`; }
        return `<tr class="row-${m.type} ${state.completed[uid]?'completed':''}" onclick="toggleComplete('${uid}')">
          <td>${m.name}</td><td>${m.sets}</td><td>${m.reps}</td>
          <td class="load-cell" onclick="event.stopPropagation();openPlateCalc('${rl}')">${ld}</td>
        </tr>`;
      }).join('');
      table = `<table><thead><tr><th>Lift</th><th>Sets</th><th>Reps</th><th>Load</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    
    let accHtml = '';
    if(showAcc) {
      const relevantAcc = accList.filter(a => a.weeks.includes(state.activeWeek));
      if(relevantAcc.length > 0) {
        const isOpen = state.accOpen[day] ? 'open' : '';
        const arrow = state.accOpen[day] ? '▼' : '►';
        let accRows = relevantAcc.map((a, i) => {
          const accId = `acc-${day}-${a.name}`;
          const val = state.accWeights[accId] || '';
          let recHtml = '';
          if(a.base && state.maxes[a.base] > 0) {
            let weeksElapsed = state.activeWeek - 1;
            if(state.activeWeek === 6) weeksElapsed = 0; 
            const overload = weeksElapsed * 0.025;
            const currentPct = a.basePct + overload;
            const recLoad = getLoad(currentPct, state.maxes[a.base]);
            recHtml = `<span class="acc-rec">Rec: ${recLoad} ${state.unit}</span>`;
          }
          return `<div class="acc-row"><div class="acc-info"><span class="acc-name">${a.name}</span>${recHtml}</div><span class="acc-sets">${a.sets}</span><input class="acc-input" placeholder="lbs" value="${val}" onchange="updateAccWeight('${accId}', this.value)"></div>`;
        }).join('');
        accHtml = `<div class="acc-section"><button class="acc-toggle" onclick="toggleAcc('${day}')"><span>Accessories</span><span>${arrow}</span></button><div class="acc-content ${isOpen}">${accRows}</div></div>`;
      }
    }
    const noteId = `note-${state.activeWeek}-${day}`; const noteVal = state.notes[noteId] || '';
    const notesHtml = `<div class="notes-section"><textarea class="notes-input" placeholder="Session Notes..." onchange="updateNote('${noteId}', this.value)">${noteVal}</textarea></div>`;
    card.innerHTML = head + table + accHtml + notesHtml;
    cont.appendChild(card);
  });
}

// --- HELPER WINDOW FUNCTIONS ---
window.openMeetPlanner=()=>{const m=document.getElementById('meetModal');const g=document.getElementById('meetGrid');m.style.display='flex';const l=['Squat','Bench','Deadlift'];let h='';l.forEach(x=>{const mx=state.maxes[x]||0;h+=`<div class="meet-col"><h4 style="border-color:var(--${x.toLowerCase()})">${x}</h4><div class="attempt-row"><span class="attempt-label">Opener</span><span class="attempt-val">${mx>0?getLoad(0.91,mx)+' '+state.unit:'-'}</span></div><div class="attempt-row"><span class="attempt-label">2nd</span><span class="attempt-val">${mx>0?getLoad(0.96,mx)+' '+state.unit:'-'}</span></div><div class="attempt-row"><span class="attempt-label">3rd</span><span class="attempt-val pr">${mx>0?getLoad(1.02,mx)+' '+state.unit:'-'}</span></div></div>`;});g.innerHTML=h;}
window.toggleTimer=()=>{if(state.timerRunning){clearInterval(state.timerInterval);state.timerRunning=false;document.getElementById('timerToggle').innerText="Start";}else{state.timerRunning=true;document.getElementById('timerToggle').innerText="Pause";state.timerInterval=setInterval(()=>{if(state.timer>0){state.timer--;updateTimerDisplay();}else{clearInterval(state.timerInterval);state.timerRunning=false;document.getElementById('timerToggle').innerText="Start";alert("Rest!");resetTimer();}},1000);}}
window.adjustTimer=(s)=>{state.timer+=s;if(state.timer<0)state.timer=0;updateTimerDisplay();}
window.resetTimer=()=>{clearInterval(state.timerInterval);state.timerRunning=false;state.timer=180;document.getElementById('timerToggle').innerText="Start";updateTimerDisplay();}
function updateTimerDisplay(){const m=Math.floor(state.timer/60);const s=state.timer%60;document.getElementById('timerText').innerText=`${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;}
window.openPlateCalc=(w)=>{if(w.includes('%'))return;document.getElementById('plateModal').style.display='flex';const wt=parseFloat(w);document.getElementById('plateTarget').innerText=`${wt} ${state.unit}`;const b=state.unit==='LBS'?45:20;let r=(wt-b)/2;const v=document.getElementById('plateVisuals');const t=document.getElementById('plateText');v.innerHTML='';if(r<0){t.innerText="Weight < Bar";return;}const p=state.unit==='LBS'?[45,35,25,10,5,2.5]:[25,20,15,10,5,2.5,1.25];let h='';let m={};p.forEach(x=>{while(r>=x){r-=x;m[x]=(m[x]||0)+1;let c=`p-${x.toString().replace('.','-')}${state.unit==='LBS'&&x<45&&x>2.5?'-lbs':''}`;h+=`<div class="plate ${c}" title="${x}"></div>`;}});v.innerHTML=h;t.innerText=Object.entries(m).sort((a,b)=>b[0]-a[0]).map(([k,v])=>`${v}x${k}`).join(', ')+" /side";}
window.openWarmup=(t,w)=>{state.warmupType=t;state.warmupTarget=parseFloat(w);document.getElementById('warmupModal').style.display='flex';document.getElementById('warmupTitle').innerText=`${t} Warm-up`;renderWarmup();}
window.renderWarmup=()=>{const s=document.getElementById('warmupStrategy').value;const t=state.warmupTarget;document.getElementById('cuesList').innerHTML=(technicalCues[state.warmupType]||[]).map(c=>`<li>${c}</li>`).join('');const st=s==='aggressive'?[{p:0,r:10},{p:0.5,r:5},{p:0.7,r:3},{p:0.9,r:1}]:[{p:0,r:10},{p:0.4,r:5},{p:0.5,r:5},{p:0.6,r:3},{p:0.7,r:2},{p:0.8,r:1},{p:0.9,r:1}];const b=state.unit==='LBS'?45:20;let h=st.map(x=>{let w=x.p===0?b:t*x.p;w=state.unit==='LBS'?Math.round(w/5)*5:Math.round(w/2.5)*2.5;if(w>=t)return'';return`<tr><td>${x.p===0?'Bar':(x.p*100)+'%'}</td><td style="font-weight:bold;color:#fff">${w} ${state.unit}</td><td>${x.r}</td></tr>`;}).join('');h+=`<tr style="border-left:4px solid var(--accent)"><td>WORK</td><td style="font-weight:bold;color:var(--accent)">${t} ${state.unit}</td><td>-</td></tr>`;document.getElementById('warmupTable').innerHTML=h;}
window.closeModal=(id)=>{document.getElementById(id).style.display="none";}

// Start the engine
init();

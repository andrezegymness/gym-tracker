/* =========================================
   1. FIREBASE SETUP & IMPORTS
   ========================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
const provider = new GoogleAuthProvider();

/* =========================================
   2. DATA: ANDRE MAP WAVE (Restored Full Data)
   ========================================= */
const andreData = {
  1: {
    "Monday": [ { name: "Pause Squat", sets: 2, reps: 2, pct: 0.701, type: "Squat" }, { name: "Pause Squat", sets: 1, reps: 3, pct: 0.721, type: "Squat" }, { name: "Pause Squat", sets: 2, reps: 2, pct: 0.74, type: "Squat" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" }, { name: "OHP", sets: 4, reps: 2, pct: 0.804, type: "OHP" } ],
    "Tuesday": [ { name: "Bench", sets: 1, reps: 3, pct: 0.733, type: "Bench" }, { name: "Bench", sets: 4, reps: 3, pct: 0.844, type: "Bench" }, { name: "Floor Press", sets: 5, reps: 5, pct: 0.756, type: "Bench" } ],
    "Wednesday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.727, type: "Squat" }, { name: "Squat", sets: 2, reps: 3, pct: 0.799, type: "Squat" }, { name: "Squat", sets: 1, reps: 3, pct: 0.838, type: "Squat" }, { name: "OHP", sets: 4, reps: 3, pct: 0.804, type: "OHP" } ],
    "Thursday": [ { name: "Bench", sets: 2, reps: 2, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 1, reps: 3, pct: 0.844, type: "Bench" }, { name: "Bench", sets: 2, reps: 2, pct: 0.8, type: "Bench" }, { name: "AMRAP Bench", sets: 1, reps: "AMRAP", pct: 0.8, type: "Bench" } ],
    "Friday": [ { name: "Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 2, reps: 2, pct: 0.799, type: "Squat" }, { name: "Squat (Heavy)", sets: 1, reps: 1, pct: 0.903, type: "Squat" }, { name: "OHP", sets: 4, reps: 2, pct: 0.804, type: "OHP" } ],
    "Saturday": [ { name: "Bench (Heavy)", sets: 2, reps: 1, pct: 0.933, type: "Bench" }, { name: "Bench", sets: 3, reps: 4, pct: 0.756, type: "Bench" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" } ]
  },
  2: {
    "Monday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 1, reps: 5, pct: 0.773, type: "Squat" }, { name: "Squat", sets: 1, reps: 4, pct: 0.831, type: "Squat" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.811, type: "Deadlift" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.866, type: "Deadlift" } ],
    "Tuesday": [ { name: "Bench", sets: 1, reps: 5, pct: 0.767, type: "Bench" }, { name: "Bench", sets: 3, reps: 4, pct: 0.811, type: "Bench" }, { name: "Floor Press", sets: 5, reps: 5, pct: 0.778, type: "Bench" } ],
    "Wednesday": [ { name: "Pause Squat", sets: 2, reps: 2, pct: 0.708, type: "Squat" }, { name: "Pause Squat", sets: 1, reps: 2, pct: 0.734, type: "Squat" }, { name: "Pause Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" } ],
    "Thursday": [ { name: "Bench", sets: 1, reps: 3, pct: 0.856, type: "Bench" }, { name: "Bench", sets: 2, reps: 2, pct: 0.8, type: "Bench" }, { name: "AMRAP Bench", sets: 1, reps: "AMRAP", pct: 0.8, type: "Bench" } ],
    "Friday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 1, reps: 5, pct: 0.825, type: "Squat" }, { name: "Squat", sets: 2, reps: 5, pct: 0.799, type: "Squat" } ],
    "Saturday": [ { name: "Bench", sets: 4, reps: 5, pct: 0.822, type: "Bench" }, { name: "Deadlift", sets: 2, reps: 2, pct: 0.799, type: "Deadlift" }, { name: "Deadlift", sets: 1, reps: 2, pct: 0.86, type: "Deadlift" } ]
  },
  3: {
    "Monday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 2, reps: 2, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 1, reps: 2, pct: 0.779, type: "Squat" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.89, type: "Deadlift" }, { name: "OHP", sets: 4, reps: 2, pct: 0.826, type: "OHP" } ],
    "Tuesday": [ { name: "Bench", sets: 2, reps: 7, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 2, reps: 6, pct: 0.8, type: "Bench" }, { name: "Floor Press", sets: 5, reps: 5, pct: 0.789, type: "Bench" } ],
    "Wednesday": [ { name: "Squat", sets: 1, reps: 7, pct: 0.76, type: "Squat" }, { name: "Squat", sets: 2, reps: 6, pct: 0.799, type: "Squat" }, { name: "OHP", sets: 4, reps: 6, pct: 0.783, type: "OHP" } ],
    "Thursday": [ { name: "Bench", sets: 4, reps: 5, pct: 0.7, type: "Bench" } ],
    "Friday": [ { name: "Pause Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" }, { name: "Pause Squat", sets: 3, reps: 2, pct: 0.727, type: "Squat" }, { name: "OHP", sets: 4, reps: 2, pct: 0.783, type: "OHP" } ],
    "Saturday": [ { name: "Bench (Heavy)", sets: 2, reps: 1, pct: 0.933, type: "Bench" }, { name: "Deadlift", sets: 2, reps: 2, pct: 0.841, type: "Deadlift" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.738, type: "Deadlift" } ]
  },
  4: {
    "Monday": [ { name: "Squat", sets: 1, reps: 4, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 1, reps: 4, pct: 0.773, type: "Squat" }, { name: "Squat (Heavy)", sets: 1, reps: 4, pct: 0.903, type: "Squat" }, { name: "Squat (Backoff)", sets: 1, reps: 4, pct: 0.87, type: "Squat" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.738, type: "Deadlift" } ],
    "Wednesday": [ { name: "Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 2, reps: 2, pct: 0.792, type: "Squat" }, { name: "Bench", sets: 1, reps: 4, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 1, reps: 4, pct: 0.8, type: "Bench" }, { name: "Bench", sets: 1, reps: 4, pct: 0.867, type: "Bench" } ],
    "Friday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.903, type: "Squat" }, { name: "Squat", sets: 1, reps: 3, pct: 0.942, type: "Squat" } ],
    "Saturday": [ { name: "Bench", sets: 2, reps: 2, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 1, reps: 3, pct: 0.8, type: "Bench" }, { name: "Bench (Peak)", sets: 1, reps: 1, pct: 0.989, type: "Bench" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift (Heavy)", sets: 1, reps: 1, pct: 0.89, type: "Deadlift" } ]
  },
  5: {
    "Monday": [ { name: "Squat", sets: 2, reps: 2, pct: 0.727, type: "Squat" }, { name: "Squat", sets: 2, reps: 2, pct: 0.76, type: "Squat" }, { name: "Bench", sets: 1, reps: 2, pct: 0.6, type: "Bench" }, { name: "Bench", sets: 2, reps: 2, pct: 0.7, type: "Bench" }, { name: "Bench", sets: 2, reps: 2, pct: 0.744, type: "Bench" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift (Heavy)", sets: 1, reps: 3, pct: 0.909, type: "Deadlift" } ],
    "Wednesday": [ { name: "Squat (Peak)", sets: 1, reps: 2, pct: 0.929, type: "Squat" }, { name: "Squat (Max Effort)", sets: 1, reps: 2, pct: 0.961, type: "Squat" }, { name: "Bench", sets: 1, reps: 3, pct: 0.889, type: "Bench" } ],
    "Friday": [ { name: "Squat", sets: 2, reps: 2, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 4, reps: 2, pct: 0.799, type: "Squat" } ],
    "Saturday": [ { name: "Bench", sets: 2, reps: 2, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 4, reps: 2, pct: 0.8, type: "Bench" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" } ]
  }
};
// Deload Generation for Andre
andreData[6] = {};
if(andreData[1]) {
    Object.keys(andreData[1]).forEach(day => {
      andreData[6][day] = andreData[1][day].filter(e => !(e.sets === 5 && e.reps === 5)).map(e => ({
          ...e, name: `Tempo ${e.type}`, pct: e.pct * 0.95
      }));
    });
}

// Andre Accessories
const andreAccessories = {
  "Tuesday": [ { name: "Close Grip Bench", sets: "3x4", weeks: [1,2,3,4,6], base: 'Bench', basePct: 0.72 }, { name: "Larsen Press", sets: "3x4", weeks: [1,2,3,4,6], base: 'Bench', basePct: 0.68 }, { name: "Tricep Pushdowns", sets: "3x12", weeks: [1,2,3,6] } ],
  "Wednesday": [ { name: "Leg Extensions", sets: "3x15", weeks: [1,2,3,4,6] }, { name: "Pendulum Squat", sets: "3x8", weeks: [1,2,3,4,6] }, { name: "Walking Lunges", sets: "3x12", weeks: [1,2,3,6] }, { name: "Leg Press", sets: "4x10", weeks: [1,2,3,4,6] }, { name: "GHR", sets: "3x8", weeks: [1,2,3,4,6] } ],
  "Thursday": [ { name: "Pendlay Rows", sets: "4x6", weeks: [1,2,3,4,6] }, { name: "Weighted Pull-ups", sets: "3x8", weeks: [1,2,3,4,6] }, { name: "T-Bar Row (Chest Supp)", sets: "3x10", weeks: [1,2,3,4,6] }, { name: "Face Pulls", sets: "4x15", weeks: [1,2,3,4,5,6] } ],
  "Friday": [ { name: "DB Shoulder Press", sets: "4x10", weeks: [1,2,3,6] }, { name: "DB Lateral Raise", sets: "4x15", weeks: [1,2,3,6] }, { name: "Rear Delt Fly", sets: "4x15", weeks: [1,2,3,6] }, { name: "Arnold Press", sets: "3x10", weeks: [1,2,3,6] } ],
  "Saturday": [ { name: "RDL", sets: "4x6", weeks: [1,2,3,4,6], base: 'Deadlift', basePct: 0.55 }, { name: "Hamstring Curls", sets: "5x10", weeks: [1,2,3,4,6] }, { name: "Leg Press (High Feet)", sets: "4x12", weeks: [1,2,3,6] }, { name: "GHR", sets: "3x3", weeks: [1,2,3,4,5,6] } ]
};

/* =========================================
   3. DATA: BASE MAP LINEAR (Dynamic Logic)
   ========================================= */
const basePctMap = { "5": 0.75, "4": 0.79, "3": 0.83, "2": 0.87, "1": 0.91 };
const standardProg = 0.0425, maintProg = 0.02, tempoStartPct = 0.71, tempoProg = 0.04;
const ohpStrengthStart = 0.80, ohpStrengthProg = 0.04, ohpVolPct = 0.60;
const accPeakingReps = [10, 8, 6, 5], accSets = [5, 4, 3, 2], accRPEs = [10, 9, 8, 7];
const standardSets = [3, 2, 1, 1], maintSets = [2, 2, 2, 2, 1, 1];

const dashboardTemplate = [
    { name: "Day 1 (Mon)", lifts: [{n: "Tempo Squat", t: "Squat"}, {n: "Cluster DL", t: "Deadlift"}]},
    { name: "Day 2 (Tue)", lifts: [{n: "Paused Bench", t: "Bench"}, {n: "Larsen Press", t: "Bench"}]},
    { name: "Day 3 (Wed)", lifts: [{n: "Comp Squat", t: "Squat"}]},
    { name: "Day 4 (Thu)", lifts: [{n: "Tempo Bench", t: "Bench"}, {n: "Close Grip", t: "Bench"}]},
    { name: "Day 5 (Fri)", lifts: [{n: "Paused Bench (Sgl)", t: "Bench"}]},
    { name: "Day 6 (Sat)", lifts: [{n: "Pause Squats", t: "Squat"}, {n: "Paused DL Cluster", t: "Deadlift"}, {n: "Comp Bench", t: "Bench"}]}
];

const accessoryData = {
  squat: [ { name: "ATG System", tier: "S", notes: "Full range." }, { name: "Behind-the-Back Squat", tier: "S", notes: "Quads." }, { name: "High Bar Pause", tier: "S", notes: "Position." }, { name: "Belt Squats", tier: "S", notes: "No spine load." }, { name: "Hack Squats", tier: "A", notes: "Isolation." }, { name: "Leg Press", tier: "A", notes: "Mass." } ],
  bench: [ { name: "Larson press", tier: "S", notes: "No leg drive." }, { name: "Floor press", tier: "S", notes: "Lockout." }, { name: "Push-ups", tier: "A", notes: "Volume." }, { name: "Dips", tier: "B", notes: "Chest/Tri." } ],
  deadlift: [ { name: "Seal Rows", tier: "S", notes: "Back saver." }, { name: "Pause Deadlift", tier: "S", notes: "Technique." }, { name: "RDL", tier: "A", notes: "Hinge." }, { name: "Block Pulls", tier: "A", notes: "Overload." } ]
};

const technicalCues = { Squat: ["Root feet", "Brace 360", "Pull bar"], Bench: ["Retract scap", "Leg drive"], Deadlift: ["Slack out", "Wedge"], OHP: ["Glutes", "Head through"], Tempo: ["3-2-1", "Explode"] };

/* =========================================
   4. APP STATE
   ========================================= */
const state = {
  activeProgram: "AndreMapWave",
  maxes: { Squat: 0, Bench: 0, Deadlift: 0, OHP: 0 },
  activeWeek: 1, // Andre Week
  dashMode: "standard",
  dashReps: "3",
  dashFasted: false,
  dashMobileWeek: 0,
  unit: 'LBS',
  completed: {}, 
  accWeights: {}, 
  notes: {}, 
  ownerEmail: null,
  settings: { rackSquat: '', rackBench: '', bw: '' }
};

const inputs = {
  Squat: document.getElementById('squatInput'),
  Bench: document.getElementById('benchInput'),
  Deadlift: document.getElementById('deadliftInput'),
  OHP: document.getElementById('ohpInput')
};

/* =========================================
   5. INIT & AUTH
   ========================================= */
function init() {
  Object.keys(inputs).forEach(key => {
    inputs[key].addEventListener('input', (e) => {
      state.maxes[key] = parseFloat(e.target.value) || 0;
      deferredSave(); render();
    });
  });

  getRedirectResult(auth).then((result) => { if (result && result.user) console.log("Redirect OK"); });

  onAuthStateChanged(auth, (user) => {
      if (user) {
          state.ownerEmail = user.email;
          loadFromCloud(user.uid);
          updateAuthUI(user);
          closeModal('authModal');
      } else {
          updateAuthUI(null);
          render();
      }
  });

  setupAuthButtons();
  window.onclick = function(e) { if (e.target.classList.contains('modal')) e.target.style.display = "none"; }
  render();
}

function updateAuthUI(user) {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    if (user) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'flex';
        let name = user.displayName ? user.displayName.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'Guest');
        logoutBtn.innerHTML = `<span class="icon">👋</span> ${name}`;
    } else {
        loginBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
    }
}

function setupAuthButtons() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    document.getElementById('googleLoginBtn').addEventListener('click', () => {
        if(isMobile) signInWithRedirect(auth, provider); else signInWithPopup(auth, provider).catch(e => alert(e.message));
    });
    document.getElementById('emailLoginBtn').addEventListener('click', () => {
        const e = document.getElementById('emailInput').value, p = document.getElementById('passInput').value;
        signInWithEmailAndPassword(auth, e, p).catch(err => alert(err.message));
    });
    document.getElementById('emailSignupBtn').addEventListener('click', () => {
        const e = document.getElementById('emailInput').value, p = document.getElementById('passInput').value;
        createUserWithEmailAndPassword(auth, e, p).catch(err => alert(err.message));
    });
    document.getElementById('anonLoginBtn').addEventListener('click', () => { signInAnonymously(auth); });
    document.getElementById('logout-btn').addEventListener('click', () => { signOut(auth).then(()=>location.reload()); });
}

/* =========================================
   6. RENDER LOGIC
   ========================================= */
function render() {
    document.getElementById('unitLabel').innerText = state.unit;
    updateStats();
    
    const andreView = document.getElementById('view-andre');
    const dashView = document.getElementById('view-dashboard');
    const progSelect = document.getElementById('programSelect');
    
    progSelect.value = state.activeProgram;

    if (state.activeProgram === "AndreMapWave") {
        andreView.style.display = 'block';
        dashView.style.display = 'none';
        renderAndreOG();
    } else {
        andreView.style.display = 'none';
        dashView.style.display = 'block';
        
        // Sync Dashboard Inputs
        document.getElementById('dashMode').value = state.dashMode;
        document.getElementById('dashReps').value = state.dashReps;
        const fBtn = document.getElementById('fastedBtn');
        fBtn.innerText = state.dashFasted ? "Fasted: ON" : "Fasted: OFF";
        fBtn.classList.toggle('active', state.dashFasted);
        
        document.getElementById('mobileWeekLabel').innerText = "Week " + (state.dashMobileWeek + 1);
        renderDashboard();
    }
}

// --- RENDER ANDRE MAP WAVE ---
function renderAndreOG() {
    const cont = document.getElementById('andreContent');
    cont.innerHTML = '';
    
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        if(b.innerText.includes(`Week ${state.activeWeek}`) || (state.activeWeek===6 && b.innerText.includes('Deload'))) b.classList.add('active');
    });

    const weekData = andreData[state.activeWeek];
    if(!weekData) { cont.innerHTML = `<div style="text-align:center; padding:20px;">No data for Week ${state.activeWeek}</div>`; return; }

    Object.keys(weekData).forEach((day) => {
        const exs = weekData[day];
        const accList = andreAccessories[day];
        const showAcc = accList && (state.activeWeek < 5 || state.activeWeek === 6);
        
        const card = document.createElement('div');
        card.className = 'day-container';
        
        let head = `<div class="day-header"><span>${day}</span>`;
        const main = exs.find(e => ["Squat","Bench","Deadlift","OHP"].includes(e.type));
        if(main && state.maxes[main.type] > 0) head += `<button class="warmup-btn" onclick="openWarmup('${main.type}','${getLoad(main.pct, state.maxes[main.type])}')">Warm-up</button>`;
        head += `</div>`;

        let html = `<table>`;
        exs.forEach((m, i) => {
            const uid = `Andre-${state.activeWeek}-${day}-${i}`;
            const max = state.maxes[m.type] || 0;
            let load = (max > 0) ? getLoad(m.pct, max) + " " + state.unit : Math.round(m.pct*100) + "%";
            html += `<tr class="row-${m.type} ${state.completed[uid]?'completed':''}" onclick="toggleComplete('${uid}')">
              <td>${m.name}</td><td>${m.sets}</td><td>${m.reps}</td><td class="load-cell" onclick="event.stopPropagation();openPlateCalc('${getLoad(m.pct, max)}')">${load}</td></tr>`;
        });
        html += `</table>`;
        
        // Accessories
        if(showAcc) {
            let accHtml = `<div class="acc-section"><div class="acc-toggle" onclick="toggleAcc('${day}')"><span>Accessories</span><span>▼</span></div><div class="acc-content ${state.accOpen && state.accOpen[day]?'open':''}">`;
            accList.filter(a => a.weeks.includes(state.activeWeek)).forEach(a => {
                const accId = `acc-${day}-${a.name}`;
                accHtml += `<div class="acc-row"><div class="acc-info"><span class="acc-name">${a.name}</span></div><span class="acc-sets">${a.sets}</span><input class="acc-input" value="${state.accWeights[accId]||''}" onchange="updateAccWeight('${accId}',this.value)"></div>`;
            });
            html += accHtml + `</div></div>`;
        }
        
        // Notes
        const noteId = `note-${state.activeWeek}-${day}`;
        html += `<div class="notes-section"><textarea class="notes-input" placeholder="Notes..." onchange="updateNote('${noteId}', this.value)">${state.notes[noteId]||''}</textarea></div>`;

        card.innerHTML = head + html;
        cont.appendChild(card);
    });
}

// --- RENDER BASE MAP LINEAR ---
function renderDashboard() {
    const cont = document.getElementById('dashboardGrid');
    cont.innerHTML = '';
    
    // Toggle Randomizer Tool Visibility based on mode
    const randTool = document.getElementById('randomizerCard');
    if(state.dashMode === 'randomizer') {
        randTool.style.display = 'block';
        cont.style.display = 'none';
        document.getElementById('dashMobileNav').style.display = 'none';
        return; 
    } else {
        randTool.style.display = 'none';
        cont.style.display = 'flex'; // Use flex for column layout
        // Mobile Nav Visibility handled by CSS @media but we need to ensure JS doesn't hide it
        if(window.innerWidth < 900) document.getElementById('dashMobileNav').style.display = 'flex';
    }

    const startPct = basePctMap[state.dashReps];
    const fastedMult = state.dashFasted ? 0.935 : 1.0;
    let numWeeks = (state.dashMode === 'maintenance' ? 6 : (state.dashMode === 'deload' ? 2 : 4));

    for (let w = 0; w < numWeeks; w++) {
        let mod = (state.dashMode === 'maintenance' ? w * maintProg : (state.dashMode === 'deload' ? -((w + 1) * standardProg) : w * standardProg));
        const curPct = startPct + mod;
        const curSets = (state.dashMode === 'maintenance' ? maintSets[w] : (standardSets[w] || 1));
        
        // Mobile Logic: Only show active week
        let activeClass = (w === state.dashMobileWeek) ? 'active' : '';
        
        const weekCol = document.createElement('div');
        weekCol.className = `week-column ${activeClass}`;
        
        const weekHeader = document.createElement('div');
        weekHeader.className = 'week-label';
        weekHeader.innerText = `WEEK ${w + 1} (${Math.round(curPct * 100 * fastedMult)}%)`;
        weekCol.appendChild(weekHeader);

        dashboardTemplate.forEach((day, dIdx) => {
            let activeLifts = [...day.lifts];
            
            if (state.dashMode === 'standard_acc') {
                const aReps = accPeakingReps[Math.min(w,3)];
                const aSets = accSets[Math.min(w,3)];
                if(dIdx===0) activeLifts.push({n:"OHP (Vol)", s:5, r:10, p:ohpVolPct, t:"OHP", isOHP:true});
                if(dIdx===1) activeLifts.push({n:"Close Grip", s:aSets, r:aReps, t:"Bench", isAcc:true}, {n:"Dips", s:aSets, r:aReps, t:"Bench", isAcc:true});
                if(dIdx===2) activeLifts.push({n:"Hack Squat", s:aSets, r:aReps, t:"Squat", isAcc:true}, {n:"Leg Press", s:aSets, r:aReps, t:"Squat", isAcc:true});
                if(dIdx===3) activeLifts.push({n:"Seal Rows", s:aSets, r:aReps, t:"Deadlift", isAcc:true}, {n:"Pullups", s:aSets, r:aReps, t:"Deadlift", isAcc:true});
                if(dIdx===4) activeLifts = [{n:"OHP (Str)", s:curSets, r:3, p:ohpStrengthStart+(w*ohpStrengthProg), t:"OHP", isOHP:true}];
                if(dIdx===5) activeLifts.push({n:"RDL", s:aSets, r:aReps, t:"Deadlift", isAcc:true});
            }

            const card = document.createElement('div');
            card.className = 'day-container';
            let html = `<div class="day-header"><span>${day.name}</span></div><table>`;
            
            activeLifts.forEach((lift, i) => {
                const uid = `Dash-${state.dashMode}-${w}-${day.name}-${i}`;
                let max = state.maxes[lift.t] || 0;
                if(lift.isOHP) max = state.maxes.OHP || 0;
                
                let pct = lift.p || curPct;
                let reps = state.dashReps;
                let sets = curSets;
                
                if(lift.n.includes("Tempo")) { pct = tempoStartPct + (w*tempoProg); reps = 5; }
                if(lift.n.includes("Cluster")) { reps = 1; sets = 6; }
                if(lift.n === "Pause Squats") { pct = 0.70+mod; reps = 4; }
                if(lift.isAcc) { sets = accSets[Math.min(w,3)]; reps = lift.r; }

                let load = "-";
                if(lift.isAcc) {
                    load = "RPE " + accRPEs[Math.min(w,3)];
                } else if (max > 0) {
                    load = getLoad(pct * fastedMult, max) + " " + state.unit;
                } else {
                    load = Math.round(pct*100*fastedMult) + "%";
                }
                
                html += `<tr class="row-${lift.t} ${state.completed[uid]?'completed':''}" onclick="toggleComplete('${uid}')">
                  <td>${lift.n}</td><td>${sets}x${reps}</td><td class="load-cell">${load}</td></tr>`;
            });
            html += `</table>`;
            card.innerHTML = html;
            weekCol.appendChild(card);
        });
        cont.appendChild(weekCol);
    }
}

/* =========================================
   7. UTILS & HELPERS
   ========================================= */
window.switchProgram = (prog) => { state.activeProgram = prog; deferredSave(); render(); }
window.setWeek = (n) => { state.activeWeek = n; deferredSave(); render(); }
window.toggleUnit = () => { state.unit = state.unit === 'LBS' ? 'KG' : 'LBS'; deferredSave(); render(); }
window.toggleComplete = (id) => { state.completed[id] = !state.completed[id]; deferredSave(); render(); }
window.toggleAcc = (day) => { state.accOpen = state.accOpen || {}; state.accOpen[day] = !state.accOpen[day]; render(); }
window.updateAccWeight = (id, val) => { state.accWeights[id] = val; deferredSave(); }
window.updateNote = (id, val) => { state.notes[id] = val; deferredSave(); }
window.updateDashSettings = () => {
    state.dashMode = document.getElementById('dashMode').value;
    state.dashReps = document.getElementById('dashReps').value;
    state.dashMobileWeek = 0; // Reset mobile view when mode changes
    deferredSave(); render();
}
window.changeMobileWeek = (dir) => {
    let numWeeks = (state.dashMode === 'maintenance' ? 6 : (state.dashMode === 'deload' ? 2 : 4));
    state.dashMobileWeek = Math.max(0, Math.min(numWeeks - 1, state.dashMobileWeek + dir));
    render();
}
window.toggleFasted = () => { state.dashFasted = !state.dashFasted; deferredSave(); render(); }

window.runRandomizer = () => {
    const goal = document.getElementById('randGoal').value;
    const w = parseFloat(document.getElementById('prevWeight').value);
    const r = parseFloat(document.getElementById('prevReps').value);
    if(!w || !r) return;
    let outW, outR, msg;
    if(goal==='strength') { outW = Math.round((w*1.04)/5)*5; outR = Math.max(1,r-1); msg="Peak Load"; }
    else if(goal==='recovery') { outW = Math.round((w*0.93)/5)*5; outR = r+2; msg="Volume"; }
    else { outW = Math.round((w*1.02)/5)*5; outR = r+1; msg="Hypertrophy"; }
    
    const div = document.getElementById('randomizerResult');
    div.style.display = 'block';
    document.getElementById('randOutputText').innerHTML = `Target: <strong>${outW} ${state.unit} x ${outR}</strong><br><small>${msg}</small>`;
}

// Math
function getLoad(pct, max) { let val = max * pct; return state.unit==='KG' ? Math.round(val/2.5)*2.5 : Math.round(val/5)*5; }
function updateStats() {
    const total = (state.maxes.Squat||0) + (state.maxes.Bench||0) + (state.maxes.Deadlift||0);
    document.getElementById('currentTotal').innerText = total;
}
function calculateDots(total, bw, unit) {
    if(!bw || !total) return '-';
    let w = parseFloat(bw); let t = parseFloat(total);
    if (unit === 'LBS') { w /= 2.20462; t /= 2.20462; }
    const denominator = -0.000001093 * Math.pow(w, 4) + 0.0007391293 * Math.pow(w, 3) - 0.1918751679 * Math.pow(w, 2) + 24.0900756 * w - 307.75076;
    return (t * (500 / denominator)).toFixed(2);
}

// Tools
window.calculateOneRM = () => {
    const w = parseFloat(document.getElementById('calcWeight').value);
    const r = parseFloat(document.getElementById('calcReps').value);
    if(w && r) {
        document.getElementById('oneRmResults').style.display = 'block';
        const epley = Math.round(w * (1 + 0.0333 * r));
        document.getElementById('formulaBody').innerHTML = `<tr><td>Est 1RM</td><td>${epley} ${state.unit}</td></tr>`;
    }
}
window.calculateDotsOnly = () => {
    const t = document.getElementById('dotsTotalInput').value;
    const b = document.getElementById('bodyWeightInput').value;
    if(t && b) {
        document.getElementById('dotsResults').style.display = 'block';
        document.getElementById('dotsDisplay').innerText = calculateDots(t, b, state.unit);
    }
}
window.updateAccOptions = () => {
    const cat = document.getElementById('accCategory').value;
    document.getElementById('accExercise').innerHTML = accessoryData[cat].map(ex => `<option value="${ex.name}">${ex.name}</option>`).join('');
    window.displayAccDetails();
}
window.displayAccDetails = () => {
    const cat = document.getElementById('accCategory').value;
    const name = document.getElementById('accExercise').value;
    const d = accessoryData[cat].find(e => e.name === name);
    if(d) {
        document.getElementById('accDetails').style.display = 'block';
        document.getElementById('accName').innerText = d.name;
        document.getElementById('accNotes').innerText = d.notes;
        document.getElementById('accTier').innerText = d.tier + " TIER";
    }
}

// Modals
window.openTools = () => document.getElementById('toolsModal').style.display = 'flex';
window.openAuthModal = () => document.getElementById('authModal').style.display = 'flex';
window.openMeetPlanner = () => document.getElementById('meetModal').style.display = 'flex';
window.openPlateCalc = (w) => {
    document.getElementById('plateModal').style.display = 'flex';
    document.getElementById('plateTarget').innerText = w + " " + state.unit;
    // Plate logic would go here, simplified for brevity
}
window.openWarmup = (t,w) => {
    document.getElementById('warmupModal').style.display = 'flex';
    // Warmup logic
}
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
window.saveSettings = () => {
    state.settings.bw = document.getElementById('bodyweight').value;
    deferredSave(); render();
}
window.copyData = () => {
    document.getElementById('exportArea').value = JSON.stringify(state);
    alert("Copied!");
}

// Saving
let saveTimeout;
function deferredSave() { clearTimeout(saveTimeout); saveTimeout = setTimeout(saveToCloud, 1500); }
async function saveToCloud() {
    const user = auth.currentUser; if(!user) return;
    try { await setDoc(doc(db, "users", user.uid), state, { merge: true }); } catch(e) { console.error(e); }
}
async function loadFromCloud(uid) {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if(snap.exists()) {
            const d = snap.data();
            if(d.maxes) state.maxes = d.maxes;
            if(d.activeProgram) state.activeProgram = d.activeProgram;
            if(d.activeWeek) state.activeWeek = d.activeWeek;
            if(d.dashMode) state.dashMode = d.dashMode;
            if(d.dashReps) state.dashReps = d.dashReps;
            if(d.dashFasted) state.dashFasted = d.dashFasted;
            if(d.completed) state.completed = d.completed;
            if(d.accWeights) state.accWeights = d.accWeights;
            if(d.notes) state.notes = d.notes;
            
            Object.keys(inputs).forEach(k => { if(inputs[k]) inputs[k].value = state.maxes[k]; });
            render();
        }
    } catch(e) { console.error(e); }
}

init();

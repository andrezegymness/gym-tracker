import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyB_1QW2BtfK5eZzakW858fg2UlAS5tZY7M", authDomain: "powerlifting-programs.firebaseapp.com", projectId: "powerlifting-programs", storageBucket: "powerlifting-programs.firebasestorage.app", messagingSenderId: "961044250962", appId: "1:961044250962:web:c45644c186e9bb6ee67a8b", measurementId: "G-501TXRLMSQ" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// YOUR DATA
const andreData = {
  1: { "Monday": [ { name: "Pause Squat", sets: 2, reps: 2, pct: 0.701, type: "Squat" }, { name: "Pause Squat", sets: 1, reps: 3, pct: 0.721, type: "Squat" }, { name: "Pause Squat", sets: 2, reps: 2, pct: 0.74, type: "Squat" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" }, { name: "OHP", sets: 4, reps: 2, pct: 0.804, type: "OHP" } ], "Tuesday": [ { name: "Bench", sets: 1, reps: 3, pct: 0.733, type: "Bench" }, { name: "Bench", sets: 4, reps: 3, pct: 0.844, type: "Bench" }, { name: "Floor Press", sets: 5, reps: 5, pct: 0.756, type: "Bench" } ], "Wednesday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.727, type: "Squat" }, { name: "Squat", sets: 2, reps: 3, pct: 0.799, type: "Squat" }, { name: "Squat", sets: 1, reps: 3, pct: 0.838, type: "Squat" }, { name: "OHP", sets: 4, reps: 3, pct: 0.804, type: "OHP" } ], "Thursday": [ { name: "Bench", sets: 2, reps: 2, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 1, reps: 3, pct: 0.844, type: "Bench" }, { name: "Bench", sets: 2, reps: 2, pct: 0.8, type: "Bench" }, { name: "AMRAP Bench", sets: 1, reps: "AMRAP", pct: 0.8, type: "Bench" } ], "Friday": [ { name: "Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 2, reps: 2, pct: 0.799, type: "Squat" }, { name: "Squat (Heavy)", sets: 1, reps: 1, pct: 0.903, type: "Squat" }, { name: "OHP", sets: 4, reps: 2, pct: 0.804, type: "OHP" } ], "Saturday": [ { name: "Bench (Heavy)", sets: 2, reps: 1, pct: 0.933, type: "Bench" }, { name: "Bench", sets: 3, reps: 4, pct: 0.756, type: "Bench" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" } ] },
  2: { "Monday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 1, reps: 5, pct: 0.773, type: "Squat" }, { name: "Squat", sets: 1, reps: 4, pct: 0.831, type: "Squat" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.811, type: "Deadlift" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.866, type: "Deadlift" } ], "Tuesday": [ { name: "Bench", sets: 1, reps: 5, pct: 0.767, type: "Bench" }, { name: "Bench", sets: 3, reps: 4, pct: 0.811, type: "Bench" }, { name: "Floor Press", sets: 5, reps: 5, pct: 0.778, type: "Bench" } ], "Wednesday": [ { name: "Pause Squat", sets: 2, reps: 2, pct: 0.708, type: "Squat" }, { name: "Pause Squat", sets: 1, reps: 2, pct: 0.734, type: "Squat" }, { name: "Pause Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" } ], "Thursday": [ { name: "Bench", sets: 1, reps: 3, pct: 0.856, type: "Bench" }, { name: "Bench", sets: 2, reps: 2, pct: 0.8, type: "Bench" }, { name: "AMRAP Bench", sets: 1, reps: "AMRAP", pct: 0.8, type: "Bench" } ], "Friday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 1, reps: 5, pct: 0.825, type: "Squat" }, { name: "Squat", sets: 2, reps: 5, pct: 0.799, type: "Squat" } ], "Saturday": [ { name: "Bench", sets: 4, reps: 5, pct: 0.822, type: "Bench" }, { name: "Deadlift", sets: 2, reps: 2, pct: 0.799, type: "Deadlift" }, { name: "Deadlift", sets: 1, reps: 2, pct: 0.86, type: "Deadlift" } ] },
  3: { "Monday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 2, reps: 2, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 1, reps: 2, pct: 0.779, type: "Squat" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.89, type: "Deadlift" }, { name: "OHP", sets: 4, reps: 2, pct: 0.826, type: "OHP" } ], "Tuesday": [ { name: "Bench", sets: 2, reps: 7, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 2, reps: 6, pct: 0.8, type: "Bench" }, { name: "Floor Press", sets: 5, reps: 5, pct: 0.789, type: "Bench" } ], "Wednesday": [ { name: "Squat", sets: 1, reps: 7, pct: 0.76, type: "Squat" }, { name: "Squat", sets: 2, reps: 6, pct: 0.799, type: "Squat" }, { name: "OHP", sets: 4, reps: 6, pct: 0.783, type: "OHP" } ], "Thursday": [ { name: "Bench", sets: 4, reps: 5, pct: 0.7, type: "Bench" } ], "Friday": [ { name: "Pause Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" }, { name: "Pause Squat", sets: 3, reps: 2, pct: 0.727, type: "Squat" }, { name: "OHP", sets: 4, reps: 2, pct: 0.783, type: "OHP" } ], "Saturday": [ { name: "Bench (Heavy)", sets: 2, reps: 1, pct: 0.933, type: "Bench" }, { name: "Deadlift", sets: 2, reps: 2, pct: 0.841, type: "Deadlift" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.738, type: "Deadlift" } ] },
  4: { "Monday": [ { name: "Squat", sets: 1, reps: 4, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 1, reps: 4, pct: 0.773, type: "Squat" }, { name: "Squat (Heavy)", sets: 1, reps: 4, pct: 0.903, type: "Squat" }, { name: "Squat (Backoff)", sets: 1, reps: 4, pct: 0.87, type: "Squat" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.738, type: "Deadlift" } ], "Wednesday": [ { name: "Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 2, reps: 2, pct: 0.792, type: "Squat" }, { name: "Bench", sets: 1, reps: 4, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 1, reps: 4, pct: 0.8, type: "Bench" }, { name: "Bench", sets: 1, reps: 4, pct: 0.867, type: "Bench" } ], "Friday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.903, type: "Squat" }, { name: "Squat", sets: 1, reps: 3, pct: 0.942, type: "Squat" } ], "Saturday": [ { name: "Bench", sets: 2, reps: 2, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 1, reps: 3, pct: 0.8, type: "Bench" }, { name: "Bench (Peak)", sets: 1, reps: 1, pct: 0.989, type: "Bench" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift (Heavy)", sets: 1, reps: 1, pct: 0.89, type: "Deadlift" } ] },
  5: { "Monday": [ { name: "Squat", sets: 2, reps: 2, pct: 0.727, type: "Squat" }, { name: "Squat", sets: 2, reps: 2, pct: 0.76, type: "Squat" }, { name: "Bench", sets: 1, reps: 2, pct: 0.6, type: "Bench" }, { name: "Bench", sets: 2, reps: 2, pct: 0.7, type: "Bench" }, { name: "Bench", sets: 2, reps: 2, pct: 0.744, type: "Bench" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift (Heavy)", sets: 1, reps: 3, pct: 0.909, type: "Deadlift" } ], "Wednesday": [ { name: "Squat (Peak)", sets: 1, reps: 2, pct: 0.929, type: "Squat" }, { name: "Squat (Max Effort)", sets: 1, reps: 2, pct: 0.961, type: "Squat" }, { name: "Bench", sets: 1, reps: 3, pct: 0.889, type: "Bench" } ], "Friday": [ { name: "Squat", sets: 2, reps: 2, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 4, reps: 2, pct: 0.799, type: "Squat" } ], "Saturday": [ { name: "Bench", sets: 2, reps: 2, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 4, reps: 2, pct: 0.8, type: "Bench" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" } ] }
};
andreData[6] = {}; Object.keys(andreData[1]).forEach(d => { andreData[6][d] = andreData[1][d].filter(e => !(e.sets === 5 && e.reps === 5)).map(e => ({ ...e, name: `Tempo ${e.type}`, pct: e.pct * 0.95 })); });

const andreAccessories = {
  "Tuesday": [ { name: "Close Grip Bench", sets: "3x4", weeks: [1,2,3,4,6], base: 'Bench', basePct: 0.72 }, { name: "Larsen Press", sets: "3x4", weeks: [1,2,3,4,6], base: 'Bench', basePct: 0.68 }, { name: "Tricep Pushdowns", sets: "3x12", weeks: [1,2,3,6] } ],
  "Wednesday": [ { name: "Leg Extensions", sets: "3x15", weeks: [1,2,3,4,6] }, { name: "Pendulum Squat", sets: "3x8", weeks: [1,2,3,4,6] }, { name: "Walking Lunges", sets: "3x12", weeks: [1,2,3,6] }, { name: "Leg Press", sets: "4x10", weeks: [1,2,3,4,6] }, { name: "GHR", sets: "3x8", weeks: [1,2,3,4,6] } ],
  "Thursday": [ { name: "Pendlay Rows", sets: "4x6", weeks: [1,2,3,4,6] }, { name: "Weighted Pull-ups", sets: "3x8", weeks: [1,2,3,4,6] }, { name: "T-Bar Row (Chest Supp)", sets: "3x10", weeks: [1,2,3,4,6] }, { name: "Face Pulls", sets: "4x15", weeks: [1,2,3,4,5,6] } ],
  "Friday": [ { name: "DB Shoulder Press", sets: "4x10", weeks: [1,2,3,6] }, { name: "DB Lateral Raise", sets: "4x15", weeks: [1,2,3,6] }, { name: "Rear Delt Fly", sets: "4x15", weeks: [1,2,3,6] }, { name: "Arnold Press", sets: "3x10", weeks: [1,2,3,6] } ],
  "Saturday": [ { name: "RDL", sets: "4x6", weeks: [1,2,3,4,6], base: 'Deadlift', basePct: 0.55 }, { name: "Hamstring Curls", sets: "5x10", weeks: [1,2,3,4,6] }, { name: "Leg Press (High Feet)", sets: "4x12", weeks: [1,2,3,6] }, { name: "GHR", sets: "3x3", weeks: [1,2,3,4,5,6] } ]
};

const state = { maxes: { Squat:0, Bench:0, Deadlift:0, OHP:0 }, activeWeek: 1, unit: 'LBS', completed: {}, accWeights: {}, notes: {}, settings: { bw: '' } };
const inputs = { Squat: document.getElementById('squatInput'), Bench: document.getElementById('benchInput'), Deadlift: document.getElementById('deadliftInput'), OHP: document.getElementById('ohpInput') };

function init() {
    Object.keys(inputs).forEach(k => {
        inputs[k].addEventListener('input', (e) => {
            state.maxes[k] = parseFloat(e.target.value) || 0;
            saveToCloud(); render();
        });
    });
    getRedirectResult(auth).then(() => {});
    onAuthStateChanged(auth, user => {
        if(user) { 
            loadFromCloud(user.uid); 
            document.getElementById('login-btn').style.display='none'; 
            document.getElementById('logout-btn').style.display='inline-block'; 
        }
    });
    document.getElementById('googleLoginBtn').addEventListener('click', () => { if(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) signInWithRedirect(auth, provider); else signInWithPopup(auth, provider); });
    document.getElementById('emailLoginBtn').addEventListener('click', () => { signInWithEmailAndPassword(auth, document.getElementById('emailInput').value, document.getElementById('passInput').value); });
    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth).then(()=>location.reload()));
    
    window.setWeek = (n) => { state.activeWeek = n; saveToCloud(); render(); };
    window.toggleComplete = (id) => { state.completed[id] = !state.completed[id]; saveToCloud(); render(); };
    window.toggleAcc = (day) => { state.accOpen = state.accOpen || {}; state.accOpen[day] = !state.accOpen[day]; render(); };
    window.updateAccWeight = (id, val) => { state.accWeights[id] = val; saveToCloud(); };
    window.updateNote = (id, val) => { state.notes[id] = val; saveToCloud(); };
    window.saveSettings = () => { state.settings.bw = document.getElementById('bodyweight').value; saveToCloud(); render(); };
    
    window.openTools = () => { document.getElementById('toolsModal').style.display='flex'; if(state.settings.bw) document.getElementById('bodyweight').value = state.settings.bw; };
    window.openAuthModal = () => document.getElementById('authModal').style.display='flex';
    window.closeModal = (id) => document.getElementById(id).style.display='none';
    window.onclick = e => { if(e.target.classList.contains('modal')) e.target.style.display='none'; };
    
    // CALCULATORS
    window.calculateOneRM = () => { const w=parseFloat(document.getElementById('calcWeight').value), r=parseFloat(document.getElementById('calcReps').value); if(w&&r) { document.getElementById('oneRmResults').style.display='block'; document.getElementById('formulaBody').innerHTML=`<tr><td>Est 1RM</td><td>${Math.round(w*(1+0.0333*r))}</td></tr>`; } };
    window.calculateDotsOnly = () => { const t=document.getElementById('dotsTotalInput').value, b=document.getElementById('bodyWeightInput').value; if(t&&b) { document.getElementById('dotsResults').style.display='block'; document.getElementById('dotsDisplay').innerText=calculateDots(t,b); } };
    window.openMeetPlanner = () => { const m = document.getElementById('meetModal'); const g = document.getElementById('meetGrid'); m.style.display='flex'; let h=''; ['Squat','Bench','Deadlift'].forEach(x=>{ const mx=state.maxes[x]||0; h+=`<div class="meet-col"><h4>${x}</h4><div class="attempt-row"><span>Opener</span><span>${getLoad(0.91,mx)}</span></div><div class="attempt-row"><span>2nd</span><span>${getLoad(0.96,mx)}</span></div><div class="attempt-row"><span>3rd</span><span>${getLoad(1.02,mx)}</span></div></div>`; }); g.innerHTML=h; };
    window.openPlateCalc = (w) => {
        if(String(w).includes('%')) return; document.getElementById('plateModal').style.display = 'flex';
        const wt = parseFloat(w); document.getElementById('plateTarget').innerText = wt + " " + state.unit;
        document.getElementById('plateVisuals').innerHTML = getPlates(wt); document.getElementById('plateText').innerText = "Load per side";
    };

    render();
}

async function saveToCloud() {
    const user = auth.currentUser; if(!user) return;
    try { await setDoc(doc(db, "users", user.uid), state, { merge: true }); 
    const t = document.querySelector('.brand'); if(t) { t.style.color='#4caf50'; setTimeout(()=>t.style.color='', 500); } } catch(e) {}
}

async function loadFromCloud(uid) {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if(snap.exists()) {
            const d = snap.data();
            // 1. FILL STATE
            if(d.maxes) {
                state.maxes.Squat = d.maxes.Squat || d.maxes.squat || 0;
                state.maxes.Bench = d.maxes.Bench || d.maxes.bench || 0;
                state.maxes.Deadlift = d.maxes.Deadlift || d.maxes.deadlift || 0;
                state.maxes.OHP = d.maxes.OHP || d.maxes.ohp || 0;
            }
            if(d.activeWeek) state.activeWeek = d.activeWeek;
            if(d.unit) state.unit = d.unit;
            if(d.completed) state.completed = d.completed;
            if(d.accWeights) state.accWeights = d.accWeights;
            if(d.notes) state.notes = d.notes;
            if(d.settings) state.settings = d.settings;

            // 2. FORCE VISUAL UPDATE TO INPUTS (THE FIX)
            if(inputs.Squat) inputs.Squat.value = state.maxes.Squat || '';
            if(inputs.Bench) inputs.Bench.value = state.maxes.Bench || '';
            if(inputs.Deadlift) inputs.Deadlift.value = state.maxes.Deadlift || '';
            if(inputs.OHP) inputs.OHP.value = state.maxes.OHP || '';
            if(state.settings.bw && document.getElementById('bodyweight')) document.getElementById('bodyweight').value = state.settings.bw;

            render();
        }
    } catch(e) { console.log(e); }
}

function getLoad(pct, max) { let val = max * pct; return state.unit==='KG' ? Math.round(val/2.5)*2.5 : Math.round(val/5)*5; }
function calculateDots(total, bw) { if(!bw || !total) return '-'; let w=parseFloat(bw); let t=parseFloat(total); if(state.unit==='LBS'){ w/=2.20462; t/=2.20462; } const den = -0.000001093*Math.pow(w,4) + 0.0007391293*Math.pow(w,3) - 0.1918751679*Math.pow(w,2) + 24.0900756*w - 307.75076; return (t*(500/den)).toFixed(2); }
function getPlates(weight) { let target = parseFloat(weight); if(isNaN(target)) return ""; let bar = 45; let side = (target - bar) / 2; if(side <= 0) return ""; const platesLbs = [45, 35, 25, 10, 5, 2.5]; let html = ""; platesLbs.forEach(p => { while(side >= p) { side -= p; let c = `p${String(p).replace('.','_')}-lbs`; html += `<span class="plate ${c}">${p}</span>`; } }); return html; }

function render() {
    const total = (state.maxes.Squat||0) + (state.maxes.Bench||0) + (state.maxes.Deadlift||0);
    document.getElementById('currentTotal').innerText = total;
    if(document.getElementById('unitLabel')) document.getElementById('unitLabel').innerText = state.unit;
    document.getElementById('currentDots').innerText = calculateDots(total, state.settings.bw);

    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        if(b.innerText.includes(`Week ${state.activeWeek}`) || (state.activeWeek===6 && b.innerText.includes('Deload'))) b.classList.add('active');
    });

    const cont = document.getElementById('programContent');
    cont.innerHTML = '';
    const weekData = andreData[state.activeWeek];
    if(!weekData) return;

    Object.keys(weekData).forEach(day => {
        const exs = weekData[day];
        const accList = andreAccessories[day];
        const showAcc = accList && (state.activeWeek < 5 || state.activeWeek === 6);
        
        const card = document.createElement('div'); card.className = 'day-container';
        let head = `<div class="day-header"><span>${day}</span></div>`;
        let html = `<table>`;
        
        exs.forEach((m, i) => {
            const uid = `Andre-${state.activeWeek}-${day}-${i}`;
            const max = state.maxes[m.type] || 0;
            let load = (max > 0) ? Math.round((max * m.pct)/5)*5 + " " + state.unit : Math.round(m.pct*100) + "%";
            html += `<tr class="row-${m.type} ${state.completed[uid]?'completed':''}" onclick="toggleComplete('${uid}')"><td>${m.name}</td><td>${m.sets}</td><td>${m.reps}</td><td class="load-cell" onclick="event.stopPropagation();openPlateCalc('${getLoad(m.pct, max)}')">${load}</td></tr>`;
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
                    recHtml = `<span class="acc-rec">Rec: ${load} ${state.unit}</span>`;
                }
                accHtml += `<div class="acc-row"><div class="acc-info"><span class="acc-name">${a.name}</span>${recHtml}</div><span class="acc-sets">${a.sets}</span><input class="acc-input" value="${state.accWeights[accId]||''}" onchange="updateAccWeight('${accId}',this.value)"></div>`;
            });
            html += accHtml + `</div></div>`;
        }
        card.innerHTML = head + html;
        cont.appendChild(card);
    });
}

init();

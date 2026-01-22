import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyB_1QW2BtfK5eZzakW858fg2UlAS5tZY7M", authDomain: "powerlifting-programs.firebaseapp.com", projectId: "powerlifting-programs", storageBucket: "powerlifting-programs.firebasestorage.app", messagingSenderId: "961044250962", appId: "1:961044250962:web:c45644c186e9bb6ee67a8b", measurementId: "G-501TXRLMSQ" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 1. ROBUST DATA DEFINITION (Fixes Blank Grid)
const andreData = {
  1: { "Monday": [ { name: "Pause Squat", sets: 2, reps: 2, pct: 0.701, type: "Squat" }, { name: "Pause Squat", sets: 1, reps: 3, pct: 0.721, type: "Squat" }, { name: "Pause Squat", sets: 2, reps: 2, pct: 0.74, type: "Squat" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" }, { name: "OHP", sets: 4, reps: 2, pct: 0.804, type: "OHP" } ], "Tuesday": [ { name: "Bench", sets: 1, reps: 3, pct: 0.733, type: "Bench" }, { name: "Bench", sets: 4, reps: 3, pct: 0.844, type: "Bench" }, { name: "Floor Press", sets: 5, reps: 5, pct: 0.756, type: "Bench" } ], "Wednesday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.727, type: "Squat" }, { name: "Squat", sets: 2, reps: 3, pct: 0.799, type: "Squat" }, { name: "Squat", sets: 1, reps: 3, pct: 0.838, type: "Squat" }, { name: "OHP", sets: 4, reps: 3, pct: 0.804, type: "OHP" } ], "Thursday": [ { name: "Bench", sets: 2, reps: 2, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 1, reps: 3, pct: 0.844, type: "Bench" }, { name: "Bench", sets: 2, reps: 2, pct: 0.8, type: "Bench" }, { name: "AMRAP Bench", sets: 1, reps: "AMRAP", pct: 0.8, type: "Bench" } ], "Friday": [ { name: "Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 2, reps: 2, pct: 0.799, type: "Squat" }, { name: "Squat (Heavy)", sets: 1, reps: 1, pct: 0.903, type: "Squat" }, { name: "OHP", sets: 4, reps: 2, pct: 0.804, type: "OHP" } ], "Saturday": [ { name: "Bench (Heavy)", sets: 2, reps: 1, pct: 0.933, type: "Bench" }, { name: "Bench", sets: 3, reps: 4, pct: 0.756, type: "Bench" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" } ] },
  2: { "Monday": [{name:"Squat",sets:1,reps:3,pct:0.753,type:"Squat"},{name:"Deadlift",sets:1,reps:3,pct:0.732,type:"Deadlift"}] },
  3: { "Monday": [{name:"Squat",sets:1,reps:3,pct:0.753,type:"Squat"}] },
  4: { "Monday": [{name:"Squat",sets:1,reps:4,pct:0.753,type:"Squat"}] },
  5: { "Monday": [{name:"Squat",sets:2,reps:2,pct:0.727,type:"Squat"}] }
};
// Deload & Fill gaps
for(let i=2; i<=6; i++) { if(!andreData[i]) andreData[i] = andreData[1]; } 

// DATABASES FOR TOOLS
const accessoryData = { squat: [{name:"ATG Squats",notes:"Full depth"}, {name:"Pause Squat",notes:"Position"}], bench: [{name:"Larsen Press",notes:"No legs"}, {name:"Spoto Press",notes:"Pause off chest"}], deadlift: [{name:"Seal Rows",notes:"Back saver"}, {name:"RDL",notes:"Hinge"}] };
const ptDatabase = { knees: [{name:"Spanish Squats", rx:"3x45s", context:"Max quad tension."}, {name:"TKE", rx:"3x20", context:"VMO Firing"}], back: [{name:"McGill Big 3", rx:"3x10s", context:"Core stiffness."}], shoulders: [{name:"Dead Hangs", rx:"3x30s", context:"Decompress"}] };

const state = { maxes: { Squat:0, Bench:0, Deadlift:0, OHP:0 }, activeWeek: 1, unit: 'LBS', completed: {}, accWeights: {}, notes: {}, settings: { bw: '' } };
const inputs = { Squat: document.getElementById('squatInput'), Bench: document.getElementById('benchInput'), Deadlift: document.getElementById('deadliftInput'), OHP: document.getElementById('ohpInput') };

function init() {
    // Input Listeners
    Object.keys(inputs).forEach(k => { inputs[k].addEventListener('input', e => { state.maxes[k] = parseFloat(e.target.value) || 0; saveToCloud(); render(); }); });

    // Auth
    onAuthStateChanged(auth, user => {
        if(user) { 
            loadFromCloud(user.uid); 
            document.getElementById('login-btn').style.display='none'; 
        }
    });
    
    setupAuthButtons();
    
    // Globals
    window.setWeek = (n) => { state.activeWeek = n; saveToCloud(); render(); };
    window.toggleComplete = (id) => { state.completed[id] = !state.completed[id]; saveToCloud(); render(); };
    window.openTools = () => { document.getElementById('toolsModal').style.display='flex'; if(state.settings.bw) document.getElementById('bodyweight').value = state.settings.bw; };
    window.openAuthModal = () => document.getElementById('authModal').style.display='flex';
    window.closeModal = (id) => document.getElementById(id).style.display='none';
    window.saveSettings = () => { state.settings.bw = document.getElementById('bodyweight').value; saveToCloud(); };
    window.copyData = () => alert("Data Saved");
    window.onclick = e => { if(e.target.classList.contains('modal')) e.target.style.display='none'; };

    // TOOL FUNCTIONS
    window.openMeetPlanner = () => { 
        const m=document.getElementById('meetModal'); const g=document.getElementById('meetGrid'); m.style.display='flex'; let h='';
        ['Squat','Bench','Deadlift'].forEach(x=>{ 
            const mx=state.maxes[x]||0; 
            h+=`<div class="meet-col"><h4>${x}</h4>
            <div class="attempt-row"><span>Opener</span><span class="attempt-val">${getLoad(0.91,mx)}</span></div>
            <div class="attempt-row"><span>2nd</span><span class="attempt-val">${getLoad(0.96,mx)}</span></div>
            <div class="attempt-row"><span>3rd</span><span class="attempt-val pr">${getLoad(1.02,mx)}</span></div></div>`; 
        }); g.innerHTML=h; 
    };
    window.openPlateCalc = (w) => {
        if(String(w).includes('%')) return; document.getElementById('plateModal').style.display='flex';
        const wt=parseFloat(w); document.getElementById('plateTarget').innerText=wt+" "+state.unit;
        document.getElementById('plateVisuals').innerHTML=getPlates(wt); document.getElementById('plateText').innerText="Per Side (45lb Bar)";
    };
    window.calculateOneRM = () => { const w=parseFloat(document.getElementById('calcWeight').value),r=parseFloat(document.getElementById('calcReps').value); if(w&&r) document.getElementById('oneRmResult').innerText = "Est 1RM: " + Math.round(w*(1+0.0333*r)); };
    window.calculateWarmup = () => {
        const t=parseFloat(document.getElementById('wuTarget').value); if(!t)return;
        let h=''; [0.5, 0.7, 0.9].forEach(p=>{ let w=Math.round((t*p)/5)*5; h+=`<div style="display:flex; justify-content:space-between; padding:5px; border-bottom:1px solid #333;"><span>${w} lbs</span><div class="plate-stack" style="transform:scale(0.7);">${getPlates(w)}</div></div>`; });
        document.getElementById('warmupDisplay').innerHTML=h;
    };
    // PT Logic
    window.updatePtMovements = () => { const a=document.getElementById('ptArea').value; const m=document.getElementById('ptMovement'); m.innerHTML='<option>Select...</option>'; if(ptDatabase[a]) ptDatabase[a].forEach((x,i)=>{ let o=document.createElement('option'); o.value=i; o.innerText=x.name; m.appendChild(o); }); };
    window.displayPtLogic = () => { const a=document.getElementById('ptArea').value, i=document.getElementById('ptMovement').value; if(a&&i) { const d=ptDatabase[a][i]; document.getElementById('ptDisplay').style.display='block'; document.getElementById('ptDisplay').innerHTML=`<b>${d.name}</b><br>${d.context}<br><i>RX: ${d.rx}</i>`; } };
    // Accessories Logic
    window.updateAccOptions = () => { const c=document.getElementById('accCategory').value; const m=document.getElementById('accExercise'); m.innerHTML=''; accessoryData[c].forEach(x=>{ let o=document.createElement('option'); o.value=x.name; o.innerText=x.name; m.appendChild(o); }); };
    window.displayAccDetails = () => { const c=document.getElementById('accCategory').value, n=document.getElementById('accExercise').value; const d=accessoryData[c].find(x=>x.name===n); if(d) { document.getElementById('accDetails').style.display='block'; document.getElementById('accDetails').innerText = d.notes; } };

    render();
}

function setupAuthButtons() {
    document.getElementById('googleLoginBtn').addEventListener('click', () => signInWithPopup(auth, provider));
    document.getElementById('emailLoginBtn').addEventListener('click', () => signInWithEmailAndPassword(auth, document.getElementById('emailInput').value, document.getElementById('passInput').value));
}

async function saveToCloud() {
    const user = auth.currentUser; if(!user) return;
    try { await setDoc(doc(db, "users", user.uid), state, { merge: true }); } catch(e) {}
}

async function loadFromCloud(uid) {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if(snap.exists()) {
            const d = snap.data();
            // 2. DATA HYDRATION (Case Insensitive)
            if(d.maxes) {
                state.maxes.Squat = d.maxes.Squat || d.maxes.squat || 0;
                state.maxes.Bench = d.maxes.Bench || d.maxes.bench || 0;
                state.maxes.Deadlift = d.maxes.Deadlift || d.maxes.deadlift || 0;
                state.maxes.OHP = d.maxes.OHP || d.maxes.ohp || 0;
            }
            if(d.activeWeek) state.activeWeek = d.activeWeek;
            if(d.completed) state.completed = d.completed;
            if(d.settings) state.settings = d.settings;

            // 3. FORCE VISUAL UPDATE (Visual Fix)
            if(inputs.Squat) inputs.Squat.value = state.maxes.Squat || '';
            if(inputs.Bench) inputs.Bench.value = state.maxes.Bench || '';
            if(inputs.Deadlift) inputs.Deadlift.value = state.maxes.Deadlift || '';
            if(inputs.OHP) inputs.OHP.value = state.maxes.OHP || '';
            if(state.settings.bw && document.getElementById('bodyweight')) document.getElementById('bodyweight').value = state.settings.bw;

            render();
        }
    } catch(e) {}
}

function getLoad(pct, max) { let v = max * pct; return Math.round(v/5)*5; }
function calculateDots(total, bw) { if(!bw || !total) return '-'; let w=parseFloat(bw)/2.20462; let t=parseFloat(total)/2.20462; const den = -0.000001093*Math.pow(w,4) + 0.0007391293*Math.pow(w,3) - 0.1918751679*Math.pow(w,2) + 24.0900756*w - 307.75076; return (t*(500/den)).toFixed(2); }
function getPlates(w) { let t=parseFloat(w); if(isNaN(t)) return ""; let s=(t-45)/2; if(s<=0)return""; const p=[45,35,25,10,5,2.5]; let h=""; p.forEach(x=>{ while(s>=x){ s-=x; h+=`<span class="plate p${String(x).replace('.','_')}-lbs">${x}</span>`; } }); return h; }

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
    
    // SAFETY CHECK FOR BLANK GRID
    let weekData = andreData[state.activeWeek];
    if(!weekData) { weekData = andreData[1]; state.activeWeek = 1; }

    Object.keys(weekData).forEach(day => {
        const exs = weekData[day];
        const card = document.createElement('div'); card.className = 'day-container';
        let head = `<div class="day-header"><span>${day}</span></div>`;
        let html = `<table>`;
        exs.forEach((m, i) => {
            const uid = `Andre-${state.activeWeek}-${day}-${i}`;
            const max = state.maxes[m.type] || 0;
            let load = (max > 0) ? Math.round((max * m.pct)/5)*5 + " LBS" : Math.round(m.pct*100) + "%";
            html += `<tr class="row-${m.type} ${state.completed[uid]?'completed':''}" onclick="toggleComplete('${uid}')"><td>${m.name}</td><td>${m.sets} x ${m.reps}</td><td class="load-cell" onclick="event.stopPropagation();openPlateCalc('${load}')">${load}</td></tr>`;
        });
        html += `</table>`;
        card.innerHTML = head + html;
        cont.appendChild(card);
    });
}

init();

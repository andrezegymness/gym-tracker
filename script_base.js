import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyB_1QW2BtfK5eZzakW858fg2UlAS5tZY7M", authDomain: "powerlifting-programs.firebaseapp.com", projectId: "powerlifting-programs", storageBucket: "powerlifting-programs.firebasestorage.app", messagingSenderId: "961044250962", appId: "1:961044250962:web:c45644c186e9bb6ee67a8b", measurementId: "G-501TXRLMSQ" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// BASE MAP DATA
const basePctMap = { "5": 0.75, "4": 0.79, "3": 0.83, "2": 0.87, "1": 0.91 };
const dashboardTemplate = [ { name: "Day 1 (Mon)", lifts: [{n: "Tempo Squat", t: "Squat"}, {n: "Cluster DL", t: "Deadlift"}]}, { name: "Day 2 (Tue)", lifts: [{n: "Paused Bench", t: "Bench"}, {n: "Larsen Press", t: "Bench"}]}, { name: "Day 3 (Wed)", lifts: [{n: "Comp Squat", t: "Squat"}]}, { name: "Day 4 (Thu)", lifts: [{n: "Tempo Bench", t: "Bench"}, {n: "Close Grip", t: "Bench"}]}, { name: "Day 5 (Fri)", lifts: [{n: "Paused Bench (Sgl)", t: "Bench"}]}, { name: "Day 6 (Sat)", lifts: [{n: "Pause Squats", t: "Squat"}, {n: "Paused DL Cluster", t: "Deadlift"}, {n: "Comp Bench", t: "Bench"}]} ];

// DATABASES FOR TOOLS
const accessoryData = { squat: [{name:"ATG Squats",notes:"Full depth"}, {name:"Pause Squat",notes:"Position"}], bench: [{name:"Larsen Press",notes:"No legs"}, {name:"Spoto Press",notes:"Pause off chest"}], deadlift: [{name:"Seal Rows",notes:"Back saver"}, {name:"RDL",notes:"Hinge"}] };
const ptDatabase = { knees: [{name:"Spanish Squats", rx:"3x45s", context:"Max quad tension."}, {name:"TKE", rx:"3x20", context:"VMO Firing"}], back: [{name:"McGill Big 3", rx:"3x10s", context:"Core stiffness."}], shoulders: [{name:"Dead Hangs", rx:"3x30s", context:"Decompress"}] };

const state = { maxes: { Squat:0, Bench:0, Deadlift:0, OHP:0 }, dashMode: 'standard', dashReps: '3', dashFasted: false, dashMobileWeek: 0, unit: 'LBS', completed: {}, settings: { bw: '' } };
const inputs = { Squat: document.getElementById('squatInput'), Bench: document.getElementById('benchInput'), Deadlift: document.getElementById('deadliftInput'), OHP: document.getElementById('ohpInput') };

function init() {
    // Inputs
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
    window.updateDashSettings = () => { state.dashMode = document.getElementById('dashMode').value; state.dashReps = document.getElementById('dashReps').value; state.dashMobileWeek = 0; saveToCloud(); render(); };
    window.changeMobileWeek = (dir) => { let max = (state.dashMode==='maintenance'?6:(state.dashMode==='deload'?2:4)); state.dashMobileWeek = Math.max(0, Math.min(max-1, state.dashMobileWeek+dir)); render(); };
    window.toggleFasted = () => { state.dashFasted = !state.dashFasted; saveToCloud(); render(); };
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
            <div class="attempt-row"><span>Opener (91%)</span><span class="attempt-val">${getLoad(0.91,mx)}</span></div>
            <div class="attempt-row"><span>2nd (96%)</span><span class="attempt-val">${getLoad(0.96,mx)}</span></div>
            <div class="attempt-row"><span>3rd (102%)</span><span class="attempt-val pr">${getLoad(1.02,mx)}</span></div></div>`; 
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
    window.runRandomizer = () => { const w=parseFloat(document.getElementById('prevWeight').value); if(w) { document.getElementById('randomizerResult').style.display='block'; document.getElementById('randOutputText').innerText=`Target: ${Math.round((w*1.04)/5)*5}`; } };
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
            if(d.dashMode) { state.dashMode = d.dashMode; document.getElementById('dashMode').value = d.dashMode; }
            if(d.dashReps) { state.dashReps = d.dashReps; document.getElementById('dashReps').value = d.dashReps; }
            if(d.dashFasted) state.dashFasted = d.dashFasted;
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
    document.getElementById('mobileWeekLabel').innerText = "Week " + (state.dashMobileWeek + 1);
    
    // Toggle Fasted Button
    const fBtn = document.getElementById('fastedBtn');
    fBtn.innerText = state.dashFasted ? "Fasted: ON" : "Fasted: OFF";
    fBtn.classList.toggle('active', state.dashFasted);

    // Toggle Randomizer
    if(state.dashMode === 'randomizer') {
        document.getElementById('randomizerCard').style.display = 'block';
        document.getElementById('dashboardGrid').style.display = 'none';
        return; 
    } else {
        document.getElementById('randomizerCard').style.display = 'none';
        document.getElementById('dashboardGrid').style.display = 'flex';
    }

    const cont = document.getElementById('dashboardGrid'); cont.innerHTML = '';
    const startPct = basePctMap[state.dashReps];
    const fastedMult = state.dashFasted ? 0.935 : 1.0;
    let numWeeks = (state.dashMode === 'maintenance' ? 6 : (state.dashMode === 'deload' ? 2 : 4));

    for (let w = 0; w < numWeeks; w++) {
        let activeClass = (w === state.dashMobileWeek) ? 'active' : '';
        const weekCol = document.createElement('div'); weekCol.className = `week-column ${activeClass}`;
        
        let mod = (state.dashMode === 'maintenance' ? w * 0.02 : (state.dashMode === 'deload' ? -((w + 1) * 0.04) : w * 0.04));
        const curPct = startPct + mod;
        
        weekCol.innerHTML = `<div class="week-label">WEEK ${w+1} (${Math.round(curPct*100)}%)</div>`;
        
        dashboardTemplate.forEach((day, dIdx) => {
            let activeLifts = [...day.lifts];
            // Standard Acc Logic (Injecting Volume)
            if (state.dashMode === 'standard_acc') {
                const accReps = [10, 8, 6, 5][Math.min(w,3)];
                if(dIdx===0) activeLifts.push({n:"OHP Volume", t:"OHP"});
                if(dIdx===2) activeLifts.push({n:"Hack Squat", t:"Squat"});
            }

            const card = document.createElement('div'); card.className = 'day-container';
            let html = `<div class="day-header"><span>${day.name}</span></div><table>`;
            activeLifts.forEach((lift, i) => {
                const uid = `Dash-${state.dashMode}-${w}-${day.name}-${i}`;
                let max = state.maxes[lift.t] || 0;
                let load = (max > 0) ? Math.round((max * curPct * fastedMult)/5)*5 + " LBS" : Math.round(curPct*100) + "%";
                html += `<tr class="row-${lift.t} ${state.completed[uid]?'completed':''}" onclick="toggleComplete('${uid}')"><td>${lift.n}</td><td>3x${state.dashReps}</td><td class="load-cell" onclick="event.stopPropagation();openPlateCalc('${load}')">${load}</td></tr>`;
            });
            html += `</table>`;
            card.innerHTML = html;
            weekCol.appendChild(card);
        });
        cont.appendChild(weekCol);
    }
}

init();

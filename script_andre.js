import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyB_1QW2BtfK5eZzakW858fg2UlAS5tZY7M", authDomain: "powerlifting-programs.firebaseapp.com", projectId: "powerlifting-programs", storageBucket: "powerlifting-programs.firebasestorage.app", messagingSenderId: "961044250962", appId: "1:961044250962:web:c45644c186e9bb6ee67a8b", measurementId: "G-501TXRLMSQ" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// DATA SETS
const andreData = { 1: { "Monday": [ { name: "Pause Squat", sets: 2, reps: 2, pct: 0.701, type: "Squat" } ] }, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} }; // (Keep your full data here)
const accessoryData = { squat: [{name:"ATG Squats",notes:"Full depth"}], bench: [{name:"Larsen Press",notes:"No legs"}], deadlift: [{name:"Seal Rows",notes:"Back saver"}] };
const ptDatabase = { knees: [{name:"Spanish Squats", rx:"3x45s", context:"Max quad tension."}], back: [{name:"McGill Big 3", rx:"3x10s", context:"Core stiffness."}] };

const state = { maxes: { Squat:0, Bench:0, Deadlift:0, OHP:0 }, activeWeek: 1, unit: 'LBS', completed: {}, accWeights: {}, notes: {}, settings: { bw: '' } };
const inputs = { Squat: document.getElementById('squatInput'), Bench: document.getElementById('benchInput'), Deadlift: document.getElementById('deadliftInput'), OHP: document.getElementById('ohpInput') };

function init() {
    // Inputs
    Object.keys(inputs).forEach(k => { inputs[k].addEventListener('input', e => { state.maxes[k] = parseFloat(e.target.value) || 0; saveToCloud(); render(); }); });

    // Auth
    onAuthStateChanged(auth, user => {
        if(user) { loadFromCloud(user.uid); document.getElementById('login-btn').style.display='none'; }
    });
    
    // Global Functions (Attached to Window for HTML onclick)
    window.setWeek = (n) => { state.activeWeek = n; saveToCloud(); render(); };
    window.toggleComplete = (id) => { state.completed[id] = !state.completed[id]; saveToCloud(); render(); };
    window.openTools = () => { document.getElementById('toolsModal').style.display='flex'; if(state.settings.bw) document.getElementById('bodyweight').value = state.settings.bw; };
    window.openAuthModal = () => document.getElementById('authModal').style.display='flex';
    window.closeModal = (id) => document.getElementById(id).style.display='none';
    window.openMeetPlanner = () => { 
        const m = document.getElementById('meetModal'); const g = document.getElementById('meetGrid'); m.style.display='flex'; let h=''; 
        ['Squat','Bench','Deadlift'].forEach(x=>{ 
            const mx=state.maxes[x]||0; 
            h+=`<div class="meet-col"><h4>${x}</h4>
            <div class="attempt-row"><span>Opener (91%)</span><span class="attempt-val">${getLoad(0.91,mx)}</span></div>
            <div class="attempt-row"><span>2nd (96%)</span><span class="attempt-val">${getLoad(0.96,mx)}</span></div>
            <div class="attempt-row"><span>3rd (102%)</span><span class="attempt-val pr">${getLoad(1.02,mx)}</span></div></div>`; 
        }); 
        g.innerHTML=h; 
    };
    window.openPlateCalc = (w) => {
        if(String(w).includes('%')) return; document.getElementById('plateModal').style.display = 'flex';
        const wt = parseFloat(w); document.getElementById('plateTarget').innerText = wt + " " + state.unit;
        document.getElementById('plateVisuals').innerHTML = getPlates(wt); 
        document.getElementById('plateText').innerText = "Per Side (45lb Bar)";
    };
    window.calculateOneRM = () => {
        const w=parseFloat(document.getElementById('calcWeight').value), r=parseFloat(document.getElementById('calcReps').value);
        if(w&&r) document.getElementById('oneRmResult').innerText = "Est 1RM: " + Math.round(w*(1+0.0333*r)) + " LBS";
    };
    window.calculateWarmup = () => {
        const t=parseFloat(document.getElementById('wuTarget').value);
        if(t) {
            let h=''; [0.5, 0.7, 0.9].forEach(p => {
                let w = Math.round((t*p)/5)*5;
                h += `<div class="warmup-row"><div class="warmup-header"><span>${w} lbs</span><div class="plate-stack">${getPlates(w)}</div></div></div>`;
            });
            document.getElementById('warmupDisplay').innerHTML = h;
        }
    };
    // PT & Accessories logic
    window.updatePtMovements = () => {
        const a = document.getElementById('ptArea').value; const m = document.getElementById('ptMovement'); m.innerHTML='<option>Select...</option>';
        if(ptDatabase[a]) ptDatabase[a].forEach((x,i)=>{ let o=document.createElement('option'); o.value=i; o.innerText=x.name; m.appendChild(o); });
    };
    window.displayPtLogic = () => {
        const a=document.getElementById('ptArea').value, i=document.getElementById('ptMovement').value;
        if(a&&i) { 
            const d=ptDatabase[a][i]; document.getElementById('ptDisplay').style.display='block';
            document.getElementById('ptDisplay').innerHTML = `<b>${d.name}</b><br>${d.context}<br><i>RX: ${d.rx}</i>`;
        }
    };
    
    render();
}

// HELPERS
function getLoad(pct, max) { return Math.round((max * pct)/5)*5; }
function calculateDots(total, bw) { if(!bw || !total) return '-'; let w=parseFloat(bw); let t=parseFloat(total); w/=2.20462; t/=2.20462; const den = -0.000001093*Math.pow(w,4) + 0.0007391293*Math.pow(w,3) - 0.1918751679*Math.pow(w,2) + 24.0900756*w - 307.75076; return (t*(500/den)).toFixed(2); }

function getPlates(weight) { 
    let t = parseFloat(weight); if(isNaN(t)) return ""; 
    let side = (t - 45) / 2; if(side <= 0) return ""; 
    const p = [45, 35, 25, 10, 5, 2.5]; 
    let h = ""; 
    p.forEach(x => { while(side >= x) { side -= x; h += `<span class="plate p${String(x).replace('.','_')}">${x}</span>`; } }); 
    return h; 
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
            if(d.maxes) { state.maxes.Squat = d.maxes.Squat||0; state.maxes.Bench = d.maxes.Bench||0; state.maxes.Deadlift = d.maxes.Deadlift||0; state.maxes.OHP = d.maxes.OHP||0; }
            if(d.settings) state.settings = d.settings;
            
            // Force Inputs
            inputs.Squat.value = state.maxes.Squat||''; inputs.Bench.value = state.maxes.Bench||'';
            inputs.Deadlift.value = state.maxes.Deadlift||''; inputs.OHP.value = state.maxes.OHP||'';
            render();
        }
    } catch(e) {}
}

function render() {
    const total = (state.maxes.Squat||0) + (state.maxes.Bench||0) + (state.maxes.Deadlift||0);
    document.getElementById('currentTotal').innerText = total;
    document.getElementById('currentDots').innerText = calculateDots(total, state.settings.bw);
    // ... (Your render logic for weeks/days goes here, same as before) ...
}

init();

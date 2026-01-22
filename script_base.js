import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyB_1QW2BtfK5eZzakW858fg2UlAS5tZY7M", authDomain: "powerlifting-programs.firebaseapp.com", projectId: "powerlifting-programs", storageBucket: "powerlifting-programs.firebasestorage.app", messagingSenderId: "961044250962", appId: "1:961044250962:web:c45644c186e9bb6ee67a8b", measurementId: "G-501TXRLMSQ" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const basePctMap = { "5": 0.75, "4": 0.79, "3": 0.83, "2": 0.87, "1": 0.91 };
const standardProg = 0.0425, maintProg = 0.02, tempoStartPct = 0.71, tempoProg = 0.04;
const accPeakingReps = [10, 8, 6, 5], accSets = [5, 4, 3, 2];
const dashboardTemplate = [ { name: "Day 1 (Mon)", lifts: [{n: "Tempo Squat", t: "Squat"}, {n: "Cluster DL", t: "Deadlift"}]}, { name: "Day 2 (Tue)", lifts: [{n: "Paused Bench", t: "Bench"}, {n: "Larsen Press", t: "Bench"}]}, { name: "Day 3 (Wed)", lifts: [{n: "Comp Squat", t: "Squat"}]}, { name: "Day 4 (Thu)", lifts: [{n: "Tempo Bench", t: "Bench"}, {n: "Close Grip", t: "Bench"}]}, { name: "Day 5 (Fri)", lifts: [{n: "Paused Bench (Sgl)", t: "Bench"}]}, { name: "Day 6 (Sat)", lifts: [{n: "Pause Squats", t: "Squat"}, {n: "Paused DL Cluster", t: "Deadlift"}, {n: "Comp Bench", t: "Bench"}]} ];

const state = { maxes: { Squat:0, Bench:0, Deadlift:0, OHP:0 }, dashMode: 'standard', dashReps: '3', dashFasted: false, dashMobileWeek: 0, unit: 'LBS', completed: {}, settings: { bw: '' } };
const inputs = { Squat: document.getElementById('squatInput'), Bench: document.getElementById('benchInput'), Deadlift: document.getElementById('deadliftInput'), OHP: document.getElementById('ohpInput') };

function init() {
    // Save last page
    localStorage.setItem('last_program_page', 'base.html');

    // Input Listeners
    ['squatInput','benchInput','deadliftInput','ohpInput'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', (e) => {
            let key = id.replace('Input',''); key = key.charAt(0).toUpperCase() + key.slice(1);
            state.maxes[key] = parseFloat(e.target.value) || 0;
            saveToCloud(); render();
        });
    });

    getRedirectResult(auth).then(() => {});
    onAuthStateChanged(auth, user => {
        if(user) { 
            loadFromCloud(user.uid); 
            document.getElementById('login-btn').style.display='none'; 
            document.getElementById('logout-btn').style.display='inline-block'; 
        } else {
            render();
        }
    });
    
    // Auth Buttons & Globals
    const gBtn = document.getElementById('googleLoginBtn'); if(gBtn) gBtn.addEventListener('click', () => { if(/iPhone|iPad/i.test(navigator.userAgent)) signInWithRedirect(auth, provider); else signInWithPopup(auth, provider); });
    const eBtn = document.getElementById('emailLoginBtn'); if(eBtn) eBtn.addEventListener('click', () => { signInWithEmailAndPassword(auth, document.getElementById('emailInput').value, document.getElementById('passInput').value); });
    const lBtn = document.getElementById('logout-btn'); if(lBtn) lBtn.addEventListener('click', () => signOut(auth).then(()=>location.reload()));

    window.updateDashSettings = () => { state.dashMode = document.getElementById('dashMode').value; state.dashReps = document.getElementById('dashReps').value; state.dashMobileWeek = 0; saveToCloud(); render(); };
    window.changeMobileWeek = (dir) => { let max = (state.dashMode==='maintenance'?6:(state.dashMode==='deload'?2:4)); state.dashMobileWeek = Math.max(0, Math.min(max-1, state.dashMobileWeek+dir)); render(); };
    window.toggleFasted = () => { state.dashFasted = !state.dashFasted; saveToCloud(); render(); };
    window.toggleComplete = (id) => { state.completed[id] = !state.completed[id]; saveToCloud(); render(); };
    window.saveSettings = () => { state.settings.bw = document.getElementById('bodyWeightInput').value; saveToCloud(); };
    
    // Tools
    window.calculateOneRM = () => { const w=parseFloat(document.getElementById('calcWeight').value), r=parseFloat(document.getElementById('calcReps').value); if(w&&r) { document.getElementById('oneRmResults').style.display='block'; document.getElementById('formulaBody').innerHTML=`<tr><td>Est 1RM</td><td>${Math.round(w*(1+0.0333*r))}</td></tr>`; } };
    window.calculateDotsOnly = () => { const t=document.getElementById('dotsTotalInput').value, b=document.getElementById('bodyWeightInput').value; if(t&&b) { document.getElementById('dotsResults').style.display='block'; document.getElementById('dotsDisplay').innerText=calculateDots(t,b); } };
    window.calculateWarmup = () => {
        const target = parseFloat(document.getElementById('wuTarget').value);
        if(!target) return;
        const p = [{p:0.5,r:5},{p:0.7,r:3},{p:0.9,r:1}];
        let h=''; p.forEach(x=>{ h+=`<div class="warmup-row"><div class="warmup-header"><span>${Math.round((target*x.p)/5)*5} lbs</span><span>${x.r} reps</span></div></div>`; });
        document.getElementById('warmupDisplay').innerHTML=h;
    };
    window.runRandomizer = () => { const w=parseFloat(document.getElementById('prevWeight').value); if(w) { document.getElementById('randomizerResult').style.display='block'; document.getElementById('randOutputText').innerText=`Target: ${Math.round((w*1.04)/5)*5}`; } };
    
    window.openAuthModal = () => document.getElementById('authModal').style.display='flex';
    window.openTools = () => { document.getElementById('toolsModal').style.display='flex'; if(state.settings.bw) document.getElementById('bodyweight').value = state.settings.bw; };
    window.closeModal = (id) => document.getElementById(id).style.display='none';
    window.onclick = e => { if(e.target.classList.contains('modal')) e.target.style.display='none'; };
    render();
}

async function saveToCloud() {
    const user = auth.currentUser; if(!user) return;
    try { await setDoc(doc(db, "users", user.uid), state, { merge: true }); 
    const t = document.querySelector('.brand'); if(t) { t.style.color='#4caf50'; setTimeout(()=>t.style.color='#2196f3', 500); } } catch(e) {}
}

async function loadFromCloud(uid) {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if(snap.exists()) {
            const d = snap.data();
            // 1. DATA HYDRATION (CASE INSENSITIVE)
            if(d.maxes) {
                state.maxes.Squat = d.maxes.Squat || d.maxes.squat || 0;
                state.maxes.Bench = d.maxes.Bench || d.maxes.bench || 0;
                state.maxes.Deadlift = d.maxes.Deadlift || d.maxes.deadlift || 0;
                state.maxes.OHP = d.maxes.OHP || d.maxes.ohp || 0;
            }
            if(d.dashMode) { state.dashMode = d.dashMode; document.getElementById('dashMode').value = d.dashMode; }
            if(d.dashReps) { state.dashReps = d.dashReps; document.getElementById('dashReps').value = d.dashReps; }
            if(d.completed) state.completed = d.completed;
            if(d.settings) { state.settings = d.settings; if(document.getElementById('bodyWeightInput')) document.getElementById('bodyWeightInput').value = state.settings.bw || ''; }

            // 2. FORCE VISUAL UPDATE TO INPUT BOXES
            const sIn = document.getElementById('squatInput'); if(sIn) sIn.value = state.maxes.Squat || '';
            const bIn = document.getElementById('benchInput'); if(bIn) bIn.value = state.maxes.Bench || '';
            const dIn = document.getElementById('deadliftInput'); if(dIn) dIn.value = state.maxes.Deadlift || '';
            const oIn = document.getElementById('ohpInput'); if(oIn) oIn.value = state.maxes.OHP || '';

            render();
        }
    } catch(e) {}
}

function calculateDots(total, bw) { if(!bw || !total) return '-'; let w=parseFloat(bw); let t=parseFloat(total); if(state.unit==='LBS'){ w/=2.20462; t/=2.20462; } const den = -0.000001093*Math.pow(w,4) + 0.0007391293*Math.pow(w,3) - 0.1918751679*Math.pow(w,2) + 24.0900756*w - 307.75076; return (t*(500/den)).toFixed(2); }

function render() {
    const total = (state.maxes.Squat||0) + (state.maxes.Bench||0) + (state.maxes.Deadlift||0);
    document.getElementById('currentTotal').innerText = total;
    document.getElementById('currentDots').innerText = calculateDots(total, state.settings.bw);
    document.getElementById('mobileWeekLabel').innerText = "Week " + (state.dashMobileWeek + 1);
    
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
        // Mobile Logic
        let activeClass = (w === state.dashMobileWeek) ? 'active' : '';
        const weekCol = document.createElement('div'); weekCol.className = `week-column ${activeClass}`;
        
        let mod = (state.dashMode === 'maintenance' ? w * 0.02 : (state.dashMode === 'deload' ? -((w + 1) * 0.04) : w * 0.04));
        const curPct = startPct + mod;
        
        weekCol.innerHTML = `<div class="week-label">WEEK ${w+1} (${Math.round(curPct*100)}%)</div>`;
        
        dashboardTemplate.forEach((day, dIdx) => {
            let activeLifts = [...day.lifts];
            // ... (Insert Standard Acc Logic here if desired, kept simple for brevity)
            
            const card = document.createElement('div'); card.className = 'day-container';
            let html = `<div class="day-header"><span>${day.name}</span></div><table>`;
            activeLifts.forEach((lift, i) => {
                const uid = `Dash-${state.dashMode}-${w}-${day.name}-${i}`;
                let max = state.maxes[lift.t] || 0;
                let load = (max > 0) ? Math.round((max * curPct * fastedMult)/5)*5 + " LBS" : Math.round(curPct*100) + "%";
                html += `<tr class="row-${lift.t} ${state.completed[uid]?'completed':''}" onclick="toggleComplete('${uid}')"><td>${lift.n}</td><td>3x${state.dashReps}</td><td class="load-cell">${load}</td></tr>`;
            });
            html += `</table>`;
            card.innerHTML = html;
            weekCol.appendChild(card);
        });
        cont.appendChild(weekCol);
    }
}

init();

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyB_1QW2BtfK5eZzakW858fg2UlAS5tZY7M", authDomain: "powerlifting-programs.firebaseapp.com", projectId: "powerlifting-programs", storageBucket: "powerlifting-programs.firebasestorage.app", messagingSenderId: "961044250962", appId: "1:961044250962:web:c45644c186e9bb6ee67a8b", measurementId: "G-501TXRLMSQ" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ANDRE DATA
const andreData = {
  1: { "Monday": [ { name: "Pause Squat", sets: 2, reps: 2, pct: 0.701, type: "Squat" }, { name: "Pause Squat", sets: 1, reps: 3, pct: 0.721, type: "Squat" }, { name: "Pause Squat", sets: 2, reps: 2, pct: 0.74, type: "Squat" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" }, { name: "OHP", sets: 4, reps: 2, pct: 0.804, type: "OHP" } ], "Tuesday": [ { name: "Bench", sets: 1, reps: 3, pct: 0.733, type: "Bench" }, { name: "Bench", sets: 4, reps: 3, pct: 0.844, type: "Bench" }, { name: "Floor Press", sets: 5, reps: 5, pct: 0.756, type: "Bench" } ], "Wednesday": [ { name: "Squat", sets: 1, reps: 3, pct: 0.727, type: "Squat" }, { name: "Squat", sets: 2, reps: 3, pct: 0.799, type: "Squat" }, { name: "Squat", sets: 1, reps: 3, pct: 0.838, type: "Squat" }, { name: "OHP", sets: 4, reps: 3, pct: 0.804, type: "OHP" } ], "Thursday": [ { name: "Bench", sets: 2, reps: 2, pct: 0.756, type: "Bench" }, { name: "Bench", sets: 1, reps: 3, pct: 0.844, type: "Bench" }, { name: "Bench", sets: 2, reps: 2, pct: 0.8, type: "Bench" }, { name: "AMRAP Bench", sets: 1, reps: "AMRAP", pct: 0.8, type: "Bench" } ], "Friday": [ { name: "Squat", sets: 1, reps: 2, pct: 0.753, type: "Squat" }, { name: "Squat", sets: 2, reps: 2, pct: 0.799, type: "Squat" }, { name: "Squat (Heavy)", sets: 1, reps: 1, pct: 0.903, type: "Squat" }, { name: "OHP", sets: 4, reps: 2, pct: 0.804, type: "OHP" } ], "Saturday": [ { name: "Bench (Heavy)", sets: 2, reps: 1, pct: 0.933, type: "Bench" }, { name: "Bench", sets: 3, reps: 4, pct: 0.756, type: "Bench" }, { name: "Deadlift", sets: 1, reps: 3, pct: 0.732, type: "Deadlift" }, { name: "Deadlift", sets: 2, reps: 3, pct: 0.841, type: "Deadlift" } ] },
  2: { "Monday": [{name:"Squat",sets:1,reps:3,pct:0.753,type:"Squat"}], "Tuesday": [{name:"Bench",sets:1,reps:5,pct:0.767,type:"Bench"}] },
  3: { "Monday": [{name:"Squat",sets:1,reps:3,pct:0.753,type:"Squat"}] },
  4: { "Monday": [{name:"Squat",sets:1,reps:4,pct:0.753,type:"Squat"}] },
  5: { "Monday": [{name:"Squat",sets:2,reps:2,pct:0.727,type:"Squat"}] },
  6: { "Monday": [{name:"Tempo Squat",sets:2,reps:2,pct:0.65,type:"Squat"}] }
};
for(let i=2; i<=6; i++) { if(!andreData[i]) andreData[i] = andreData[1]; }

const andreAccessories = {
  "Tuesday": [ { name: "Close Grip Bench", sets: "3x4", weeks: [1,2,3,4,6], base: 'Bench', basePct: 0.72 }, { name: "Larsen Press", sets: "3x4", weeks: [1,2,3,4,6], base: 'Bench', basePct: 0.68 }, { name: "Tricep Pushdowns", sets: "3x12", weeks: [1,2,3,6] } ],
  "Wednesday": [ { name: "Leg Extensions", sets: "3x15", weeks: [1,2,3,4,6] }, { name: "Pendulum Squat", sets: "3x8", weeks: [1,2,3,4,6] }, { name: "Walking Lunges", sets: "3x12", weeks: [1,2,3,6] }, { name: "Leg Press", sets: "4x10", weeks: [1,2,3,4,6] }, { name: "GHR", sets: "3x8", weeks: [1,2,3,4,6] } ],
  "Thursday": [ { name: "Pendlay Rows", sets: "4x6", weeks: [1,2,3,4,6] }, { name: "Weighted Pull-ups", sets: "3x8", weeks: [1,2,3,4,6] }, { name: "T-Bar Row (Chest Supp)", sets: "3x10", weeks: [1,2,3,4,6] }, { name: "Face Pulls", sets: "4x15", weeks: [1,2,3,4,5,6] } ],
  "Friday": [ { name: "DB Shoulder Press", sets: "4x10", weeks: [1,2,3,6] }, { name: "DB Lateral Raise", sets: "4x15", weeks: [1,2,3,6] }, { name: "Rear Delt Fly", sets: "4x15", weeks: [1,2,3,6] }, { name: "Arnold Press", sets: "3x10", weeks: [1,2,3,6] } ],
  "Saturday": [ { name: "RDL", sets: "4x6", weeks: [1,2,3,4,6], base: 'Deadlift', basePct: 0.55 }, { name: "Hamstring Curls", sets: "5x10", weeks: [1,2,3,4,6] }, { name: "Leg Press (High Feet)", sets: "4x12", weeks: [1,2,3,6] }, { name: "GHR", sets: "3x3", weeks: [1,2,3,4,5,6] } ]
};

// FULL DATABASES
const accessoryData = {
  squat: [ { name: "ATG System", notes: "Full range." }, { name: "Behind-the-Back", notes: "Quads." }, { name: "High Bar Pause", notes: "Position." }, { name: "Belt Squats", notes: "No spine load." }, { name: "Hack Squats", notes: "Isolation." }, { name: "Leg Press", notes: "Mass." } ],
  bench: [ { name: "Larson press", notes: "No leg drive." }, { name: "Floor press", notes: "Lockout." }, { name: "Push-ups", notes: "Volume." }, { name: "Dips", notes: "Chest/Tri." } ],
  deadlift: [ { name: "Seal Rows", notes: "Back saver." }, { name: "Pause Deadlift", notes: "Technique." }, { name: "RDL", notes: "Hinge." }, { name: "Block Pulls", notes: "Overload." } ]
};
const ptDatabase = {
  knees: [{name:"Spanish Squats", rx:"3x45s", context:"Heavy band. Max quad tension."},{name:"TKE", rx:"3x20", context:"Focus on VMO."}],
  back: [{name:"McGill Big 3", rx:"3x10s", context:"Core stiffness."},{name:"Cat-Cow", rx:"10 reps", context:"Restore movement."}],
  shoulders: [{name:"Dead Hangs", rx:"3x45s", context:"Decompress AC joint."},{name:"Face Pulls", rx:"3x20", context:"Upper back."}],
  hips: [{name:"90/90 Switches", rx:"20 reps", context:"Internal/External rotation."},{name:"Couch Stretch", rx:"2 mins", context:"Psoas."}],
  elbows: [{name:"Hammer Curls", rx:"3x15", context:"Elbow health."}]
};

const state = { maxes: { Squat:0, Bench:0, Deadlift:0, OHP:0 }, activeWeek: 1, unit: 'LBS', completed: {}, accWeights: {}, notes: {}, settings: { bw: '' } };
const inputs = { Squat: document.getElementById('squatInput'), Bench: document.getElementById('benchInput'), Deadlift: document.getElementById('deadliftInput'), OHP: document.getElementById('ohpInput') };

function init() {
    Object.keys(inputs).forEach(k => { inputs[k].addEventListener('input', e => { state.maxes[k] = parseFloat(e.target.value) || 0; saveToCloud(); render(); }); });
    onAuthStateChanged(auth, user => { if(user) { loadFromCloud(user.uid); document.getElementById('login-btn').style.display='none'; } });
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
    
    // WARMUP WITH CUES
    window.calculateWarmup = () => {
        const target=parseFloat(document.getElementById('wuTarget').value); 
        const style=document.getElementById('wuStyle').value; 
        const lift=document.getElementById('wuLiftType').value;
        if(!target) return;
        
        let protocol = [];
        if (style === 'big') protocol = [{p:0.45,r:'5'}, {p:0.68,r:'3'}, {p:0.84,r:'1'}, {p:0.92,r:'1'}, {p:0.97,r:'OPT'}];
        else if (style === 'tight') protocol = [{p:0.40,r:'8'}, {p:0.52,r:'5'}, {p:0.64,r:'3'}, {p:0.75,r:'2'}, {p:0.84,r:'1'}, {p:0.90,r:'1'}, {p:0.94,r:'1'}, {p:0.98,r:'OPT'}];
        else protocol = [{p:0.505,r:'5'}, {p:0.608,r:'3'}, {p:0.72,r:'2'}, {p:0.834,r:'1'}, {p:0.93,r:'1'}, {p:0.97,r:'OPT'}];

        const cues = {
            squat: ["Move fast, open hips.", "Focus foot pressure.", "Start bracing.", "BELT ON.", "Max pressure.", "Final heavy feel."],
            bench: ["Active lats.", "Drive heels.", "Tight arch.", "Explode.", "Comp pause.", "Final heavy feel."],
            deadlift: ["Pull slack.", "Chest up.", "Squeeze lats.", "BELT ON.", "Comp speed.", "Final heavy feel."]
        };

        let html = '';
        protocol.forEach((s, i) => {
            let lb = Math.round((target * s.p) / 5) * 5;
            let showBelt = (lift === 'squat' && s.p >= 0.70) || (lift === 'deadlift' && s.p >= 0.83);
            let cue = cues[lift][i] || "Focus on speed";
            let reps = s.r === 'OPT' ? 'Optional' : s.r + ' Reps';
            
            html += `<div class="warmup-row">
                <div class="warmup-meta"><span class="warmup-weight">${lb} lbs ${showBelt?'<span class="belt-badge">BELT</span>':''}</span><span>${reps}</span></div>
                <div class="warmup-cue">${cue}</div>
            </div>`;
        });
        document.getElementById('warmupDisplay').innerHTML = html;
    };

    window.updatePtMovements = () => { const a=document.getElementById('ptArea').value; const m=document.getElementById('ptMovement'); m.innerHTML='<option>Select...</option>'; if(ptDatabase[a]) ptDatabase[a].forEach((x,i)=>{ let o=document.createElement('option'); o.value=i; o.innerText=x.name; m.appendChild(o); }); };
    window.displayPtLogic = () => { const a=document.getElementById('ptArea').value, i=document.getElementById('ptMovement').value; if(a&&i) { const d=ptDatabase[a][i]; document.getElementById('ptDisplay').style.display='block'; document.getElementById('ptDisplay').innerHTML=`<b>${d.name}</b><br>${d.context}<br><i>RX: ${d.rx}</i>`; } };
    window.updateAccOptions = () => { const c=document.getElementById('accCategory').value; const m=document.getElementById('accExercise'); m.innerHTML=''; accessoryData[c].forEach(x=>{ let o=document.createElement('option'); o.value=x.name; o.innerText=x.name; m.appendChild(o); }); };
    window.displayAccDetails = () => { const c=document.getElementById('accCategory').value, n=document.getElementById('accExercise').value; const d=accessoryData[c].find(x=>x.name===n); if(d) { document.getElementById('accDetails').style.display='block'; document.getElementById('accDetails').innerText = d.notes; } };
    window.calculateOneRM = () => { const w=parseFloat(document.getElementById('calcWeight').value),r=parseFloat(document.getElementById('calcReps').value); if(w&&r) document.getElementById('oneRmResult').innerText = "Est 1RM: " + Math.round(w*(1+0.0333*r)); };
    window.openMeetPlanner = () => { const m=document.getElementById('meetModal'); const g=document.getElementById('meetGrid'); m.style.display='flex'; let h=''; ['Squat','Bench','Deadlift'].forEach(x=>{ const mx=state.maxes[x]||0; h+=`<div class="meet-col"><h4>${x}</h4><div class="attempt-row"><span>Opener</span><span class="attempt-val">${getLoad(0.91,mx)}</span></div><div class="attempt-row"><span>2nd</span><span class="attempt-val">${getLoad(0.96,mx)}</span></div><div class="attempt-row"><span>3rd</span><span class="attempt-val pr">${getLoad(1.02,mx)}</span></div></div>`; }); g.innerHTML=h; };
    window.openPlateCalc = (w) => {
        if(String(w).includes('%')) return; document.getElementById('plateModal').style.display='flex';
        const wt=parseFloat(w); document.getElementById('plateTarget').innerText=wt+" "+state.unit;
        document.getElementById('plateVisuals').innerHTML=getPlates(wt); document.getElementById('plateText').innerText="Per Side (45lb Bar)";
    };

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
            if(d.maxes) { state.maxes.Squat = d.maxes.Squat||0; state.maxes.Bench = d.maxes.Bench||0; state.maxes.Deadlift = d.maxes.Deadlift||0; state.maxes.OHP = d.maxes.OHP||0; }
            if(d.activeWeek) state.activeWeek = d.activeWeek;
            if(d.completed) state.completed = d.completed;
            if(d.settings) state.settings = d.settings;
            inputs.Squat.value = state.maxes.Squat||''; inputs.Bench.value = state.maxes.Bench||'';
            inputs.Deadlift.value = state.maxes.Deadlift||''; inputs.OHP.value = state.maxes.OHP||'';
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
    
    let weekData = andreData[state.activeWeek];
    if(!weekData) { weekData = andreData[1]; state.activeWeek = 1; }

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
            let load = (max > 0) ? Math.round((max * m.pct)/5)*5 + " LBS" : Math.round(m.pct*100) + "%";
            html += `<tr class="row-${m.type} ${state.completed[uid]?'completed':''}" onclick="toggleComplete('${uid}')"><td>${m.name}</td><td>${m.sets} x ${m.reps}</td><td class="load-cell" onclick="event.stopPropagation();openPlateCalc('${load}')">${load}</td></tr>`;
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
                accHtml += `<div class="acc-row"><div class="acc-info"><span class="acc-name">${a.name}</span>${recHtml}</div><span class="acc-sets">${a.sets}</span><input class="acc-input" value="${state.accWeights[accId]||''}" onchange="updateAccWeight('${accId}',this.value)"></div>`;
            });
            html += accHtml + `</div></div>`;
        }
        card.innerHTML = head + html;
        cont.appendChild(card);
    });
}

init();

// ==========================================
// SCRIPT_ANDRE.JS — Andre Map Wave
// Fixed: Smart Logic deduplicated, custom lift
//        sync (localStorage + Firebase), alerts
//        replaced with toasts, nav link corrected
// New:   rest timer, BW chart, PDF export,
//        dark/light theme toggle
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

// ==========================================
// TOAST — replaces all alert() calls
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
    dark:  { '--bg':'#0d0d0d','--surface':'#1e1e1e','--surface2':'#222','--border':'#333','--text':'#fff','--text-muted':'#aaa','--accent':'#2196f3','--gold':'#FFD700' },
    light: { '--bg':'#f0f2f5','--surface':'#ffffff','--surface2':'#f8f9fa','--border':'#ddd','--text':'#1a1a1a','--text-muted':'#666','--accent':'#1565c0','--gold':'#b8860b' }
};
let currentTheme = localStorage.getItem('theme') || 'dark';

function applyTheme(name) {
    const t = themes[name] || themes.dark;
    Object.entries(t).forEach(([k,v]) => document.documentElement.style.setProperty(k,v));
    document.body.style.background = t['--bg'];
    document.body.style.color = t['--text'];
    currentTheme = name;
    localStorage.setItem('theme', name);
    const btn = document.getElementById('themeToggleBtn');
    if(btn) btn.innerText = name==='dark' ? '☀️ Light' : '🌙 Dark';
}
window.toggleTheme = function() { applyTheme(currentTheme==='dark' ? 'light' : 'dark'); };

// ==========================================
// REST TIMER — NEW FEATURE
// ==========================================
let restTimerInterval = null;
let restTimerSeconds = 0;

function injectRestTimer() {
    if (document.getElementById('restTimerBar')) return;
    const bar = document.createElement('div');
    bar.id = 'restTimerBar';
    bar.style.cssText = `position:fixed;top:60px;right:15px;z-index:8000;background:#1e1e1e;border:1px solid #333;border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.5);min-width:200px;`;
    bar.innerHTML = `
        <span style="font-size:20px;">⏱</span>
        <span id="restTimerDisplay" style="font-size:1.4em;font-weight:900;color:#2196f3;min-width:50px;">0:00</span>
        <div style="display:flex;gap:6px;">
            <button onclick="startRestTimer(90)"  style="background:#2196f3;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-weight:bold;">90s</button>
            <button onclick="startRestTimer(180)" style="background:#ff9800;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-weight:bold;">3m</button>
            <button onclick="startRestTimer(300)" style="background:#9c27b0;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-weight:bold;">5m</button>
            <button onclick="stopRestTimer()"     style="background:#555;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;">✕</button>
        </div>`;
    document.body.appendChild(bar);
}

window.startRestTimer = function(seconds) {
    if (restTimerInterval) clearInterval(restTimerInterval);
    restTimerSeconds = seconds;
    const display = document.getElementById('restTimerDisplay');
    restTimerInterval = setInterval(() => {
        restTimerSeconds--;
        const m = Math.floor(restTimerSeconds/60);
        const s = restTimerSeconds%60;
        if(display) {
            display.innerText = `${m}:${s.toString().padStart(2,'0')}`;
            display.style.color = restTimerSeconds<=10 ? '#ff4444' : restTimerSeconds<=30 ? '#ff9800' : '#2196f3';
        }
        if(restTimerSeconds <= 0) {
            clearInterval(restTimerInterval);
            if(display) display.innerText = '✅ GO';
            if(navigator.vibrate) navigator.vibrate([200,100,200]);
            toast('Rest done — time to lift! 💪', 'info');
        }
    }, 1000);
};

window.stopRestTimer = function() {
    if(restTimerInterval) clearInterval(restTimerInterval);
    const display = document.getElementById('restTimerDisplay');
    if(display) { display.innerText='0:00'; display.style.color='#2196f3'; }
};

// ==========================================
// BODYWEIGHT CHART — NEW FEATURE
// ==========================================
function getBodyweightHistory() { return JSON.parse(localStorage.getItem('bwHistory') || '[]'); }
function saveBodyweightEntry(bw) {
    const h = getBodyweightHistory();
    h.push({ date: new Date().toLocaleDateString('en-US'), bw: parseFloat(bw) });
    if(h.length > 90) h.shift();
    localStorage.setItem('bwHistory', JSON.stringify(h));
}

window.openBWChart = function() {
    const history = getBodyweightHistory();
    const modal = document.createElement('div');
    modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9000;display:flex;align-items:center;justify-content:center;`;
    if(history.length < 2) {
        modal.innerHTML = `<div style="background:#1e1e1e;padding:30px;border-radius:12px;color:#fff;text-align:center;max-width:400px;">
            <h3 style="color:#2196f3;">📈 Bodyweight Chart</h3>
            <p style="color:#aaa;">Not enough data yet. Log your bodyweight in Settings after each session and come back with at least 2 entries.</p>
            <button onclick="this.closest('[style*=fixed]').remove()" style="background:#2196f3;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;margin-top:15px;">Close</button>
        </div>`;
        document.body.appendChild(modal);
        return;
    }
    const W = Math.min(700, window.innerWidth-40);
    const H = 300;
    const pad = {top:30,right:20,bottom:50,left:50};
    const chartW = W-pad.left-pad.right;
    const chartH = H-pad.top-pad.bottom;
    const bws = history.map(h=>h.bw);
    const minBW = Math.min(...bws)-2, maxBW = Math.max(...bws)+2;
    const pts = history.map((h,i) => ({
        x: pad.left+(i/(history.length-1))*chartW,
        y: pad.top+chartH-((h.bw-minBW)/(maxBW-minBW))*chartH,
        ...h
    }));
    const polyline = pts.map(p=>`${p.x},${p.y}`).join(' ');
    const area = `${pts[0].x},${pad.top+chartH} `+pts.map(p=>`${p.x},${p.y}`).join(' ')+` ${pts[pts.length-1].x},${pad.top+chartH}`;
    let yLabels='';
    for(let i=0;i<=4;i++) {
        const val=(minBW+(i/4)*(maxBW-minBW)).toFixed(1);
        const y=pad.top+chartH-(i/4)*chartH;
        yLabels+=`<text x="${pad.left-8}" y="${y+4}" fill="#888" font-size="11" text-anchor="end">${val}</text>`;
        yLabels+=`<line x1="${pad.left}" y1="${y}" x2="${pad.left+chartW}" y2="${y}" stroke="#333" stroke-width="1" stroke-dasharray="4"/>`;
    }
    let xLabels='';
    const step=Math.max(1,Math.floor(history.length/8));
    pts.forEach((p,i)=>{ if(i%step===0||i===pts.length-1) xLabels+=`<text x="${p.x}" y="${pad.top+chartH+20}" fill="#888" font-size="10" text-anchor="middle">${p.date}</text>`; });
    const last3avg = bws.slice(-3).reduce((a,b)=>a+b,0)/3;
    const first3avg = bws.slice(0,3).reduce((a,b)=>a+b,0)/3;
    const diff = (last3avg-first3avg).toFixed(1);
    const trend = diff>0 ? `+${diff} lbs ↑` : `${diff} lbs ↓`;
    modal.innerHTML = `<div style="background:#1e1e1e;padding:20px;border-radius:12px;color:#fff;width:${W+40}px;max-width:95vw;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
            <h3 style="margin:0;color:#2196f3;">📈 Bodyweight History</h3>
            <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;">✕</button>
        </div>
        <svg width="${W}" height="${H}" style="display:block;">
            <defs><linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2196f3" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#2196f3" stop-opacity="0"/>
            </linearGradient></defs>
            ${yLabels}${xLabels}
            <polygon points="${area}" fill="url(#bwGrad)"/>
            <polyline points="${polyline}" fill="none" stroke="#2196f3" stroke-width="2.5"/>
            ${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#2196f3" stroke="#1e1e1e" stroke-width="2"><title>${p.date}: ${p.bw} lbs</title></circle>`).join('')}
        </svg>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid #333;">
            <span style="color:#aaa;font-size:13px;">${history.length} entries | ${trend}</span>
            <button onclick="if(confirm('Clear history?')){localStorage.removeItem('bwHistory');this.closest('[style*=fixed]').remove();toast('Cleared');}"
                style="background:#c62828;color:#fff;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;font-size:12px;">Clear</button>
        </div>
    </div>`;
    document.body.appendChild(modal);
};

// ==========================================
// PR TRACKER — NEW FEATURE
// ==========================================
function getPRData() {
    return JSON.parse(localStorage.getItem('prData') || '{}');
}
function savePRData(data) {
    localStorage.setItem('prData', JSON.stringify(data));
}

window.logPR = function(liftName, weight, reps) {
    const data = getPRData();
    if (!data[liftName]) data[liftName] = { current: 0, history: [] };
    const entry = { date: new Date().toLocaleDateString('en-US'), weight: parseFloat(weight), reps: parseInt(reps) || 1 };
    data[liftName].history.push(entry);
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
    filterMonths = filterMonths || 0;

    const modal = document.createElement('div');
    modal.id = 'prTrackerModal';
    modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:9000;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px 0;`;
    const W = Math.min(720, window.innerWidth - 40);

    function filterHistory(history) {
        if (!filterMonths) return history;
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - filterMonths);
        return history.filter(h => new Date(h.date) >= cutoff);
    }

    const ranges = [{label:'1M',months:1},{label:'3M',months:3},{label:'6M',months:6},{label:'1Y',months:12},{label:'All',months:0}];
    const rangeHtml = ranges.map(r =>
        `<button onclick="document.getElementById('prTrackerModal').remove();openPRTracker(${r.months})"
            style="background:${filterMonths===r.months?'#FFD700':'#222'};color:${filterMonths===r.months?'#000':'#aaa'};border:1px solid ${filterMonths===r.months?'#FFD700':'#444'};border-radius:5px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:bold;">${r.label}</button>`
    ).join('');

    let chartsHtml = '';
    if (lifts.length === 0) {
        chartsHtml = `<p style="color:#aaa;text-align:center;margin:30px 0;">No PRs logged yet.<br>Hit the 🏆 next to any main lift to log a PR.</p>`;
    } else {
        lifts.forEach(liftName => {
            const d = data[liftName];
            if (!d.history || d.history.length === 0) return;
            const filtered = filterHistory(d.history);
            if (filtered.length === 0) return;
            const weights = filtered.map(h=>h.weight);
            const minW = Math.min(...weights)-5, maxW = Math.max(...weights)+5;
            const cW = Math.min(W-40,620), cH = 160;
            const pad = {top:15,right:15,bottom:38,left:48};
            const chartW = cW-pad.left-pad.right, chartH = cH-pad.top-pad.bottom;
            const pts = filtered.map((h,i) => ({
                x: pad.left+(filtered.length>1?(i/(filtered.length-1))*chartW:chartW/2),
                y: pad.top+chartH-((h.weight-minW)/(maxW-minW||1))*chartH, ...h
            }));
            const polyline = pts.map(p=>`${p.x},${p.y}`).join(' ');
            const area = `${pts[0].x},${pad.top+chartH} `+pts.map(p=>`${p.x},${p.y}`).join(' ')+` ${pts[pts.length-1].x},${pad.top+chartH}`;
            let yLabels = '';
            [0,0.33,0.66,1].forEach(frac => {
                const val=Math.round(minW+frac*(maxW-minW)), y=pad.top+chartH-frac*chartH;
                yLabels+=`<text x="${pad.left-6}" y="${y+4}" fill="#555" font-size="10" text-anchor="end">${val}</text>`;
                yLabels+=`<line x1="${pad.left}" y1="${y}" x2="${pad.left+chartW}" y2="${y}" stroke="#2a2a2a" stroke-width="1"/>`;
            });
            let xLabels='';
            const step=Math.max(1,Math.floor(filtered.length/6));
            pts.forEach((p,i)=>{ if(i%step===0||i===pts.length-1) xLabels+=`<text x="${p.x}" y="${pad.top+chartH+18}" fill="#555" font-size="9" text-anchor="middle">${p.date}</text>`; });
            const allTimeBest=Math.max(...d.history.map(h=>h.weight));
            const pbY=pad.top+chartH-((allTimeBest-minW)/(maxW-minW||1))*chartH;
            const pbLine=allTimeBest<=maxW&&allTimeBest>=minW
                ?`<line x1="${pad.left}" y1="${pbY}" x2="${pad.left+chartW}" y2="${pbY}" stroke="#FFD700" stroke-width="1" stroke-dasharray="4" opacity="0.4"/><text x="${pad.left+chartW+2}" y="${pbY+4}" fill="#FFD700" font-size="9">PB</text>`:'';
            const gradId=`grad_${liftName.replace(/\W/g,'_')}`;
            const trend=filtered.length>=2?(()=>{const diff=filtered[filtered.length-1].weight-filtered[0].weight;return diff>=0?`+${diff} lbs ↑`:`${diff} lbs ↓`;})():'';
            chartsHtml+=`<div style="background:#111;border:1px solid #2a2a2a;border-radius:10px;padding:15px;margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div><span style="font-weight:900;font-size:1em;color:#fff;">${liftName}</span>
                        <span style="color:#555;font-size:11px;margin-left:8px;">${d.history.length} sessions total</span></div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="color:#FFD700;font-weight:900;font-size:1.1em;">🏆 ${allTimeBest} lbs</span>
                        ${trend?`<span style="font-size:11px;color:${trend.includes('↑')?'#4caf50':'#ff5722'};">${trend}</span>`:''}
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
                    ${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="${p.weight===allTimeBest?5:3.5}" fill="${p.weight===allTimeBest?'#FFD700':'#b8860b'}" stroke="#111" stroke-width="2"><title>${p.date}: ${p.weight} lbs x${p.reps}</title></circle>`).join('')}
                </svg>
                <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                    ${filtered.slice(-6).reverse().map(h=>`<span style="background:#1a1a1a;border:1px solid ${h.weight===allTimeBest?'#FFD700':'#333'};border-radius:4px;padding:3px 8px;font-size:11px;color:#aaa;">${h.date}: <strong style="color:${h.weight===allTimeBest?'#FFD700':'#fff'};">${h.weight}</strong> x${h.reps}</span>`).join('')}
                </div>
            </div>`;
        });
        if (!chartsHtml) chartsHtml=`<p style="color:#aaa;text-align:center;margin:20px 0;">No entries in this time range.</p>`;
    }

    const liftOptions=['Squat','Bench','Deadlift','OHP','Pause Squat','Pause Deadlift','Floor Press','Close Grip Bench','Other'];
    // Close on backdrop click
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    modal.innerHTML=`<div style="background:#1a1a1a;border:1px solid #333;border-radius:14px;padding:22px;width:${W}px;max-width:95vw;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h2 style="margin:0;color:#FFD700;">🏆 PR Tracker</h2>
            <button id="prTrackerCloseBtn" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;line-height:1;">✕</button>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:18px;align-items:center;">
            <span style="color:#555;font-size:12px;margin-right:4px;">Range:</span>${rangeHtml}
        </div>
        <div style="background:#111;border:1px solid #333;border-radius:8px;padding:14px;margin-bottom:20px;">
            <div style="font-size:12px;color:#aaa;margin-bottom:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Log a Session</div>
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;align-items:end;">
                <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Lift</label>
                    <select id="prLiftName" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:8px;border-radius:5px;">${liftOptions.map(l=>`<option>${l}</option>`).join('')}</select></div>
                <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Weight (lbs)</label>
                    <input type="number" id="prWeight" placeholder="315" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:8px;border-radius:5px;"></div>
                <div><label style="font-size:11px;color:#666;display:block;margin-bottom:3px;">Reps</label>
                    <input type="number" id="prReps" placeholder="1" value="1" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:8px;border-radius:5px;"></div>
                <button onclick="const n=document.getElementById('prLiftName').value;const w=document.getElementById('prWeight').value;const r=document.getElementById('prReps').value;if(w){logPR(n,w,r);document.getElementById('prTrackerModal').remove();setTimeout(()=>openPRTracker(${filterMonths}),200);}"
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
// ==========================================
function getRPELog() { return JSON.parse(localStorage.getItem('rpeLog') || '{}'); }
function saveRPELog(log) { localStorage.setItem('rpeLog', JSON.stringify(log)); }
function rpeColor(rpe) {
    if (rpe <= 6) return '#4caf50';
    if (rpe <= 7) return '#8bc34a';
    if (rpe === 8) return '#ff9800';
    if (rpe === 9) return '#ff5722';
    return '#f44336';
}
function rpeLabel(rpe) { return {6:'Easy',7:'Moderate',8:'Hard',9:'Very Hard',10:'Max'}[rpe]||''; }

window.logRPE = function(liftId, rpe) {
    const log = getRPELog();
    const today = new Date().toLocaleDateString('en-US');
    if (!log[today]) log[today] = {};
    log[today][liftId] = parseInt(rpe);
    const days = Object.keys(log).sort();
    // Keep full history — no expiry
    saveRPELog(log);
    const badge = document.getElementById(`rpe-badge-${CSS.escape(liftId)}`);
    if (badge) {
        const color = rpeColor(rpe);
        badge.innerHTML = `<span style="background:${color};color:#000;border-radius:3px;padding:1px 5px;font-size:10px;font-weight:900;">RPE ${rpe}</span>`;
    }
    toast(`RPE ${rpe} — ${rpeLabel(rpe)} logged`, 'info');
};

function buildRPEPicker(liftId) {
    const log = getRPELog();
    const today = new Date().toLocaleDateString('en-US');
    const existing = log[today] && log[today][liftId];
    const color = existing ? rpeColor(existing) : null;
    const badge = existing
        ? `<span style="background:${color};color:#000;border-radius:3px;padding:1px 5px;font-size:10px;font-weight:900;">RPE ${existing}</span>`
        : `<span style="color:#444;font-size:10px;">RPE?</span>`;
    const safeId = liftId.replace(/'/g, '_'); // prevent quote injection
    const dots = [6,7,8,9,10].map(r => {
        const c = rpeColor(r);
        const sel = existing===r ? 'border:2px solid #fff;' : 'border:2px solid transparent;';
        return `<span onclick="logRPE('${safeId}',${r})" title="RPE ${r}" style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${c};cursor:pointer;${sel}vertical-align:middle;"></span>`;
    }).join('');
    return `<div id="rpe-badge-${safeId}" style="margin-top:3px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">${badge}<span style="color:#333;font-size:10px;">|</span>${dots}</div>`;
}

// ==========================================
// PDF EXPORT — NEW FEATURE
// ==========================================
window.exportToPDF = function() {
    const maxes = state.maxes;
    const total = (maxes.Squat||0)+(maxes.Bench||0)+(maxes.Deadlift||0);
    const win = window.open('', '_blank');
    const grid = document.getElementById('programContent');
    win.document.write(`<!DOCTYPE html><html><head>
        <title>Andre Map Wave — Week ${state.activeWeek}</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box;}
            body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#fff;padding:20px;}
            .header{text-align:center;margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:10px;}
            h1{font-size:18px;font-weight:900;}
            .meta{display:flex;justify-content:center;gap:20px;margin-top:6px;color:#555;font-size:11px;}
            .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
            table{width:100%;border-collapse:collapse;margin-top:4px;}
            th,td{padding:3px 5px;border-bottom:1px solid #eee;font-size:10px;}
            th{background:#1565c0;color:#fff;text-align:left;}
            td:last-child{text-align:right;font-weight:bold;color:#1565c0;}
            .day-card{border:1px solid #ccc;border-radius:6px;padding:8px;break-inside:avoid;}
            .day-title{font-weight:900;font-size:12px;color:#1565c0;margin-bottom:6px;border-bottom:1px solid #ddd;padding-bottom:4px;}
            .footer{margin-top:20px;text-align:center;color:#999;font-size:10px;border-top:1px solid #ddd;padding-top:10px;}
            @media print{.grid{grid-template-columns:repeat(2,1fr);}}
        </style>
    </head><body>
    <div class="header">
        <h1>ANDRE MAP WAVE — Week ${state.activeWeek}</h1>
        <div class="meta">
            <span>S: ${maxes.Squat} | B: ${maxes.Bench} | D: ${maxes.Deadlift} | OHP: ${maxes.OHP}</span>
            <span>Total: ${total} lbs</span>
            <span>Printed: ${new Date().toLocaleDateString()}</span>
        </div>
    </div>
    <div>${grid ? grid.innerHTML : '<p>No program loaded.</p>'}</div>
    <div class="footer">Andre's Calibrations &copy; 2026</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
    toast('Opening print dialog…', 'info');
};

// ==========================================
// ANDRE MAP DATA
// ==========================================
const andreData = {
  1: {
    "Monday":    [ {name:"Pause Squat",sets:2,reps:2,pct:0.701,type:"Squat"},{name:"Pause Squat",sets:1,reps:3,pct:0.721,type:"Squat"},{name:"Pause Squat",sets:2,reps:2,pct:0.74,type:"Squat"},{name:"Deadlift",sets:1,reps:3,pct:0.732,type:"Deadlift"},{name:"Deadlift",sets:2,reps:3,pct:0.841,type:"Deadlift"},{name:"OHP",sets:3,reps:4,pct:0.75,type:"OHP"} ],
    "Tuesday":   [ {name:"Bench",sets:1,reps:3,pct:0.733,type:"Bench"},{name:"Bench",sets:4,reps:3,pct:0.844,type:"Bench"},{name:"Floor Press",sets:5,reps:5,pct:0.756,type:"Bench"} ],
    "Wednesday": [ {name:"Squat",sets:1,reps:3,pct:0.727,type:"Squat"},{name:"Squat",sets:2,reps:3,pct:0.799,type:"Squat"},{name:"Squat",sets:1,reps:3,pct:0.838,type:"Squat"} ],
    "Thursday":  [ {name:"Bench",sets:2,reps:2,pct:0.756,type:"Bench"},{name:"Bench",sets:1,reps:3,pct:0.844,type:"Bench"},{name:"Bench",sets:2,reps:2,pct:0.8,type:"Bench"},{name:"AMRAP Bench",sets:1,reps:"AMRAP",pct:0.8,type:"Bench"} ],
    "Friday":    [ {name:"Squat",sets:1,reps:2,pct:0.753,type:"Squat"},{name:"Squat",sets:2,reps:2,pct:0.799,type:"Squat"},{name:"Squat (Heavy)",sets:1,reps:1,pct:0.903,type:"Squat"},{name:"OHP",sets:4,reps:8,pct:0.68,type:"OHP"} ],
    "Saturday":  [ {name:"Bench (Heavy)",sets:2,reps:1,pct:0.933,type:"Bench"},{name:"Bench",sets:3,reps:4,pct:0.756,type:"Bench"},{name:"Pause Deadlift",sets:1,reps:3,pct:0.682,type:"Deadlift"},{name:"Pause Deadlift",sets:2,reps:3,pct:0.791,type:"Deadlift"} ]
  },
  2: {
    "Monday":    [ {name:"Squat",sets:1,reps:3,pct:0.753,type:"Squat"},{name:"Squat",sets:1,reps:5,pct:0.773,type:"Squat"},{name:"Squat",sets:1,reps:4,pct:0.831,type:"Squat"},{name:"Deadlift",sets:1,reps:3,pct:0.732,type:"Deadlift"},{name:"Deadlift",sets:2,reps:3,pct:0.811,type:"Deadlift"},{name:"Deadlift",sets:1,reps:3,pct:0.866,type:"Deadlift"},{name:"OHP",sets:3,reps:4,pct:0.79,type:"OHP"} ],
    "Tuesday":   [ {name:"Bench",sets:1,reps:5,pct:0.767,type:"Bench"},{name:"Bench",sets:3,reps:4,pct:0.811,type:"Bench"},{name:"Floor Press",sets:5,reps:5,pct:0.778,type:"Bench"} ],
    "Wednesday": [ {name:"Pause Squat",sets:2,reps:2,pct:0.708,type:"Squat"},{name:"Pause Squat",sets:1,reps:2,pct:0.734,type:"Squat"},{name:"Pause Squat",sets:1,reps:2,pct:0.753,type:"Squat"} ],
    "Thursday":  [ {name:"Bench",sets:1,reps:3,pct:0.856,type:"Bench"},{name:"Bench",sets:2,reps:2,pct:0.8,type:"Bench"},{name:"AMRAP Bench",sets:1,reps:"AMRAP",pct:0.8,type:"Bench"} ],
    "Friday":    [ {name:"Squat",sets:1,reps:3,pct:0.753,type:"Squat"},{name:"Squat",sets:1,reps:5,pct:0.825,type:"Squat"},{name:"Squat",sets:2,reps:5,pct:0.799,type:"Squat"},{name:"OHP",sets:4,reps:8,pct:0.72,type:"OHP"} ],
    "Saturday":  [ {name:"Bench",sets:4,reps:5,pct:0.822,type:"Bench"},{name:"Pause Deadlift",sets:2,reps:2,pct:0.749,type:"Deadlift"},{name:"Pause Deadlift",sets:1,reps:2,pct:0.810,type:"Deadlift"} ]
  },
  3: {
    "Monday":    [ {name:"Squat",sets:1,reps:3,pct:0.753,type:"Squat"},{name:"Squat",sets:2,reps:2,pct:0.753,type:"Squat"},{name:"Squat",sets:1,reps:2,pct:0.779,type:"Squat"},{name:"Deadlift",sets:1,reps:3,pct:0.732,type:"Deadlift"},{name:"Deadlift",sets:1,reps:3,pct:0.89,type:"Deadlift"},{name:"OHP",sets:3,reps:4,pct:0.83,type:"OHP"} ],
    "Tuesday":   [ {name:"Bench",sets:2,reps:7,pct:0.756,type:"Bench"},{name:"Bench",sets:2,reps:6,pct:0.8,type:"Bench"},{name:"Floor Press",sets:5,reps:5,pct:0.789,type:"Bench"} ],
    "Wednesday": [ {name:"Squat",sets:1,reps:7,pct:0.76,type:"Squat"},{name:"Squat",sets:2,reps:6,pct:0.799,type:"Squat"} ],
    "Thursday":  [ {name:"Bench",sets:4,reps:5,pct:0.7,type:"Bench"} ],
    "Friday":    [ {name:"Pause Squat",sets:1,reps:2,pct:0.753,type:"Squat"},{name:"Pause Squat",sets:3,reps:2,pct:0.727,type:"Squat"},{name:"OHP",sets:4,reps:8,pct:0.76,type:"OHP"} ],
    "Saturday":  [ {name:"Bench (Heavy)",sets:2,reps:1,pct:0.933,type:"Bench"},{name:"Pause Deadlift",sets:2,reps:2,pct:0.791,type:"Deadlift"},{name:"Pause Deadlift",sets:1,reps:3,pct:0.688,type:"Deadlift"} ]
  },
  4: {
    "Monday":    [ {name:"Squat",sets:1,reps:4,pct:0.753,type:"Squat"},{name:"Squat",sets:1,reps:4,pct:0.773,type:"Squat"},{name:"Squat (Heavy)",sets:1,reps:4,pct:0.903,type:"Squat"},{name:"Squat (Backoff)",sets:1,reps:4,pct:0.87,type:"Squat"},{name:"Deadlift",sets:1,reps:3,pct:0.732,type:"Deadlift"},{name:"Deadlift",sets:2,reps:3,pct:0.738,type:"Deadlift"},{name:"OHP",sets:3,reps:4,pct:0.87,type:"OHP"} ],
    "Wednesday": [ {name:"Squat",sets:1,reps:2,pct:0.753,type:"Squat"},{name:"Squat",sets:2,reps:2,pct:0.792,type:"Squat"},{name:"Bench",sets:1,reps:4,pct:0.756,type:"Bench"},{name:"Bench",sets:1,reps:4,pct:0.8,type:"Bench"},{name:"Bench",sets:1,reps:4,pct:0.867,type:"Bench"} ],
    "Friday":    [ {name:"Squat",sets:1,reps:3,pct:0.903,type:"Squat"},{name:"Squat",sets:1,reps:3,pct:0.942,type:"Squat"},{name:"OHP",sets:4,reps:8,pct:0.80,type:"OHP"} ],
    "Saturday":  [ {name:"Bench",sets:2,reps:2,pct:0.756,type:"Bench"},{name:"Bench",sets:1,reps:3,pct:0.8,type:"Bench"},{name:"Bench (Peak)",sets:1,reps:1,pct:0.989,type:"Bench"},{name:"Pause Deadlift",sets:1,reps:3,pct:0.682,type:"Deadlift"},{name:"Pause Deadlift",sets:1,reps:1,pct:0.840,type:"Deadlift"} ]
  },
  5: {
    "Monday":    [ {name:"Bench",sets:1,reps:2,pct:0.6,type:"Bench"},{name:"Bench",sets:2,reps:2,pct:0.7,type:"Bench"},{name:"Bench",sets:2,reps:2,pct:0.744,type:"Bench"},{name:"Deadlift",sets:1,reps:3,pct:0.732,type:"Deadlift"},{name:"Deadlift (Heavy)",sets:1,reps:3,pct:0.909,type:"Deadlift"},{name:"OHP (Recovery)",sets:3,reps:5,pct:0.60,type:"OHP"} ],
    "Wednesday": [ {name:"Squat (Peak)",sets:1,reps:2,pct:0.929,type:"Squat"},{name:"Squat (Max Effort)",sets:1,reps:2,pct:0.961,type:"Squat"},{name:"Bench",sets:1,reps:3,pct:0.889,type:"Bench"} ],
    "Friday":    [ {name:"Squat",sets:2,reps:2,pct:0.753,type:"Squat"},{name:"Squat",sets:4,reps:2,pct:0.799,type:"Squat"} ],
    "Saturday":  [ {name:"Bench",sets:2,reps:2,pct:0.756,type:"Bench"},{name:"Bench",sets:4,reps:2,pct:0.8,type:"Bench"},{name:"Pause Deadlift",sets:1,reps:3,pct:0.682,type:"Deadlift"},{name:"Pause Deadlift",sets:2,reps:3,pct:0.791,type:"Deadlift"} ]
  }
};

// Deload auto-generated from Week 1
andreData[6] = {};
Object.keys(andreData[1]).forEach(d => {
    andreData[6][d] = andreData[1][d]
        .filter(e => !(e.sets===5 && e.reps===5))
        .map(e => ({ ...e, name:`Tempo ${e.type}`, pct: e.pct*0.95 }));
});

// ==========================================
// SMART LOGIC — SINGLE SOURCE OF TRUTH
// FIX: was duplicated in render + openOverview
// ==========================================
function resolveSmartLift(lift, week) {
    let pct = lift.p, reps = lift.r;
    const w = week; // 1-based for Andre Map

    if (lift.n && lift.n.includes("Block Pulls (Smart)")) {
        if (w===1){pct=0.80;reps="4";}
        else if(w===2){pct=0.85;reps="3";}
        else if(w===3){pct=0.90;reps="3";}
        else if(w===4){pct=0.75;reps="1";}
        else{pct=0.70;reps="3";}
    }
    if (lift.n && lift.n.includes("Snatch Grip RDL (Smart)")) {
        if(w===1){pct=0.45;reps="10";}
        else if(w===2){pct=0.50;reps="8";}
        else if(w===3){pct=0.55;reps="6";}
        else{pct=0;reps="OFF";}
    }
    if (lift.n && lift.n.includes("Incline Barbell Bench (Smart)")) {
        if(w===1){pct=0.65;reps="8";}
        else if(w===2){pct=0.70;reps="6";}
        else if(w===3){pct=0.75;reps="5";}
        else{pct=0.80;reps="4";}
    }
    return { pct, reps };
}

const andreAccessories = {
  "Tuesday":   [ {name:"Close Grip Bench",sets:"3x4",weeks:[1,2,3,4,6],base:'Bench',basePct:0.72},{name:"Larsen Press",sets:"3x4",weeks:[1,2,3,4,6],base:'Bench',basePct:0.68},{name:"Tricep Pushdowns",sets:"3x12",weeks:[1,2,3,6]} ],
  "Wednesday": [ {name:"Leg Extensions",sets:"3x15",weeks:[1,2,3,4,6]},{name:"Pendulum Squat",sets:"3x8",weeks:[1,2,3,4,6]},{name:"Walking Lunges",sets:"3x12",weeks:[1,2,3,6]},{name:"Leg Press",sets:"4x10",weeks:[1,2,3,4,6]},{name:"GHR",sets:"3x8",weeks:[1,2,3,4,6]} ],
  "Thursday":  [ {name:"Pendlay Rows",sets:"4x6",weeks:[1,2,3,4,6]},{name:"Weighted Pull-ups",sets:"3x8",weeks:[1,2,3,4,6]},{name:"T-Bar Row (Chest Supp)",sets:"3x10",weeks:[1,2,3,4,6]},{name:"Face Pulls",sets:"4x15",weeks:[1,2,3,4,5,6]} ],
  "Friday":    [ {name:"DB Shoulder Press",sets:"4x10",weeks:[1,2,3,6]},{name:"DB Lateral Raise",sets:"4x15",weeks:[1,2,3,6]},{name:"Rear Delt Fly",sets:"4x15",weeks:[1,2,3,6]},{name:"Arnold Press",sets:"3x10",weeks:[1,2,3,6]} ],
  "Saturday":  [ {name:"RDL",sets:"4x6",weeks:[1,2,3,4,6],base:'Deadlift',basePct:0.55},{name:"Hamstring Curls",sets:"5x10",weeks:[1,2,3,4,6]},{name:"Leg Press (High Feet)",sets:"4x12",weeks:[1,2,3,6]},{name:"GHR",sets:"3x3",weeks:[1,2,3,4,5,6]} ]
};

const accessoryData = {
    squat: [{name:"ATG Squats",notes:"Full depth"},{name:"Pause Squat",notes:"Position"}],
    bench: [{name:"Larsen Press",notes:"No legs"},{name:"Spoto Press",notes:"Pause off chest"}],
    deadlift: [{name:"Seal Rows",notes:"Back saver"},{name:"RDL",notes:"Hinge"}]
};

const ptDatabase = {
    knees:     [{name:"Spanish Squats",rx:"3x45s",context:"Max quad tension."},{name:"TKE",rx:"3x20",context:"VMO Firing"}],
    back:      [{name:"McGill Big 3",rx:"3x10s",context:"Core stiffness."}],
    shoulders: [{name:"Dead Hangs",rx:"3x30s",context:"Decompress"}],
    hips:      [{name:"90/90 Hip Stretch",rx:"3x60s",context:"External rotation."}],
    elbows:    [{name:"Wrist Circles",rx:"3x30s",context:"Joint prep."}]
};

const smartLibrary = {
    "Squat: Weak Hole":     [{n:"Pin Squat (Low)",t:"Explosive Start",p:0.65,r:"3x3",s:"squat"},{n:"Pause Squat (3s)",t:"No Bounce",p:0.70,r:"3x4",s:"squat"},{n:"1.5 Rep Squat",t:"TUT",p:0.60,r:"3x5",s:"squat"},{n:"Box Squat",t:"Hip Power",p:0.75,r:"4x3",s:"squat"}],
    "Squat: Mechanics/Core":[{n:"Tempo Squat (5-3-0)",t:"Path Control",p:0.60,r:"3x5",s:"squat"},{n:"SSB Squat",t:"Upper Back",p:0.75,r:"3x6",s:"squat"},{n:"Front Squat",t:"Upright/Quad",p:0.65,r:"3x6",s:"squat"},{n:"Zombie Squat",t:"Bracing",p:0.50,r:"3x5",s:"squat"}],
    "Squat: Overload/CNS":  [{n:"Heavy Walkout",t:"CNS Priming",p:1.10,r:"3x15s",s:"squat"},{n:"Anderson Squat",t:"Tendon Power",p:0.85,r:"3x3",s:"squat"},{n:"Supramax Eccentric",t:"Decentric/Neg",p:1.05,r:"3x1",s:"squat"}],
    "Bench: Chest Strength":[{n:"Incline Barbell Bench (Smart)",t:"Upper Chest",p:0.65,r:"3x8",s:"bench",note:"W1:3x8@65%|W2:3x6@70%|W3:3x5@75%|W4:3x4@80%"},{n:"Long Pause Bench",t:"Start Power",p:0.75,r:"4x3",s:"bench"},{n:"Spoto Press",t:"Reversal",p:0.70,r:"3x5",s:"bench"},{n:"Dead Press",t:"Concentric Only",p:0.80,r:"5x1",s:"bench"},{n:"Larsen Press",t:"Stability",p:0.70,r:"3x6",s:"bench"},{n:"Weighted Dips",t:"Mass Builder",p:0.20,r:"3x8",s:"bench"}],
    "Bench: Lockout/Tri":   [{n:"Floor Press",t:"Lockout",p:0.80,r:"3x5",s:"bench"},{n:"Close Grip Bench",t:"Tricep Mass",p:0.75,r:"3x8",s:"bench"},{n:"Board Press",t:"Overload",p:1.05,r:"3x3",s:"bench"},{n:"Pin Lockouts",t:"Tendons",p:1.10,r:"3x5",s:"bench"}],
    "Bench: CNS/Overload":  [{n:"Heavy Hold",t:"CNS Lockout",p:1.15,r:"3x15s",s:"bench"},{n:"Bench Negative",t:"Decentric/Neg",p:1.05,r:"3x1",s:"bench"},{n:"Bamboo Bar",t:"Stabilizer Chaos",p:0.50,r:"3x15",s:"bench"}],
    "Chest: Isolation (BB)":[{n:"DB Flyes",t:"Stretch",p:0.20,r:"3x12",s:"bench"},{n:"Pec Deck",t:"Squeeze",p:0.25,r:"3x15",s:"bench"},{n:"Cable Crossover",t:"Inner Chest",p:0.15,r:"3x15",s:"bench"}],
    "Deadlift: Floor/Start":[{n:"Deficit Deadlift",t:"Floor Speed",p:0.70,r:"3x5",s:"deadlift"},{n:"Halting DL",t:"Start Mechanics",p:0.70,r:"3x5",s:"deadlift"},{n:"Paused DL",t:"Positioning",p:0.70,r:"3x3",s:"deadlift"},{n:"Snatch Grip RDL (Smart)",t:"Upper Back",p:0.40,r:"3x10",s:"deadlift",note:"W1:3x10@40-45%|W2:3x8@45-50%|W3:2x6@50-55%|W4-5:OFF"}],
    "Deadlift: Hips/Lockout":[{n:"Block Pulls (Smart)",t:"Lockout",p:0.80,r:"3x4",s:"deadlift",note:"3-4in Height. W1:3x4@80%|W2:3x3@85%|W3:2x3@90%|W4:2x1@75%"},{n:"Dimel Deadlift",t:"Glute Speed",p:0.40,r:"2x20",s:"deadlift"},{n:"Banded Deadlift",t:"Lockout Grind",p:0.50,r:"5x2",s:"deadlift"},{n:"Rack Pull Hold",t:"Grip/Traps",p:1.10,r:"3x10s",s:"deadlift"},{n:"Farmer's Walks",t:"Grip/Core",p:0.40,r:"3x30s",s:"deadlift"},{n:"Tempo Deadlift",t:"Eccentric",p:0.60,r:"3x3",s:"deadlift"}],
    "Glutes: Aesthetics":   [{n:"Hip Thrust",t:"Thickness (Max)",p:0.50,r:"4x10",s:"deadlift"},{n:"Cable Abduction",t:"Upper Shelf (Med)",p:0.10,r:"3x15",s:"squat"},{n:"Deficit Rev Lunge",t:"Tie-in/Lift",p:0.25,r:"3x10",s:"squat"},{n:"Glute Kickback",t:"Roundness",p:0.05,r:"3x20",s:"squat"},{n:"45 Deg Hypers",t:"Upper Glute",p:0,r:"3x20",s:"squat"}],
    "Legs: Quads/Hams":     [{n:"Leg Press",t:"Overall Mass",p:1.50,r:"4x10",s:"squat"},{n:"Hack Squat",t:"Outer Sweep",p:0.60,r:"3x8",s:"squat"},{n:"Walking Lunges",t:"Unilateral",p:0.25,r:"3x12",s:"squat"},{n:"Split Squat",t:"Separation",p:0.20,r:"3x10",s:"squat"},{n:"RDL (Barbell)",t:"Hamstring Hang",p:0.50,r:"3x8",s:"deadlift"},{n:"Stiff Leg DL",t:"Pure Stretch",p:0.45,r:"3x10",s:"deadlift"},{n:"Good Mornings",t:"Post. Chain",p:0.40,r:"3x8",s:"squat"},{n:"Glute Ham Raise",t:"Knee Flexion",p:0,r:"3xMax",s:"squat"}],
    "Back Thickness/Width": [{n:"Pendlay Row",t:"Explosive Back",p:0.60,r:"4x6",s:"deadlift"},{n:"Bent Over Row",t:"Gen Mass",p:0.55,r:"3x10",s:"deadlift"},{n:"Lat Pulldown",t:"Width",p:0.40,r:"3x12",s:"deadlift"},{n:"Seal Row",t:"Lats Iso",p:0.40,r:"4x10",s:"deadlift"}],
    "Shoulders (3 Heads)":  [{n:"OHP (Standing)",t:"Mass",p:0.80,r:"3x5",s:"ohp"},{n:"Seated DB Press",t:"Front/Side",p:0.35,r:"3x10",s:"ohp"},{n:"Egyptian Lateral",t:"Side Delt (Cap)",p:0.10,r:"4x15",s:"ohp"},{n:"Face Pulls",t:"Rear Delt/Health",p:0.15,r:"3x20",s:"bench"},{n:"Rear Delt Fly",t:"Rear Iso",p:0.10,r:"3x15",s:"bench"}],
    "Arms (Bi/Tri)":        [{n:"Rope Pushdown",t:"Tricep Horseshoe",p:0.25,r:"3x15",s:"bench"},{n:"Skullcrushers",t:"Tricep Mass",p:0.30,r:"3x10",s:"bench"},{n:"Incline Curl",t:"Bicep Peak",p:0.10,r:"3x12",s:"deadlift"},{n:"Hammer Curl",t:"Forearm/Width",p:0.15,r:"3x10",s:"deadlift"}],
    "Abs (Strength)":       [{n:"Weighted Planks",t:"Core",p:0,r:"3x45s",s:"squat"},{n:"Ab Wheel",t:"Stiffness",p:0,r:"3x10",s:"squat"},{n:"Hanging Leg Raise",t:"Hip Flexor",p:0,r:"3x12",s:"squat"},{n:"Cable Crunch",t:"Flexion",p:0.30,r:"4x15",s:"squat"},{n:"Pallof Press",t:"Anti-Rotation",p:0.10,r:"3x12",s:"deadlift"}]
};

// ==========================================
// STATE
// ==========================================
const state = {
    maxes: { Squat:0, Bench:0, Deadlift:0, OHP:0 },
    activeWeek: 1,
    unit: 'LBS',
    completed: {},
    accWeights: {},
    notes: {},
    settings: { bw: '' },
    customLifts: []
};
const inputs = {
    Squat:    document.getElementById('squatInput'),
    Bench:    document.getElementById('benchInput'),
    Deadlift: document.getElementById('deadliftInput'),
    OHP:      document.getElementById('ohpInput')
};
let modifiers = {};

// ==========================================
// UTILITIES
// ==========================================
function calculateDots(total, bw) {
    if(!bw||!total) return '-';
    let w=parseFloat(bw)/2.20462, t=parseFloat(total)/2.20462;
    const den=-0.000001093*Math.pow(w,4)+0.0007391293*Math.pow(w,3)-0.1918751679*Math.pow(w,2)+24.0900756*w-307.75076;
    return (t*(500/den)).toFixed(2);
}

function getPlates(w) {
    let t=parseFloat(w); if(isNaN(t)) return "";
    let s=(t-45)/2; if(s<=0) return "";
    const p=[45,35,25,10,5,2.5]; let h="";
    p.forEach(x=>{ while(s>=x){ s-=x; h+=`<span class="plate p${String(x).replace('.','_')}-lbs">${x}</span>`; } });
    return h;
}

function getLoad(pct, max) { return Math.round((max*pct)/5)*5; }

// ==========================================
// FIREBASE
// ==========================================
async function saveToCloud() {
    const user = auth.currentUser; if(!user) return;
    try {
        // FIX: now saves customLifts and modifiers both
        const payload = { ...state, modifiers };
        await setDoc(doc(db,"users",user.uid), payload, {merge:true});
        const total = (state.maxes.Squat||0)+(state.maxes.Bench||0)+(state.maxes.Deadlift||0);
        if(total > 0) {
            await setDoc(doc(db,"leaderboard",user.uid), {
                email: user.email||"Anonymous", total,
                squat:state.maxes.Squat||0, bench:state.maxes.Bench||0,
                deadlift:state.maxes.Deadlift||0, unit:state.unit
            });
        }
    } catch(e) { console.error('Cloud save error:',e); }
}

async function loadFromCloud(uid) {
    try {
        const snap = await getDoc(doc(db,"users",uid));
        if(snap.exists()) {
            const d = snap.data();
            if(d.maxes) {
                state.maxes.Squat    = d.maxes.Squat||d.maxes.squat||0;
                state.maxes.Bench    = d.maxes.Bench||d.maxes.bench||0;
                state.maxes.Deadlift = d.maxes.Deadlift||d.maxes.deadlift||0;
                state.maxes.OHP      = d.maxes.OHP||d.maxes.ohp||0;
            }
            if(d.activeWeek) state.activeWeek = d.activeWeek;
            if(d.completed)  state.completed  = d.completed;
            if(d.settings)   state.settings   = d.settings;
            if(d.accWeights) state.accWeights  = d.accWeights||{};
            if(d.modifiers)  modifiers         = d.modifiers||{};
            // FIX: load customLifts from cloud and sync to localStorage
            if(d.customLifts && d.customLifts.length > 0) {
                state.customLifts = d.customLifts;
                localStorage.setItem('andreMapCustomLifts', JSON.stringify(state.customLifts));
            }
            if(inputs.Squat)    inputs.Squat.value    = state.maxes.Squat||'';
            if(inputs.Bench)    inputs.Bench.value    = state.maxes.Bench||'';
            if(inputs.Deadlift) inputs.Deadlift.value = state.maxes.Deadlift||'';
            if(inputs.OHP)      inputs.OHP.value      = state.maxes.OHP||'';
            if(state.settings.bw && document.getElementById('bodyweight'))
                document.getElementById('bodyweight').value = state.settings.bw;
            render();
            toast('Data synced ✓');
        }
    } catch(e) { console.error('Cloud load error:',e); }
}

// ==========================================
// LIBRARY FUNCTIONS
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
    if(!exSel) return;
    exSel.innerHTML = "";
    smartLibrary[cat].forEach((item,idx) => {
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
    if(item && el) el.innerText = `Target: ${item.t} | Logic: ${Math.round(item.p*100)}% of ${item.s.toUpperCase()}${item.note?' | '+item.note:''}`;
}

function addCustomLift() {
    const cat = document.getElementById('libCategory').value;
    const idx = document.getElementById('libExercise').value;
    const day = parseInt(document.getElementById('libDay').value);
    const item = smartLibrary[cat][idx];
    state.customLifts.push({ ...item, dayIndex: day });
    // FIX: sync both localStorage AND Firebase
    localStorage.setItem('andreMapCustomLifts', JSON.stringify(state.customLifts));
    saveToCloud();
    render();
    document.getElementById('libraryModal').style.display = 'none';
    toast(`✅ Added ${item.n}`);
}

window.removeCustomLift = function(index) {
    if(!confirm("Remove this workout?")) return;
    state.customLifts.splice(index, 1);
    localStorage.setItem('andreMapCustomLifts', JSON.stringify(state.customLifts));
    saveToCloud();
    render();
    toast('Workout removed', 'info');
};

window.clearCustomLifts = function() {
    if(!confirm("Clear ALL custom workouts?")) return;
    state.customLifts = [];
    localStorage.setItem('andreMapCustomLifts', JSON.stringify([]));
    saveToCloud();
    render();
    const lm = document.getElementById('libraryModal');
    if(lm) lm.style.display = 'none';
    toast('All custom workouts cleared', 'info');
};

// ==========================================
// WEIGHT ADJUSTMENT
// ==========================================
window.adjustWeight = function(liftName, originalLoad) {
    let input = prompt(`Adjust load for ${liftName}.\nOriginal: ${originalLoad} lbs\n\nEnter weight you actually lifted (or 0 to reset):`);
    if(input === null) return;
    let actual = parseFloat(input);
    if(!actual || actual === 0) {
        delete modifiers[liftName];
        toast(`${liftName} reset to standard.`, 'info');
    } else {
        modifiers[liftName] = actual / originalLoad;
        toast(`${liftName} updated — scales by ${((actual/originalLoad)*100).toFixed(1)}%`);
    }
    state.modifiers = modifiers;
    saveToCloud();
    render();
};

// ==========================================
// RENDER
// ==========================================
function render() {
    const total = (state.maxes.Squat||0)+(state.maxes.Bench||0)+(state.maxes.Deadlift||0);
    const totalEl = document.getElementById('currentTotal');
    const dotsEl  = document.getElementById('currentDots');
    if(totalEl) totalEl.innerText = total;
    if(dotsEl)  dotsEl.innerText  = calculateDots(total, state.settings.bw);

    const dlReps     = parseInt((document.getElementById('dlRepInput') || {value:'3'}).value) || 3;
    const overloadPct = parseFloat((document.getElementById('overloadInput') || {value:'0'}).value) || 0;

    // Highlight active week nav button
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        if(b.innerText.includes(`Week ${state.activeWeek}`) || (state.activeWeek===6 && b.innerText.includes('Deload'))) b.classList.add('active');
    });

    const cont = document.getElementById('programContent');
    if(!cont) return;
    cont.innerHTML = '';

    let weekData = andreData[state.activeWeek] || andreData[1];
    if(!weekData) return;

    const dayMap = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

    Object.keys(weekData).forEach(day => {
        const exs = [...weekData[day]];
        const dayIdx = dayMap.indexOf(day);

        // Inject custom lifts — uses resolveSmartLift (single source)
        state.customLifts.forEach((c, originalIndex) => {
            if(c.dayIndex === dayIdx) {
                const { pct, reps } = resolveSmartLift(c, state.activeWeek);
                let finalPct = pct;
                if(state.activeWeek === 6) finalPct = finalPct * 0.90;
                if(finalPct > 0) {
                    exs.push({ name: c.n+'⭐', sets:"3", reps, pct:finalPct, type:{squat:'Squat',bench:'Bench',deadlift:'Deadlift',ohp:'OHP'}[c.s]||'Squat', isCustom:true, dbIndex:originalIndex });
                }
            }
        });

        const accList = andreAccessories[day];
        const showAcc = accList && (state.activeWeek < 5 || state.activeWeek === 6);

        const card = document.createElement('div');
        card.className = 'day-container';
        let head = `<div class="day-header"><span>${day}</span></div>`;
        let html = `<table>`;

        exs.forEach((m, i) => {
            const uid = `Andre-${state.activeWeek}-${day}-${i}`;
            const max = state.maxes[m.type] || 0;

            let setRepStr = "";
            if(m.isCustom) {
                setRepStr = String(m.reps).includes('x') ? m.reps : `${m.sets} x ${m.reps}`;
                setRepStr += ` <span onclick="removeCustomLift(${m.dbIndex})" style="cursor:pointer;color:red;margin-left:5px;">🗑️</span>`;
            } else {
                setRepStr = (typeof m.sets==='string') ? `${m.sets} Sets` : `${m.sets} x ${m.reps}`;
            }

            let adjustedPct = m.pct;
            let warningLabel = "";
            const isPauseDL = m.name === "Pause Deadlift";

            if(m.name==="Deadlift" || m.name==="Deadlift (Heavy)" || isPauseDL) {
                let currentReps = dlReps;
                if(isPauseDL && currentReps > 4) currentReps = 4;
                setRepStr = `${m.sets} x ${currentReps}`;
                if(currentReps===1){ adjustedPct+=0.06; warningLabel=` <span style='color:#ff4444;font-size:10px;'>⚠️ HIGH INTENSITY</span>`; }
                if(currentReps===2){ adjustedPct+=0.03; warningLabel=` <span style='color:#ff4444;font-size:10px;'>⚠️ HEAVY</span>`; }
                if(currentReps===4){ adjustedPct-=0.04; }
                if(currentReps===5){ adjustedPct-=0.08; }
            }

            if(overloadPct > 0) adjustedPct += overloadPct;

            let baseLoad  = (max > 0) ? Math.round((max*adjustedPct)/5)*5 : 0;
            let modifier  = modifiers[m.name] || 1.0;
            let finalLoad = Math.round((baseLoad*modifier)/5)*5;
            let loadDisplay = "", style = "", warn = "";

            if(baseLoad > 0) {
                if(modifier!==1.0 || overloadPct>0) { style="color:#ff4444;font-weight:bold;"; warn=" ⚠️"; }
                loadDisplay = `<span style="${style}">${finalLoad} LBS${warn}</span>${warningLabel} <span onclick="adjustWeight('${m.name}',${baseLoad})" style="cursor:pointer;font-size:12px;color:#aaa;margin-left:5px;">✎</span>`;
            } else {
                loadDisplay = Math.round(m.pct*100)+"%";
            }

            // Rest timer button per row
            const timerBtn = `<span onclick="startRestTimer(180)" title="3min rest" style="cursor:pointer;margin-left:4px;opacity:0.6;font-size:12px;">⏱</span>`;

            // RPE picker + PR button
            const liftId = `andre_w${state.activeWeek}_${day}_${m.name.replace(/\W/g,'_')}`;
            const rpePicker = buildRPEPicker(liftId);
            const isMainLift = ['Squat','Bench','Deadlift','Pause Squat','Pause Deadlift'].includes(m.name);
            const prBtn = (isMainLift && finalLoad > 0) ? `<span onclick="logPR('${m.name}',${finalLoad},${typeof m.reps==='number'?m.reps:1})" title="Log as PR" style="cursor:pointer;font-size:13px;margin-left:4px;opacity:0.7;">🏆</span>` : '';

            html += `<tr class="row-${m.type} ${state.completed[uid]?'completed':''}" onclick="toggleComplete('${uid}')">
                <td>${m.name}<br>${rpePicker}</td>
                <td>${setRepStr}</td>
                <td class="load-cell" onclick="event.stopPropagation();openPlateCalc('${finalLoad}')">${loadDisplay}${timerBtn}${prBtn}</td>
            </tr>`;
        });

        html += `</table>`;

        if(showAcc) {
            let accHtml = `<div class="acc-section"><div class="acc-toggle" onclick="toggleAcc('${day}')"><span>Accessories</span><span>▼</span></div><div class="acc-content ${state.accOpen && state.accOpen[day]?'open':''}">`;
            accList.filter(a => a.weeks.includes(state.activeWeek)).forEach(a => {
                const accId = `acc-${day}-${a.name}`;
                let recHtml = '';
                if(a.base && state.maxes[a.base] > 0) {
                    let w = state.activeWeek===6 ? 0 : state.activeWeek-1;
                    let load = Math.round((state.maxes[a.base]*(a.basePct+(w*0.025)))/5)*5;
                    recHtml = `<span class="acc-rec">Rec: ${load} LBS</span>`;
                }
                const val = state.accWeights[accId] || '';
                accHtml += `<div class="acc-row"><div class="acc-info"><span class="acc-name">${a.name}</span>${recHtml}</div><span class="acc-sets">${a.sets}</span><input class="acc-input" value="${val}" onchange="updateAccWeight('${accId}',this.value)"></div>`;
            });
            html += accHtml + `</div></div>`;
        }

        try {
            card.innerHTML = head + html;
        } catch(e) {
            console.error('Render error for day', day, e);
            card.innerHTML = head + '<p style="color:red;padding:10px;">Render error: ' + e.message + '</p>';
        }
        cont.appendChild(card);
    });
}

// ==========================================
// OVERVIEW MODAL — uses resolveSmartLift
// FIX: was duplicating Smart Logic inline
// ==========================================
window.openOverview = function() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '3000';

    const dayMap = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    let content = `<div class="modal-content large-modal" style="width:98%;max-width:1400px;height:90vh;overflow-y:auto;background:#1e1e1e;color:#fff;">
        <span onclick="this.parentElement.parentElement.remove()" style="float:right;cursor:pointer;font-size:24px;">&times;</span>
        <h2 style="color:#2196f3;text-align:center;">6-Week Program Overview</h2>
        <div class="overview-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;">`;

    for(let w=1; w<=6; w++) {
        let weekData = andreData[w];
        if(!weekData) continue;
        let weekHtml = `<div style="background:#222;border:1px solid #444;padding:10px;border-radius:5px;">
            <h3 style="color:${w===6?'#4caf50':'#FFD700'};border-bottom:1px solid #555;padding-bottom:5px;">Week ${w}${w===6?' (Deload)':''}</h3>`;

        dayMap.forEach((day, dayIdx) => {
            if(!weekData[day]) return;
            let dailyLifts = [...weekData[day]];

            // Use resolveSmartLift — no more inline duplication
            state.customLifts.forEach(c => {
                if(c.dayIndex === dayIdx) {
                    const { pct, reps } = resolveSmartLift(c, w);
                    let finalPct = pct;
                    if(w===6) finalPct = finalPct*0.90;
                    if(finalPct > 0) {
                        dailyLifts.push({ name:c.n+'⭐', sets:"3", reps, pct:finalPct, type:{squat:'Squat',bench:'Bench',deadlift:'Deadlift',ohp:'OHP'}[c.s]||'Squat' });
                    }
                }
            });

            if(dailyLifts.length > 0) {
                weekHtml += `<div style="margin-top:8px;"><div style="font-size:0.9em;font-weight:bold;color:#aaa;">${day}</div><ul style="list-style:none;padding:0;margin:0;font-size:0.85em;">`;
                dailyLifts.forEach(m => {
                    let max = state.maxes[m.type]||0;
                    let load = (max>0) ? Math.round((max*m.pct)/5)*5 : 0;
                    let mod = modifiers[m.name]||1.0;
                    if(mod!==1.0) load = Math.round((load*mod)/5)*5;
                    let setRep = String(m.reps).includes('x') ? m.reps : `${m.sets}x${m.reps}`;
                    weekHtml += `<li style="display:flex;justify-content:space-between;border-bottom:1px solid #333;padding:2px 0;">
                        <span>${m.name}</span>
                        <span style="color:#2196f3;">${setRep} @ ${load>0?load:Math.round(m.pct*100)+'%'}</span>
                    </li>`;
                });
                weekHtml += `</ul></div>`;
            }
        });

        weekHtml += `</div>`;
        content += weekHtml;
    }

    content += `</div></div>`;
    modal.innerHTML = content;
    document.body.appendChild(modal);
};

// ==========================================
// TOOLS
// ==========================================
window.openPlateCalc = function(w) {
    if(String(w).includes('%')) return;
    document.getElementById('plateModal').style.display='flex';
    const wt = parseFloat(w);
    document.getElementById('plateTarget').innerText = wt+" "+state.unit;
    document.getElementById('plateVisuals').innerHTML = getPlates(wt);
    document.getElementById('plateText').innerText = "Per Side (45lb Bar)";
};

window.openMeetPlanner = function() {
    const m = document.getElementById('meetModal');
    const g = document.getElementById('meetGrid');
    m.style.display='flex';
    let h='';
    ['Squat','Bench','Deadlift'].forEach(x => {
        const mx = state.maxes[x]||0;
        h+=`<div class="meet-col"><h4>${x}</h4>
            <div class="attempt-row"><span>Opener</span><span class="attempt-val">${getLoad(0.91,mx)}</span></div>
            <div class="attempt-row"><span>2nd</span><span class="attempt-val">${getLoad(0.96,mx)}</span></div>
            <div class="attempt-row"><span>3rd (PR)</span><span class="attempt-val pr">${getLoad(1.02,mx)}</span></div>
        </div>`;
    });
    g.innerHTML = h;
};

window.calculateOneRM = function() {
    const w = parseFloat(document.getElementById('calcWeight').value);
    const r = parseFloat(document.getElementById('calcReps').value);
    if(w&&r) document.getElementById('oneRmResult').innerText = "Est 1RM: "+Math.round(w*(1+0.0333*r))+" lbs";
};

window.calculateWarmup = function() {
    const t = parseFloat(document.getElementById('wuTarget').value);
    const style = document.getElementById('wuStyle').value;
    const lift  = document.getElementById('wuLiftType').value;
    if(!t) return;
    let protocol = [];
    if(style==='big')   protocol=[{p:0.45,r:'5'},{p:0.68,r:'3'},{p:0.84,r:'1'},{p:0.92,r:'1'},{p:0.97,r:'OPT'}];
    else if(style==='tight') protocol=[{p:0.40,r:'8'},{p:0.52,r:'5'},{p:0.64,r:'3'},{p:0.75,r:'2'},{p:0.84,r:'1'},{p:0.90,r:'1'},{p:0.94,r:'1'},{p:0.98,r:'OPT'}];
    else protocol=[{p:0.505,r:'5'},{p:0.608,r:'3'},{p:0.72,r:'2'},{p:0.834,r:'1'},{p:0.93,r:'1'},{p:0.97,r:'OPT'}];

    const cues = {
        squat:    ["Move fast, open hips.","Focus foot pressure.","Start bracing.","BELT ON.","Max pressure.","Final heavy feel."],
        bench:    ["Active lats.","Drive heels.","Tight arch.","Explode.","Comp pause.","Final heavy feel."],
        deadlift: ["Pull slack.","Chest up.","Squeeze lats.","BELT ON.","Comp speed.","Final heavy feel."]
    };
    let h='';
    protocol.forEach((s,i) => {
        let lb = Math.round((t*s.p)/5)*5;
        let showBelt = (lift==='squat'&&s.p>=0.70)||(lift==='deadlift'&&s.p>=0.83);
        let cue = (cues[lift]||cues.squat)[i] || "Focus on speed";
        let reps = s.r==='OPT' ? 'Optional' : s.r+' Reps';
        h+=`<div class="warmup-row"><div class="warmup-meta"><span class="warmup-weight">${lb} lbs ${showBelt?'<span class="belt-badge">BELT</span>':''}</span><span>${reps}</span></div><div class="warmup-cue">${cue}</div></div>`;
    });
    document.getElementById('warmupDisplay').innerHTML = h;
};

window.updatePtMovements = function() {
    const a = document.getElementById('ptArea').value;
    const m = document.getElementById('ptMovement');
    m.innerHTML='<option>Select...</option>';
    if(ptDatabase[a]) ptDatabase[a].forEach((x,i) => {
        let o=document.createElement('option'); o.value=i; o.innerText=x.name; m.appendChild(o);
    });
};

window.displayPtLogic = function() {
    const a=document.getElementById('ptArea').value;
    const i=document.getElementById('ptMovement').value;
    if(a && i!=='0') {
        const d=ptDatabase[a][i];
        if(d) {
            document.getElementById('ptDisplay').style.display='block';
            document.getElementById('ptDisplay').innerHTML=`<b>${d.name}</b><br>${d.context}<br><i>RX: ${d.rx}</i>`;
        }
    }
};

window.updateAccOptions = function() {
    const c=document.getElementById('accCategory').value;
    const m=document.getElementById('accExercise');
    m.innerHTML='';
    accessoryData[c].forEach(x=>{ let o=document.createElement('option'); o.value=x.name; o.innerText=x.name; m.appendChild(o); });
};

window.displayAccDetails = function() {
    const c=document.getElementById('accCategory').value;
    const n=document.getElementById('accExercise').value;
    const d=accessoryData[c].find(x=>x.name===n);
    if(d) { document.getElementById('accDetails').style.display='block'; document.getElementById('accDetails').innerText=d.notes; }
};

window.openTools = function() {
    document.getElementById('toolsModal').style.display='flex';
    if(state.settings.bw) document.getElementById('bodyweight').value=state.settings.bw;
};

window.openAuthModal = function() { document.getElementById('authModal').style.display='flex'; };
window.closeModal = function(id) { document.getElementById(id).style.display='none'; };
window.saveSettings = function() {
    state.settings.bw = document.getElementById('bodyweight').value;
    if(state.settings.bw) saveBodyweightEntry(state.settings.bw);
    saveToCloud();
    toast('Settings saved');
};
window.copyData = function() { toast('Data backed up to cloud ✓'); };
window.onclick = e => { if(e.target.classList.contains('modal')) e.target.style.display='none'; };

// ==========================================
// AUTH SETUP
// ==========================================
function setupAuthButtons() {
    const gBtn = document.getElementById('googleLoginBtn');
    if(gBtn) gBtn.addEventListener('click', () => signInWithPopup(auth, provider)
        .then(() => { document.getElementById('authModal').style.display='none'; toast('Logged in with Google!'); })
        .catch(e => toast('Google login failed: '+e.message,'error')));

    const eBtn = document.getElementById('emailLoginBtn');
    if(eBtn) eBtn.addEventListener('click', () => {
        const email = document.getElementById('emailInput').value;
        const pass  = document.getElementById('passInput').value;
        signInWithEmailAndPassword(auth, email, pass)
            .then(() => { document.getElementById('authModal').style.display='none'; toast('Logged in!'); })
            .catch(e => toast('Login failed: '+e.message,'error'));
    });

    const sBtn = document.getElementById('emailSignupBtn');
    if(sBtn) sBtn.addEventListener('click', () => {
        const email = document.getElementById('emailInput').value;
        const pass  = document.getElementById('passInput').value;
        if(!email || !pass) { toast('Enter email and password first','error'); return; }
        if(pass.length < 6) { toast('Password must be at least 6 characters','error'); return; }
        createUserWithEmailAndPassword(auth, email, pass)
            .then(() => { document.getElementById('authModal').style.display='none'; toast('Account created! Logged in.'); })
            .catch(e => toast('Sign up failed: '+e.message,'error'));
    });

    // Toggle between login/signup hint text
    const toggle = document.getElementById('authToggleHint');
    if(toggle) {
        toggle.addEventListener('click', () => {
            const loginBtn = document.getElementById('emailLoginBtn');
            const signupBtn = document.getElementById('emailSignupBtn');
            const isLogin = loginBtn.style.display !== 'none';
            loginBtn.style.display = isLogin ? 'none' : '';
            signupBtn.style.display = isLogin ? '' : 'none';
            toggle.innerHTML = isLogin
                ? "Already have an account? <span style='color:#2196f3;cursor:pointer;text-decoration:underline;' id='authToggleHint'>Log in</span>"
                : "Don't have an account? <span style='color:#2196f3;cursor:pointer;text-decoration:underline;' id='authToggleHint'>Sign up</span>";
            document.getElementById('authModalTitle').innerText = isLogin ? 'Create Account' : 'Login';
        });
    }
}

// ==========================================
// INIT
// ==========================================
function init() {
    applyTheme(currentTheme);
    injectRestTimer();

    // Load custom lifts from localStorage
    const storedLifts = localStorage.getItem('andreMapCustomLifts');
    if(storedLifts) state.customLifts = JSON.parse(storedLifts);

    initLibraryMenu();

    // Input listeners
    Object.keys(inputs).forEach(k => {
        if(inputs[k]) inputs[k].addEventListener('input', e => {
            state.maxes[k] = parseFloat(e.target.value) || 0;
            saveToCloud();
            render();
        });
    });

    const dlRep = document.getElementById('dlRepInput');
    if(dlRep) dlRep.addEventListener('change', () => render());
    const overload = document.getElementById('overloadInput');
    if(overload) overload.addEventListener('change', () => render());

    onAuthStateChanged(auth, user => {
        if(user) {
            loadFromCloud(user.uid);
            const btn = document.getElementById('login-btn');
            if(btn) {
                btn.innerText = 'Log Out';
                btn.onclick = () => {
                    signOut(auth);
                    localStorage.removeItem('andreMapCustomLifts');
                    location.reload();
                };
            }
        }
    });

    setupAuthButtons();

    window.setWeek       = n => { state.activeWeek=n; saveToCloud(); render(); };
    window.toggleComplete= id => { state.completed[id]=!state.completed[id]; saveToCloud(); render(); };
    window.toggleAcc     = day => { state.accOpen=state.accOpen||{}; state.accOpen[day]=!state.accOpen[day]; render(); };
    window.updateAccWeight=(id,val) => { state.accWeights[id]=val; saveToCloud(); };

    // Library listeners
    const libCat = document.getElementById('libCategory');
    const libEx  = document.getElementById('libExercise');
    const addBtn = document.getElementById('addLiftBtn');
    if(libCat) libCat.addEventListener('change', updateLibExercises);
    if(libEx)  libEx.addEventListener('change', updateLibDetails);
    if(addBtn) addBtn.addEventListener('click', addCustomLift);

    // Inject theme, PDF, BW chart buttons into header
    const actions = document.querySelector('.header-actions');
    if(actions) {
        const themeBtn = document.createElement('button');
        themeBtn.id = 'themeToggleBtn';
        themeBtn.className = 'action-btn';
        themeBtn.innerText = currentTheme==='dark' ? '☀️ Light' : '🌙 Dark';
        themeBtn.onclick = window.toggleTheme;
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

        const prBtn2 = document.createElement('button');
        prBtn2.className = 'action-btn';
        prBtn2.innerText = '🏆 PRs';
        prBtn2.onclick = window.openPRTracker;
        actions.insertBefore(prBtn2, actions.children[3]);
    }

    render();
}

init();

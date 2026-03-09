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
// AUTH GATE — Require login for generation tools
// ==========================================
function requireAuth(action) {
    const user = auth.currentUser;
    if (user) return true;
    const existing = document.getElementById('authGateOverlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'authGateOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:9800;display:flex;align-items:center;justify-content:center;';
    overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
    overlay.innerHTML = `
    <div style="background:#1c1c1e;border:0.5px solid #38383a;border-radius:20px;padding:32px 28px;width:90%;max-width:380px;text-align:center;">
        <div style="width:56px;height:56px;background:linear-gradient(135deg,#ff453a,#ff9f0a);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;">🔒</div>
        <h3 style="color:#fff;font-size:1.15rem;font-weight:700;margin:0 0 8px;">Sign in to continue</h3>
        <p style="color:#98989d;font-size:0.85rem;margin:0 0 24px;line-height:1.5;">${action || 'Create an account to unlock program generation, cloud sync, and the leaderboard.'}</p>
        <button onclick="document.getElementById('authGateOverlay').remove();openAuthModal();"
            style="width:100%;padding:14px;background:#ff453a;color:#fff;border:none;border-radius:12px;font-weight:700;font-size:0.95rem;cursor:pointer;">
            Sign In or Create Account
        </button>
        <button onclick="document.getElementById('authGateOverlay').remove()"
            style="width:100%;padding:12px;background:none;border:none;color:#98989d;font-size:0.85rem;cursor:pointer;margin-top:8px;">
            Maybe later
        </button>
    </div>`;
    document.body.appendChild(overlay);
    return false;
}
window.requireAuth = requireAuth;
window.openAuthModal = function() { document.getElementById('authModal').style.display='flex'; };

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
// REST TIMER — DRAGGABLE + MINIMIZABLE
// ==========================================
let restTimerInterval = null;
let restTimerSeconds = 0;
let restTimerMinimized = false;

function injectRestTimer() {
    if (document.getElementById('restTimerBar')) return;
    const bar = document.createElement('div');
    bar.id = 'restTimerBar';
    bar.style.cssText = `position:fixed;top:60px;right:15px;z-index:8000;background:var(--surface,#1e1e1e);border:1px solid var(--border,#333);border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.5);min-width:200px;cursor:grab;user-select:none;touch-action:none;`;
    bar.innerHTML = `
        <span id="restTimerDragHandle" style="font-size:20px;cursor:grab;">⏱</span>
        <span id="restTimerDisplay" style="font-size:1.4em;font-weight:900;color:#2196f3;min-width:50px;">0:00</span>
        <div id="restTimerBtns" style="display:flex;gap:6px;">
            <button onclick="startRestTimer(90)"  style="background:#2196f3;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-weight:bold;">90s</button>
            <button onclick="startRestTimer(180)" style="background:#ff9800;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-weight:bold;">3m</button>
            <button onclick="startRestTimer(300)" style="background:#9c27b0;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-weight:bold;">5m</button>
            <button onclick="stopRestTimer()"     style="background:#555;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;">✕</button>
        </div>
        <button onclick="toggleTimerMinimize()" id="timerMinBtn" style="background:none;border:none;color:var(--text-muted,#aaa);font-size:16px;cursor:pointer;padding:0 4px;line-height:1;">−</button>`;
    document.body.appendChild(bar);

    // Drag logic
    let isDragging = false, startX, startY, origX, origY;
    function onDown(e) {
        if(e.target.tagName === 'BUTTON') return;
        isDragging = true;
        bar.style.cursor = 'grabbing';
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX; startY = touch.clientY;
        const rect = bar.getBoundingClientRect();
        origX = rect.left; origY = rect.top;
        e.preventDefault();
    }
    function onMove(e) {
        if(!isDragging) return;
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - startX, dy = touch.clientY - startY;
        bar.style.left = (origX + dx) + 'px';
        bar.style.top = (origY + dy) + 'px';
        bar.style.right = 'auto';
    }
    function onUp() { isDragging = false; bar.style.cursor = 'grab'; }
    bar.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    bar.addEventListener('touchstart', onDown, {passive:false});
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('touchend', onUp);
}

window.toggleTimerMinimize = function() {
    restTimerMinimized = !restTimerMinimized;
    const btns = document.getElementById('restTimerBtns');
    const minBtn = document.getElementById('timerMinBtn');
    if(btns) btns.style.display = restTimerMinimized ? 'none' : 'flex';
    if(minBtn) minBtn.innerText = restTimerMinimized ? '+' : '−';
};

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
// RPE AUTO-REGULATION ENGINE
// Modes: OFF, set-to-set, session-to-session
// Stored in localStorage so it persists
// ==========================================
const AUTOREG_KEY = 'rpeAutoRegMode';

function getAutoRegMode() {
    return localStorage.getItem(AUTOREG_KEY) || 'off';
}

window.setAutoRegMode = function(mode) {
    localStorage.setItem(AUTOREG_KEY, mode);
    // Update toggle UI
    document.querySelectorAll('.autoreg-opt').forEach(btn => {
        btn.style.background = btn.dataset.mode === mode ? '#0a84ff' : '#2c2c2e';
        btn.style.color = btn.dataset.mode === mode ? '#fff' : '#98989d';
        btn.style.borderColor = btn.dataset.mode === mode ? '#0a84ff' : '#38383a';
    });
    const label = {off:'OFF',set:'Set-to-Set',session:'Session-to-Session'}[mode];
    toast(`Auto-Regulation: ${label}`, 'info');
    render();
};

// Calculate RPE-based weight adjustment
// Returns a multiplier (e.g. 0.95 = drop 5%)
function getAutoRegAdjustment(liftName, liftType, weekNum, dayName) {
    const mode = getAutoRegMode();
    if (mode === 'off') return 1.0;

    const log = getRPELog();
    const today = new Date().toLocaleDateString('en-US');

    if (mode === 'set') {
        // SET-TO-SET: Check if any lift of same type was logged today with high RPE
        // This simulates "you already did a tough set, drop the next one"
        if (!log[today]) return 1.0;
        const todayEntries = log[today];
        let maxRPE = 0;
        Object.keys(todayEntries).forEach(key => {
            // Match lifts in same day with same base type
            if (key.includes(liftName.replace(/\W/g,'_')) || key.includes(liftType)) {
                maxRPE = Math.max(maxRPE, todayEntries[key]);
            }
        });
        if (maxRPE >= 10) return 0.92;  // RPE 10 → drop 8%
        if (maxRPE >= 9.5) return 0.95; // RPE 9.5 → drop 5%
        if (maxRPE >= 9) return 0.97;   // RPE 9 → drop 3%
        return 1.0;
    }

    if (mode === 'session') {
        // SESSION-TO-SESSION: Check the PREVIOUS day's RPE for this lift type
        const dates = Object.keys(log).sort().reverse();
        for (const date of dates) {
            if (date === today) continue; // skip today
            const entries = log[date];
            let maxRPE = 0;
            Object.keys(entries).forEach(key => {
                const keyLower = key.toLowerCase();
                const typeLower = liftType.toLowerCase();
                if (keyLower.includes(typeLower) || keyLower.includes(liftName.replace(/\W/g,'_').toLowerCase())) {
                    maxRPE = Math.max(maxRPE, entries[key]);
                }
            });
            if (maxRPE > 0) {
                if (maxRPE >= 10) return 0.90;  // RPE 10 last session → drop 10%
                if (maxRPE >= 9.5) return 0.93; // RPE 9.5 → drop 7%
                if (maxRPE >= 9) return 0.95;   // RPE 9 → drop 5%
                if (maxRPE >= 8.5) return 0.98;  // RPE 8.5 → drop 2%
                return 1.0;
            }
        }
        return 1.0;
    }

    return 1.0;
}

// Build the auto-reg toggle UI (injected into header or control panel)
function buildAutoRegToggle() {
    const mode = getAutoRegMode();
    return `
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-size:0.7rem;color:#98989d;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Auto-Reg</span>
        <button class="autoreg-opt" data-mode="off" onclick="setAutoRegMode('off')"
            style="padding:5px 10px;border-radius:8px;border:0.5px solid ${mode==='off'?'#0a84ff':'#38383a'};background:${mode==='off'?'#0a84ff':'#2c2c2e'};color:${mode==='off'?'#fff':'#98989d'};font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit;">OFF</button>
        <button class="autoreg-opt" data-mode="set" onclick="setAutoRegMode('set')"
            style="padding:5px 10px;border-radius:8px;border:0.5px solid ${mode==='set'?'#0a84ff':'#38383a'};background:${mode==='set'?'#0a84ff':'#2c2c2e'};color:${mode==='set'?'#fff':'#98989d'};font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit;">Set-to-Set</button>
        <button class="autoreg-opt" data-mode="session" onclick="setAutoRegMode('session')"
            style="padding:5px 10px;border-radius:8px;border:0.5px solid ${mode==='session'?'#0a84ff':'#38383a'};background:${mode==='session'?'#0a84ff':'#2c2c2e'};color:${mode==='session'?'#fff':'#98989d'};font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit;">Session</button>
    </div>`;
}

// ==========================================
// MEET DAY WARM-UP ROOM CALCULATOR
// Full attempt selection + warm-up timing
// ==========================================
window.openMeetWarmupRoom = function() {
    const existing = document.getElementById('meetWarmupModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'meetWarmupModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:9500;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px 0;';
    modal.addEventListener('click', e => { if(e.target === modal) modal.remove(); });

    const lifts = ['Squat','Bench','Deadlift'];
    let liftTabs = lifts.map((l,i) =>
        `<button class="meet-lift-tab" data-lift="${l}" onclick="selectMeetLift('${l}')"
            style="flex:1;padding:12px;border-radius:10px;border:0.5px solid ${i===0?'#0a84ff':'#38383a'};background:${i===0?'rgba(10,132,255,0.15)':'#1c1c1e'};color:${i===0?'#0a84ff':'#98989d'};font-weight:800;font-size:0.95rem;cursor:pointer;font-family:inherit;">${l}</button>`
    ).join('');

    modal.innerHTML = `
    <div style="background:#1c1c1e;border:0.5px solid #38383a;border-radius:20px;padding:24px;width:95%;max-width:550px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <h2 style="margin:0;color:#ffd60a;font-size:1.2rem;font-weight:800;">🏆 Meet Day Warm-Up Room</h2>
            <button onclick="document.getElementById('meetWarmupModal').remove()" style="background:#2c2c2e;border:none;color:#98989d;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:18px;">${liftTabs}</div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px;">
            <div>
                <label style="font-size:0.65rem;color:#636366;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;display:block;margin-bottom:4px;">Opener</label>
                <input type="number" id="meetOpener" placeholder="0" style="width:100%;background:#000;border:0.5px solid #38383a;color:#fff;padding:10px;border-radius:10px;font-size:1rem;font-weight:700;text-align:center;" oninput="calcMeetWarmups()">
            </div>
            <div>
                <label style="font-size:0.65rem;color:#636366;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;display:block;margin-bottom:4px;">2nd Attempt</label>
                <input type="number" id="meet2nd" placeholder="0" style="width:100%;background:#000;border:0.5px solid #38383a;color:#fff;padding:10px;border-radius:10px;font-size:1rem;font-weight:700;text-align:center;">
            </div>
            <div>
                <label style="font-size:0.65rem;color:#636366;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;display:block;margin-bottom:4px;">3rd (PR)</label>
                <input type="number" id="meet3rd" placeholder="0" style="width:100%;background:#000;border:0.5px solid #38383a;color:#ffd60a;padding:10px;border-radius:10px;font-size:1rem;font-weight:700;text-align:center;">
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">
            <div>
                <label style="font-size:0.65rem;color:#636366;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;display:block;margin-bottom:4px;">Flight you're in</label>
                <select id="meetFlight" style="width:100%;background:#000;border:0.5px solid #38383a;color:#fff;padding:10px;border-radius:10px;font-size:0.9rem;" onchange="calcMeetWarmups()">
                    <option value="A">Flight A</option>
                    <option value="B">Flight B</option>
                    <option value="C">Flight C</option>
                </select>
            </div>
            <div>
                <label style="font-size:0.65rem;color:#636366;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;display:block;margin-bottom:4px;">Lifters in flight</label>
                <input type="number" id="meetLiftersInFlight" value="12" style="width:100%;background:#000;border:0.5px solid #38383a;color:#fff;padding:10px;border-radius:10px;font-size:0.9rem;text-align:center;" oninput="calcMeetWarmups()">
            </div>
        </div>

        <button onclick="calcMeetWarmups()" style="width:100%;padding:14px;background:#ffd60a;color:#000;border:none;border-radius:12px;font-weight:800;font-size:0.95rem;cursor:pointer;margin-bottom:16px;">Generate Warm-Up Timeline</button>

        <div id="meetWarmupResult" style="display:none;"></div>
    </div>`;

    document.body.appendChild(modal);

    // Auto-fill from maxes
    const defaultLift = 'Squat';
    const mx = state.maxes[defaultLift] || 0;
    if (mx > 0) {
        document.getElementById('meetOpener').value = Math.round((mx * 0.91) / 5) * 5;
        document.getElementById('meet2nd').value = Math.round((mx * 0.96) / 5) * 5;
        document.getElementById('meet3rd').value = Math.round((mx * 1.02) / 5) * 5;
    }
};

window.selectMeetLift = function(lift) {
    document.querySelectorAll('.meet-lift-tab').forEach(btn => {
        const isActive = btn.dataset.lift === lift;
        btn.style.borderColor = isActive ? '#0a84ff' : '#38383a';
        btn.style.background = isActive ? 'rgba(10,132,255,0.15)' : '#1c1c1e';
        btn.style.color = isActive ? '#0a84ff' : '#98989d';
    });
    const mx = state.maxes[lift] || 0;
    if (mx > 0) {
        document.getElementById('meetOpener').value = Math.round((mx * 0.91) / 5) * 5;
        document.getElementById('meet2nd').value = Math.round((mx * 0.96) / 5) * 5;
        document.getElementById('meet3rd').value = Math.round((mx * 1.02) / 5) * 5;
        calcMeetWarmups();
    }
};

window.calcMeetWarmups = function() {
    const opener = parseFloat(document.getElementById('meetOpener').value) || 0;
    if (opener <= 0) return;

    const liftersInFlight = parseInt(document.getElementById('meetLiftersInFlight').value) || 12;
    // Estimate ~1 minute per lifter per attempt
    const flightTime = liftersInFlight * 1; // minutes per round

    // Warm-up protocol: work backwards from opener
    const warmups = [
        { pct: 0.40, reps: 5, label: 'Bar feel', cue: 'Just move. Groove the pattern.' },
        { pct: 0.50, reps: 5, label: 'Light speed', cue: 'Fast and explosive. Build confidence.' },
        { pct: 0.65, reps: 3, label: 'Working up', cue: 'Start bracing harder. Belt on if using.' },
        { pct: 0.75, reps: 2, label: 'Moderate', cue: 'Match competition commands. Full pause.' },
        { pct: 0.84, reps: 1, label: 'Heavy single', cue: 'BELT ON. Full competition setup.' },
        { pct: 0.91, reps: 1, label: 'Last warm-up', cue: 'Move fast. This should feel smooth. Stop here.' }
    ];

    // Calculate weights rounded to 5
    const warmupSets = warmups.map(w => ({
        ...w,
        weight: Math.round((opener * w.pct / 0.91) / 5) * 5 // scale relative to opener
    }));

    // Timing: work backwards from "on deck" time
    // Assume you want last warm-up done ~3 attempts before your opener
    const attemptsBeforeOpener = 3;
    const minutesBeforeOpener = attemptsBeforeOpener * 1;
    const restBetweenSets = [2, 2, 3, 3, 4, 5]; // minutes rest after each warm-up

    let timeline = [];
    let timeOffset = 0;
    // Total warm-up time
    for (let i = warmupSets.length - 1; i >= 0; i--) {
        timeOffset += restBetweenSets[i] || 3;
    }
    timeOffset += minutesBeforeOpener;

    let currentOffset = timeOffset;
    warmupSets.forEach((set, i) => {
        timeline.push({
            ...set,
            minutesBefore: currentOffset,
        });
        currentOffset -= (restBetweenSets[i] || 3);
    });

    // Render
    const result = document.getElementById('meetWarmupResult');
    let html = `
    <div style="background:#000;border:0.5px solid #38383a;border-radius:14px;padding:16px;margin-bottom:12px;">
        <div style="font-size:0.65rem;color:#ffd60a;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:10px;">Warm-Up Timeline</div>
        <div style="font-size:0.75rem;color:#636366;margin-bottom:14px;">Start warming up ~${timeOffset} minutes before your opener is called.</div>`;

    timeline.forEach((set, i) => {
        const isLast = i === timeline.length - 1;
        html += `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;${i < timeline.length-1 ? 'border-bottom:0.5px solid #1c1c1e;' : ''}">
            <div style="min-width:40px;text-align:center;">
                <div style="font-size:0.65rem;color:#636366;">${set.minutesBefore}min</div>
                <div style="font-size:0.65rem;color:#636366;">before</div>
            </div>
            <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-weight:800;color:#fff;font-size:1rem;">${set.weight} lbs</span>
                    <span style="color:#0a84ff;font-size:0.85rem;font-weight:600;">x${set.reps}</span>
                </div>
                <div style="font-size:0.75rem;color:${isLast ? '#ffd60a' : '#98989d'};margin-top:2px;font-style:italic;">${set.cue}</div>
            </div>
            <div style="font-size:0.7rem;color:#48484a;min-width:55px;text-align:right;">${Math.round(set.pct / 0.91 * 100)}% opener</div>
        </div>`;
    });

    // Attempts section
    const second = parseFloat(document.getElementById('meet2nd').value) || 0;
    const third = parseFloat(document.getElementById('meet3rd').value) || 0;

    html += `</div>
    <div style="background:#000;border:0.5px solid #38383a;border-radius:14px;padding:16px;">
        <div style="font-size:0.65rem;color:#ff453a;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:10px;">Competition Attempts</div>
        <div style="display:flex;gap:10px;">
            <div style="flex:1;background:#1c1c1e;border-radius:10px;padding:14px;text-align:center;">
                <div style="font-size:0.65rem;color:#30d158;font-weight:600;margin-bottom:4px;">OPENER</div>
                <div style="font-size:1.3rem;font-weight:900;color:#fff;">${opener}</div>
            </div>
            <div style="flex:1;background:#1c1c1e;border-radius:10px;padding:14px;text-align:center;">
                <div style="font-size:0.65rem;color:#ff9f0a;font-weight:600;margin-bottom:4px;">2ND</div>
                <div style="font-size:1.3rem;font-weight:900;color:#fff;">${second || '—'}</div>
            </div>
            <div style="flex:1;background:#1c1c1e;border-radius:10px;padding:14px;text-align:center;">
                <div style="font-size:0.65rem;color:#ffd60a;font-weight:600;margin-bottom:4px;">3RD / PR</div>
                <div style="font-size:1.3rem;font-weight:900;color:#ffd60a;">${third || '—'}</div>
            </div>
        </div>
        <div style="margin-top:10px;font-size:0.75rem;color:#636366;text-align:center;">
            Projected Total: <strong style="color:#fff;">${opener + (second||0) + 0}</strong> lbs (with 2nd attempts)
        </div>
    </div>`;

    result.innerHTML = html;
    result.style.display = 'block';
};

// ==========================================
// MISSED LIFT DIAGNOSTIC — NEW FEATURE
// ==========================================
const missedLiftReasons = [
    { id:'injury',   label:'Small Injuries (Knee/Back)', pct:30, detail:'Neurological inhibition from patellar tendon or SI joint tweaks. Your brain shuts down power production to protect the joint, shifting your bar path out of the groove.' },
    { id:'program',  label:'Programming / Fatigue Mismanagement', pct:25, detail:'CNS fatigue masking fitness. If volume was pushed too hard last week or the taper was mismanaged, speed off the chest or out of the hole won\'t be there.' },
    { id:'equip',    label:'Change in Equipment', pct:15, detail:'Switching racks, bars, pads, or even new sleeves changes your brace, walkout timing, and stretch reflex. Calibration to a specific setup matters at elite weights.' },
    { id:'eating',   label:'Under Eating / Low Fuel', pct:15, detail:'Low glycogen = less ATP. Less food volume = weaker brace against the belt. CNS sluggishness makes the weight feel 20 lbs heavier before you even unrack.' },
    { id:'hormonal', label:'Hormonal / Cycle Factors (optional)', pct:10, detail:'Fluctuations in estrogen and progesterone can impact recovery, core temp, joint laxity, and how belts/sleeves fit — measurable variables on a max-effort day.' },
    { id:'schedule', label:'Schedule / Circadian Shift', pct:5, detail:'Circadian rhythm affects CNS readiness. A shift from your adapted training time leaves the body flat. Caffeine and environment can partially override this.' }
];

window.openMissedLiftDiag = function() {
    // Remove existing if open
    const existing = document.getElementById('missedLiftModal');
    if(existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'missedLiftModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:9500;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px 0;';
    modal.addEventListener('click', e => { if(e.target === modal) modal.remove(); });

    const currentWeek = state.activeWeek;
    const weekData = andreData[currentWeek];
    const dayMap = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const availableDays = weekData ? Object.keys(weekData) : dayMap;

    // Auto-detect current day
    const today = new Date().toLocaleDateString('en-US', {weekday:'long'});
    const defaultDay = availableDays.includes(today) ? today : availableDays[0];

    const reasonCheckboxes = missedLiftReasons.map(r => `
        <label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:#1a1a1a;border:1px solid #333;border-radius:8px;cursor:pointer;transition:all 0.2s;" 
               onmouseover="this.style.borderColor='#555'" onmouseout="this.style.borderColor=this.querySelector('input').checked?'#d32f2f':'#333'">
            <input type="checkbox" value="${r.id}" data-pct="${r.pct}" style="margin-top:3px;accent-color:#d32f2f;width:18px;height:18px;flex-shrink:0;"
                   onchange="updateMissedLiftCalc()">
            <div>
                <div style="font-weight:700;color:#fff;font-size:0.95em;">${r.label} <span style="color:#d32f2f;font-size:0.8em;">(−${r.pct}%)</span></div>
                <div style="color:#777;font-size:0.75em;margin-top:4px;line-height:1.4;">${r.detail}</div>
            </div>
        </label>
    `).join('');

    const dayOptions = availableDays.map(d => `<option value="${d}" ${d===defaultDay?'selected':''}>${d}</option>`).join('');

    modal.innerHTML = `
    <div style="background:#111;border:1px solid #333;border-radius:14px;padding:24px;width:95%;max-width:600px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <h2 style="margin:0;color:#d32f2f;font-size:1.3em;">❌ Missed Lift Diagnostic</h2>
            <button onclick="document.getElementById('missedLiftModal').remove()" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;">✕</button>
        </div>

        <div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:16px;margin-bottom:18px;">
            <div style="font-size:0.75em;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:bold;">Step 1 — What happened?</div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Athlete Name</label>
                    <input type="text" id="mld-name" placeholder="Full Name" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:10px;border-radius:6px;font-size:0.9em;">
                </div>
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Which Lift?</label>
                    <select id="mld-lift" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:10px;border-radius:6px;font-size:0.9em;">
                        <option value="Squat">Squat</option>
                        <option value="Bench">Bench</option>
                        <option value="Deadlift">Deadlift</option>
                    </select>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Weight Missed (lbs)</label>
                    <input type="number" id="mld-weight" placeholder="e.g. 455" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:10px;border-radius:6px;font-size:0.9em;" oninput="updateMissedLiftCalc()">
                </div>
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Session Day</label>
                    <select id="mld-day" style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:10px;border-radius:6px;font-size:0.9em;">
                        ${dayOptions}
                    </select>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Current Week</label>
                    <div style="background:#222;border:1px solid #444;padding:10px;border-radius:6px;color:#2196f3;font-weight:bold;font-size:0.9em;">
                        Week ${currentWeek}${currentWeek===6?' (Deload)':''}
                    </div>
                </div>
                <div>
                    <label style="font-size:0.7em;color:#666;display:block;margin-bottom:4px;">Program Max</label>
                    <div id="mld-programmax" style="background:#222;border:1px solid #444;padding:10px;border-radius:6px;color:#FFD700;font-weight:bold;font-size:0.9em;">—</div>
                </div>
            </div>
        </div>

        <div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:16px;margin-bottom:18px;">
            <div style="font-size:0.75em;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:bold;">Step 2 — Why did you miss? <span style="color:#555;">(select all that apply)</span></div>
            <div style="display:flex;flex-direction:column;gap:8px;" id="mld-reasons">
                ${reasonCheckboxes}
            </div>
        </div>

        <div id="mld-result" style="background:#0a1a0a;border:2px solid #2e7d32;border-radius:10px;padding:16px;margin-bottom:18px;display:none;">
            <div style="font-size:0.75em;color:#4caf50;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:bold;">Adjusted Weight Recommendation</div>
            <div style="display:flex;align-items:baseline;gap:12px;">
                <span id="mld-adjusted" style="font-size:2em;font-weight:900;color:#4caf50;">—</span>
                <span id="mld-reduction" style="color:#888;font-size:0.9em;"></span>
            </div>
            <div id="mld-breakdown" style="margin-top:10px;font-size:0.8em;color:#666;"></div>
        </div>

        <div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:16px;margin-bottom:18px;">
            <div style="font-size:0.75em;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:bold;">Step 3 — Notes <span style="color:#555;">(optional)</span></div>
            <textarea id="mld-notes" rows="3" placeholder="Any additional context — how the warm-ups felt, sleep quality, where in the lift you missed, etc."
                style="width:100%;background:#222;color:#fff;border:1px solid #444;padding:10px;border-radius:6px;font-size:0.85em;resize:vertical;font-family:inherit;"></textarea>
        </div>

        <button onclick="sendMissedLiftEmail()" style="width:100%;padding:16px;background:#d32f2f;color:#fff;border:none;border-radius:8px;font-weight:900;font-size:1em;cursor:pointer;text-transform:uppercase;letter-spacing:1px;transition:all 0.2s;"
                onmouseover="this.style.background='#f44336'" onmouseout="this.style.background='#d32f2f'">
            📧 Send Diagnostic Report to Coach
        </button>
        <p style="text-align:center;color:#555;font-size:0.7em;margin-top:8px;">Opens your email client with the full report pre-filled → andreze@me.com</p>
    </div>`;

    document.body.appendChild(modal);

    // Auto-fill program max based on selected lift
    const liftSel = document.getElementById('mld-lift');
    function updateProgramMax() {
        const lift = liftSel.value;
        const max = state.maxes[lift] || 0;
        document.getElementById('mld-programmax').innerText = max > 0 ? max + ' lbs' : 'Not set';
    }
    liftSel.addEventListener('change', () => { updateProgramMax(); updateMissedLiftCalc(); });
    updateProgramMax();
};

window.updateMissedLiftCalc = function() {
    const weight = parseFloat(document.getElementById('mld-weight').value) || 0;
    const resultBox = document.getElementById('mld-result');
    const adjustedEl = document.getElementById('mld-adjusted');
    const reductionEl = document.getElementById('mld-reduction');
    const breakdownEl = document.getElementById('mld-breakdown');

    const checked = document.querySelectorAll('#mld-reasons input[type="checkbox"]:checked');
    let totalPct = 0;
    let reasons = [];

    checked.forEach(cb => {
        const pct = parseInt(cb.dataset.pct);
        totalPct += pct;
        const r = missedLiftReasons.find(x => x.id === cb.value);
        reasons.push({ label: r.label, pct });

        // Visual feedback on checked labels
        cb.closest('label').style.borderColor = '#d32f2f';
    });

    // Reset unchecked borders
    document.querySelectorAll('#mld-reasons input[type="checkbox"]:not(:checked)').forEach(cb => {
        cb.closest('label').style.borderColor = '#333';
    });

    if(weight > 0 && totalPct > 0) {
        // Cap at 80% reduction
        const cappedPct = Math.min(totalPct, 80);
        const adjusted = Math.round((weight * (1 - cappedPct/100)) / 5) * 5;
        resultBox.style.display = 'block';
        adjustedEl.innerText = adjusted + ' lbs';
        reductionEl.innerText = `(−${cappedPct}% from ${weight} lbs)`;
        breakdownEl.innerHTML = reasons.map(r => `<span style="display:inline-block;background:#1a2a1a;border:1px solid #2e7d32;border-radius:4px;padding:2px 8px;margin:2px;">${r.label}: −${r.pct}%</span>`).join(' ');
    } else if(weight > 0 && totalPct === 0) {
        resultBox.style.display = 'block';
        adjustedEl.innerText = weight + ' lbs';
        reductionEl.innerText = '(no reasons selected — select at least one)';
        breakdownEl.innerHTML = '';
    } else {
        resultBox.style.display = 'none';
    }
};

window.sendMissedLiftEmail = function() {
    const name = document.getElementById('mld-name').value.trim();
    const lift = document.getElementById('mld-lift').value;
    const weight = document.getElementById('mld-weight').value;
    const day = document.getElementById('mld-day').value;
    const notes = document.getElementById('mld-notes').value.trim();
    const week = state.activeWeek;
    const programMax = state.maxes[lift] || 'N/A';

    if(!name) { toast('Enter the athlete name', 'error'); return; }
    if(!weight) { toast('Enter the weight that was missed', 'error'); return; }

    const checked = document.querySelectorAll('#mld-reasons input[type="checkbox"]:checked');
    if(checked.length === 0) { toast('Select at least one reason', 'error'); return; }

    let totalPct = 0;
    let reasonLines = [];
    checked.forEach(cb => {
        const pct = parseInt(cb.dataset.pct);
        totalPct += pct;
        const r = missedLiftReasons.find(x => x.id === cb.value);
        reasonLines.push(`• ${r.label} (−${r.pct}%)`);
    });

    const cappedPct = Math.min(totalPct, 80);
    const adjusted = Math.round((parseFloat(weight) * (1 - cappedPct/100)) / 5) * 5;

    // Build overview snapshot
    const weekData = andreData[week];
    let overviewLines = [];
    if(weekData) {
        Object.keys(weekData).forEach(d => {
            let dayLifts = weekData[d].map(m => {
                const max = state.maxes[m.type] || 0;
                const load = max > 0 ? Math.round((max * m.pct) / 5) * 5 : Math.round(m.pct * 100) + '%';
                return `  ${m.name}: ${m.sets}x${m.reps} @ ${load}${typeof load === 'number' ? ' lbs' : ''}`;
            }).join('\n');
            overviewLines.push(`${d}:\n${dayLifts}`);
        });
    }

    const today = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    const subject = `Missed Lift — ${name} — ${lift} — ${today}`;

    const body = `MISSED LIFT DIAGNOSTIC REPORT
================================
Date: ${today}
Athlete: ${name}
Program: Andre Map Wave
Week: ${week}${week===6?' (Deload)':''}
Session: ${day}

MISSED LIFT
-----------
Lift: ${lift}
Program Max: ${programMax} lbs
Weight Missed: ${weight} lbs

REASONS IDENTIFIED
------------------
${reasonLines.join('\n')}

Total Adjustment: −${cappedPct}%

RECOMMENDED WEIGHT FOR TODAY
-----------------------------
${adjusted} lbs (down from ${weight} lbs)

${notes ? `ATHLETE NOTES\n-------------\n${notes}\n` : ''}
WEEK ${week} PROGRAM OVERVIEW
${'='.repeat(30)}
${overviewLines.join('\n\n')}

================================
Sent from Andre's Calibrations
Missed Lift Diagnostic Tool`;

    const mailto = `mailto:andreze@me.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    toast('Opening email client…', 'info');

    // Close modal after a short delay
    setTimeout(() => {
        const m = document.getElementById('missedLiftModal');
        if(m) m.remove();
    }, 1000);
};

// ==========================================
// AUTO ACCESSORIES CALCULATOR — NEW FEATURE
// Conversational decision tree that diagnoses
// weak points and auto-populates periodized
// accessories into the program
// ==========================================
const accDecisionTree = {
    squat: {
        q1: { text:"Where does the bar slow down or stop?", options:[
            {label:"In the hole — I get stuck at the bottom", id:"hole"},
            {label:"Midway up — past the hole but before lockout", id:"mid"},
            {label:"At lockout — can't finish standing up", id:"lockout"},
            {label:"On the walkout or unrack — feels too heavy before I even squat", id:"walkout"}
        ]},
        hole: { q2: { text:"When you get stuck in the hole, what happens?", options:[
            {label:"My back rounds and I fold forward", id:"hole_fold"},
            {label:"My hips shoot up but the bar stays low", id:"hole_hips"},
            {label:"I just can't reverse direction — I sink and it dies", id:"hole_dead"}
        ]},
            hole_fold: { name:"Upper Back / Brace Weakness", accessories:[
                {n:"SSB Squat",s:"squat",pctByWeek:[0.65,0.70,0.73,0.68,0.55,0.50],repsByWeek:["3x6","3x5","3x4","2x3","2x2","2x5"]},
                {n:"Front Squat",s:"squat",pctByWeek:[0.55,0.60,0.63,0.58,0.50,0.45],repsByWeek:["3x6","3x5","3x4","2x3","2x2","2x5"]},
                {n:"Weighted Planks",s:"squat",pctByWeek:[0,0,0,0,0,0],repsByWeek:["3x45s","3x50s","3x55s","3x45s","3x30s","3x30s"]}
            ]},
            hole_hips: { name:"Quad Weakness", accessories:[
                {n:"Pause Squat (3s)",s:"squat",pctByWeek:[0.62,0.67,0.70,0.65,0.55,0.50],repsByWeek:["3x4","3x3","3x3","2x2","2x2","2x4"]},
                {n:"Belt Squat",s:"squat",pctByWeek:[0.55,0.60,0.63,0.58,0.50,0.45],repsByWeek:["3x10","3x8","3x6","3x5","2x5","3x8"]},
                {n:"Leg Press",s:"squat",pctByWeek:[1.20,1.30,1.40,1.20,1.00,0.90],repsByWeek:["4x10","4x8","3x8","3x6","2x6","3x10"]}
            ]},
            hole_dead: { name:"Reversal Strength", accessories:[
                {n:"Pin Squat (Low)",s:"squat",pctByWeek:[0.60,0.65,0.70,0.65,0.55,0.50],repsByWeek:["3x3","3x3","3x2","2x2","2x1","2x3"]},
                {n:"1.5 Rep Squat",s:"squat",pctByWeek:[0.55,0.58,0.60,0.55,0.50,0.45],repsByWeek:["3x5","3x4","3x3","2x3","2x2","3x5"]},
                {n:"Box Squat",s:"squat",pctByWeek:[0.65,0.70,0.73,0.68,0.58,0.55],repsByWeek:["4x3","3x3","3x2","2x2","2x1","3x3"]}
            ]}
        },
        mid: { name:"Midrange Grind", accessories:[
            {n:"Tempo Squat (5-3-0)",s:"squat",pctByWeek:[0.55,0.58,0.60,0.55,0.48,0.45],repsByWeek:["3x5","3x4","3x3","2x3","2x2","3x5"]},
            {n:"Anderson Squat",s:"squat",pctByWeek:[0.70,0.75,0.80,0.73,0.60,0.55],repsByWeek:["3x3","3x2","2x2","2x1","2x1","2x3"]},
            {n:"Pause Squat (3s)",s:"squat",pctByWeek:[0.62,0.67,0.70,0.65,0.55,0.50],repsByWeek:["3x4","3x3","3x3","2x2","2x2","2x4"]}
        ]},
        lockout: { name:"Lockout Weakness", accessories:[
            {n:"Anderson Squat",s:"squat",pctByWeek:[0.75,0.80,0.85,0.78,0.65,0.60],repsByWeek:["3x3","3x2","2x2","2x1","2x1","2x3"]},
            {n:"Heavy Walkout",s:"squat",pctByWeek:[1.05,1.08,1.10,1.05,0,0],repsByWeek:["3x15s","3x15s","2x15s","2x10s","OFF","OFF"]}
        ]},
        walkout: { name:"CNS / Confidence Issue", accessories:[
            {n:"Heavy Walkout",s:"squat",pctByWeek:[1.05,1.08,1.10,1.05,0,0],repsByWeek:["3x15s","3x15s","2x15s","2x10s","OFF","OFF"]},
            {n:"Supramax Eccentric",s:"squat",pctByWeek:[1.0,1.03,1.05,1.0,0,0],repsByWeek:["3x1","2x1","2x1","2x1","OFF","OFF"]}
        ]}
    },
    bench: {
        q1: { text:"Where does the bar slow down or stop?", options:[
            {label:"Off the chest — can't reverse it after the pause", id:"chest"},
            {label:"Midrange — gets past the chest but stalls halfway up", id:"mid"},
            {label:"At lockout — almost there but can't finish", id:"lockout"},
            {label:"Unrack feels shaky — unstable before I even start", id:"unrack"}
        ]},
        chest: { q2: { text:"When it stalls off the chest, what do you feel?", options:[
            {label:"The bar sinks into me — I lose tightness", id:"chest_sink"},
            {label:"I can push but there's no speed — it's just slow", id:"chest_slow"},
            {label:"My shoulders feel weak — like they can't initiate the press", id:"chest_shoulders"}
        ]},
            chest_sink: { name:"Arch / Tightness Issue", accessories:[
                {n:"Long Pause Bench",s:"bench",pctByWeek:[0.65,0.70,0.73,0.68,0.58,0.55],repsByWeek:["4x3","3x3","3x2","2x2","2x1","3x3"]},
                {n:"Larsen Press",s:"bench",pctByWeek:[0.60,0.65,0.68,0.63,0.55,0.50],repsByWeek:["3x6","3x5","3x4","2x3","2x2","3x5"]},
                {n:"Spoto Press",s:"bench",pctByWeek:[0.62,0.67,0.70,0.65,0.55,0.50],repsByWeek:["3x5","3x4","3x3","2x3","2x2","3x4"]}
            ]},
            chest_slow: { name:"Starting Strength / Speed", accessories:[
                {n:"Dead Press",s:"bench",pctByWeek:[0.65,0.70,0.75,0.70,0.60,0.55],repsByWeek:["5x1","4x1","3x1","3x1","2x1","3x1"]},
                {n:"Long Pause Bench",s:"bench",pctByWeek:[0.65,0.70,0.73,0.68,0.58,0.55],repsByWeek:["4x3","3x3","3x2","2x2","2x1","3x3"]},
                {n:"Weighted Dips",s:"bench",pctByWeek:[0.20,0.23,0.25,0.20,0.15,0.15],repsByWeek:["3x8","3x6","3x5","2x5","2x3","3x8"]}
            ]},
            chest_shoulders: { name:"Anterior Delt Weakness", accessories:[
                {n:"Incline Barbell Bench (Smart)",s:"bench",pctByWeek:[0.60,0.65,0.68,0.63,0.55,0.50],repsByWeek:["3x8","3x6","3x5","3x4","2x3","3x6"]},
                {n:"Seated DB Press",s:"ohp",pctByWeek:[0.30,0.33,0.35,0.30,0.25,0.25],repsByWeek:["3x10","3x8","3x6","2x6","2x5","3x10"]}
            ]}
        },
        mid: { name:"Midrange Sticking Point", accessories:[
            {n:"Spoto Press",s:"bench",pctByWeek:[0.65,0.70,0.73,0.68,0.58,0.55],repsByWeek:["3x5","3x4","3x3","2x3","2x2","3x4"]},
            {n:"Floor Press",s:"bench",pctByWeek:[0.70,0.75,0.78,0.73,0.63,0.58],repsByWeek:["3x5","3x4","3x3","2x3","2x2","3x4"]},
            {n:"Close Grip Bench",s:"bench",pctByWeek:[0.65,0.68,0.72,0.67,0.58,0.55],repsByWeek:["3x8","3x6","3x5","2x5","2x3","3x6"]}
        ]},
        lockout: { name:"Tricep / Lockout Weakness", accessories:[
            {n:"Floor Press",s:"bench",pctByWeek:[0.72,0.77,0.80,0.75,0.65,0.60],repsByWeek:["3x5","3x4","3x3","2x3","2x2","3x4"]},
            {n:"Close Grip Bench",s:"bench",pctByWeek:[0.68,0.72,0.75,0.70,0.60,0.55],repsByWeek:["3x8","3x6","3x5","2x5","2x3","3x6"]},
            {n:"Pin Lockouts",s:"bench",pctByWeek:[0.90,0.95,1.00,0.90,0,0],repsByWeek:["3x5","3x3","2x3","2x2","OFF","OFF"]}
        ]},
        unrack: { name:"Stability / Lat Engagement", accessories:[
            {n:"Bamboo Bar",s:"bench",pctByWeek:[0.40,0.43,0.45,0.40,0.35,0.35],repsByWeek:["3x15","3x12","3x10","2x10","2x8","3x12"]},
            {n:"Larsen Press",s:"bench",pctByWeek:[0.60,0.65,0.68,0.63,0.55,0.50],repsByWeek:["3x6","3x5","3x4","2x3","2x2","3x5"]},
            {n:"Heavy Hold",s:"bench",pctByWeek:[1.05,1.10,1.15,1.05,0,0],repsByWeek:["3x15s","3x15s","2x15s","2x10s","OFF","OFF"]}
        ]}
    },
    deadlift: {
        q1: { text:"Where does the bar slow down or stop?", options:[
            {label:"Off the floor — it barely moves or breaks really slowly", id:"floor"},
            {label:"Around the knees — it clears the floor but stalls at knee height", id:"knees"},
            {label:"At lockout — I can't finish the hip extension", id:"lockout"},
            {label:"Grip fails before the lift does", id:"grip"}
        ]},
        floor: { q2: { text:"When it's slow off the floor, what happens to your body?", options:[
            {label:"My back rounds immediately — I can't keep position", id:"floor_round"},
            {label:"My hips shoot up and it turns into a stiff-leg pull", id:"floor_hips"},
            {label:"I just can't break it — it feels glued to the floor", id:"floor_stuck"}
        ]},
            floor_round: { name:"Upper Back / Lat Weakness", accessories:[
                {n:"Paused DL",s:"deadlift",pctByWeek:[0.60,0.65,0.70,0.65,0.55,0.50],repsByWeek:["3x3","3x3","3x2","2x2","2x1","2x3"]},
                {n:"Seal Row",s:"deadlift",pctByWeek:[0.35,0.38,0.40,0.35,0.30,0.30],repsByWeek:["4x10","4x8","3x8","3x6","2x6","3x10"]},
                {n:"Pendlay Row",s:"deadlift",pctByWeek:[0.50,0.55,0.58,0.53,0.45,0.42],repsByWeek:["4x6","4x5","3x5","3x3","2x3","3x6"]}
            ]},
            floor_hips: { name:"Quad Weakness off Floor", accessories:[
                {n:"Deficit Deadlift",s:"deadlift",pctByWeek:[0.60,0.65,0.68,0.63,0.55,0.50],repsByWeek:["3x5","3x4","3x3","2x3","2x2","3x5"]},
                {n:"Front Squat",s:"squat",pctByWeek:[0.55,0.60,0.63,0.58,0.50,0.45],repsByWeek:["3x6","3x5","3x4","2x3","2x2","2x5"]},
                {n:"Leg Press",s:"squat",pctByWeek:[1.20,1.30,1.40,1.20,1.00,0.90],repsByWeek:["4x10","4x8","3x8","3x6","2x6","3x10"]}
            ]},
            floor_stuck: { name:"Raw Floor Strength", accessories:[
                {n:"Deficit Deadlift",s:"deadlift",pctByWeek:[0.60,0.65,0.68,0.63,0.55,0.50],repsByWeek:["3x5","3x4","3x3","2x3","2x2","3x5"]},
                {n:"Halting DL",s:"deadlift",pctByWeek:[0.60,0.65,0.68,0.63,0.55,0.50],repsByWeek:["3x5","3x4","3x3","2x3","2x2","3x5"]},
                {n:"Paused DL",s:"deadlift",pctByWeek:[0.60,0.65,0.70,0.65,0.55,0.50],repsByWeek:["3x3","3x3","3x2","2x2","2x1","2x3"]}
            ]}
        },
        knees: { name:"Knee Pass / Positional Weakness", accessories:[
            {n:"Paused DL",s:"deadlift",pctByWeek:[0.62,0.67,0.72,0.67,0.57,0.52],repsByWeek:["3x3","3x3","3x2","2x2","2x1","2x3"]},
            {n:"Halting DL",s:"deadlift",pctByWeek:[0.62,0.67,0.70,0.65,0.55,0.50],repsByWeek:["3x5","3x4","3x3","2x3","2x2","3x5"]},
            {n:"Pendlay Row",s:"deadlift",pctByWeek:[0.50,0.55,0.58,0.53,0.45,0.42],repsByWeek:["4x6","4x5","3x5","3x3","2x3","3x6"]}
        ]},
        lockout: { name:"Hip Extension / Glute Weakness", accessories:[
            {n:"Block Pulls (Smart)",s:"deadlift",pctByWeek:[0.75,0.80,0.85,0.78,0.65,0.60],repsByWeek:["3x4","3x3","2x3","2x1","2x1","2x4"]},
            {n:"Hip Thrust",s:"deadlift",pctByWeek:[0.45,0.50,0.53,0.48,0.40,0.38],repsByWeek:["4x10","4x8","3x8","3x6","2x6","3x10"]},
            {n:"Banded Deadlift",s:"deadlift",pctByWeek:[0.45,0.48,0.50,0.45,0.40,0.38],repsByWeek:["5x2","5x2","4x2","3x2","2x2","4x2"]}
        ]},
        grip: { name:"Grip Strength Deficit", accessories:[
            {n:"Rack Pull Hold",s:"deadlift",pctByWeek:[1.00,1.05,1.10,1.00,0.90,0.85],repsByWeek:["3x10s","3x12s","3x15s","2x10s","2x8s","3x10s"]},
            {n:"Farmer's Walks",s:"deadlift",pctByWeek:[0.35,0.38,0.40,0.35,0.30,0.30],repsByWeek:["3x30s","3x35s","3x40s","2x30s","2x25s","3x30s"]},
            {n:"Tempo Deadlift",s:"deadlift",pctByWeek:[0.55,0.58,0.60,0.55,0.48,0.45],repsByWeek:["3x3","3x3","3x2","2x2","2x1","3x3"]}
        ]}
    }
};

// Day mapping for accessory placement
const accDayPlacement = {
    squat: 2,     // Wednesday (squat day)
    bench: 1,     // Tuesday (bench day)
    deadlift: 5,  // Saturday (deadlift day)
    ohp: 4        // Friday (shoulder day)
};

window.openAutoAccessories = function() {
    const existing = document.getElementById('autoAccModal');
    if(existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'autoAccModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:9500;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px 0;';
    modal.addEventListener('click', e => { if(e.target === modal) modal.remove(); });

    modal.innerHTML = `
    <div id="autoAccInner" style="background:#111;border:1px solid var(--border,#333);border-radius:14px;padding:24px;width:95%;max-width:550px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <h2 style="margin:0;color:#4caf50;font-size:1.3em;">🔧 Weak Point Rx</h2>
            <button onclick="document.getElementById('autoAccModal').remove()" style="background:none;border:none;color:var(--text,#fff);font-size:24px;cursor:pointer;">✕</button>
        </div>
        <p style="color:var(--text-muted,#aaa);font-size:0.85em;margin-bottom:18px;">Tell me what's giving you trouble and I'll prescribe the right accessories, auto-loaded into your program with periodized weights that taper for peak weeks.</p>
        <div style="margin-bottom:18px;">
            <div style="font-size:0.75em;color:var(--text-muted,#888);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:bold;">Which lift needs work?</div>
            <div style="display:flex;gap:8px;">
                <button onclick="startAccTree('squat')" class="acc-lift-btn" style="flex:1;padding:14px;border-radius:8px;border:2px solid #4caf50;background:rgba(76,175,80,0.1);color:#4caf50;font-weight:900;font-size:1em;cursor:pointer;">Squat</button>
                <button onclick="startAccTree('bench')" class="acc-lift-btn" style="flex:1;padding:14px;border-radius:8px;border:2px solid #2196f3;background:rgba(33,150,243,0.1);color:#2196f3;font-weight:900;font-size:1em;cursor:pointer;">Bench</button>
                <button onclick="startAccTree('deadlift')" class="acc-lift-btn" style="flex:1;padding:14px;border-radius:8px;border:2px solid #9c27b0;background:rgba(156,39,176,0.1);color:#9c27b0;font-weight:900;font-size:1em;cursor:pointer;">Deadlift</button>
            </div>
        </div>
        <div id="accTreeFlow"></div>
    </div>`;
    document.body.appendChild(modal);
};

let accTreeState = { lift: null, path: [] };

window.startAccTree = function(lift) {
    accTreeState = { lift, path: [] };
    const tree = accDecisionTree[lift];
    renderAccQuestion(tree.q1, lift);
};

function renderAccQuestion(q, context) {
    const flow = document.getElementById('accTreeFlow');
    flow.innerHTML = `
        <div style="background:#1a1a1a;border:1px solid var(--border,#333);border-radius:10px;padding:16px;animation:fadeIn 0.3s;">
            <div style="font-size:1em;font-weight:700;color:var(--text,#fff);margin-bottom:14px;line-height:1.4;">${q.text}</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${q.options.map(o => `
                    <button onclick="handleAccAnswer('${accTreeState.lift}','${o.id}')"
                        style="text-align:left;padding:14px;background:var(--surface2,#222);border:1px solid var(--border,#333);border-radius:8px;color:var(--text,#fff);cursor:pointer;font-size:0.9em;transition:all 0.2s;line-height:1.3;"
                        onmouseover="this.style.borderColor='#4caf50';this.style.background='rgba(76,175,80,0.08)'"
                        onmouseout="this.style.borderColor='var(--border,#333)';this.style.background='var(--surface2,#222)'">${o.label}</button>
                `).join('')}
            </div>
        </div>`;
}

window.handleAccAnswer = function(lift, answerId) {
    accTreeState.path.push(answerId);
    const tree = accDecisionTree[lift];

    // Navigate the tree
    let node;
    if(tree[answerId]) {
        node = tree[answerId];
    } else {
        // Check nested (e.g. tree.hole.hole_fold)
        for(const key of Object.keys(tree)) {
            if(typeof tree[key] === 'object' && tree[key][answerId]) {
                node = tree[key][answerId];
                break;
            }
        }
    }

    if(!node) { toast('Something went wrong — try again','error'); return; }

    // If this node has a q2, show it
    if(node.q2) {
        renderAccQuestion(node.q2, lift);
        return;
    }

    // If this node has accessories, show the prescription
    if(node.accessories || node.name) {
        renderAccPrescription(node, lift);
    }
};

function renderAccPrescription(node, lift) {
    const flow = document.getElementById('accTreeFlow');
    const liftMax = lift === 'squat' ? state.maxes.Squat : lift === 'bench' ? state.maxes.Bench : state.maxes.Deadlift;
    const liftColors = {squat:'#4caf50',bench:'#2196f3',deadlift:'#9c27b0'};
    const color = liftColors[lift] || '#4caf50';

    let accHtml = node.accessories.map((acc, idx) => {
        const accMax = state.maxes[{squat:'Squat',bench:'Bench',deadlift:'Deadlift',ohp:'OHP'}[acc.s]] || 0;
        const weekPreviews = acc.pctByWeek.map((pct, w) => {
            if(pct === 0) return `<span style="color:#555;">W${w+1}: OFF</span>`;
            const load = accMax > 0 ? Math.round((accMax * pct)/5)*5 + ' lbs' : Math.round(pct*100)+'%';
            return `<span style="color:${w>=4?'#4caf50':w>=3?'#ff9800':'var(--text,#fff)'};">W${w+1}: ${acc.repsByWeek[w]} @ ${load}</span>`;
        }).join('<br>');

        return `
        <div style="background:var(--surface2,#222);border:1px solid var(--border,#333);border-radius:8px;padding:14px;${idx===0?'':'margin-top:8px;'}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-weight:900;color:var(--text,#fff);">${acc.n}</span>
                    <span style="color:var(--text-muted,#888);font-size:0.8em;margin-left:8px;">Based on ${acc.s.toUpperCase()} max</span>
                </div>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                    <input type="checkbox" checked data-acc-idx="${idx}" class="acc-toggle-cb" style="accent-color:${color};width:18px;height:18px;">
                    <span style="color:var(--text-muted,#888);font-size:0.75em;">Add</span>
                </label>
            </div>
            <div style="margin-top:8px;font-size:0.8em;line-height:1.8;color:var(--text-muted,#aaa);">${weekPreviews}</div>
        </div>`;
    }).join('');

    flow.innerHTML = `
    <div style="animation:fadeIn 0.3s;">
        <div style="background:rgba(76,175,80,0.08);border:2px solid ${color};border-radius:10px;padding:16px;margin-bottom:14px;">
            <div style="font-size:0.75em;color:${color};text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Diagnosis</div>
            <div style="font-size:1.2em;font-weight:900;color:var(--text,#fff);margin-top:4px;">${node.name}</div>
            <div style="font-size:0.8em;color:var(--text-muted,#aaa);margin-top:6px;">Weeks 1-3 build volume, Week 4 transitions, Weeks 5-6 taper for peak performance.</div>
        </div>
        <div style="font-size:0.75em;color:var(--text-muted,#888);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:bold;">Prescribed Accessories (toggle any off)</div>
        ${accHtml}
        <button onclick="applyAccPrescription('${lift}')"
            style="width:100%;padding:14px;background:${color};color:#fff;border:none;border-radius:8px;font-weight:900;font-size:1em;cursor:pointer;margin-top:16px;text-transform:uppercase;letter-spacing:1px;">
            Add to Program
        </button>
        <button onclick="startAccTree('${lift}')"
            style="width:100%;padding:10px;background:none;border:1px solid var(--border,#333);color:var(--text-muted,#aaa);border-radius:8px;cursor:pointer;margin-top:8px;font-size:0.85em;">
            ← Start Over
        </button>
    </div>`;

    // Store current prescription for apply
    flow.dataset.prescription = JSON.stringify(node.accessories);
}

window.applyAccPrescription = function(lift) {
    const flow = document.getElementById('accTreeFlow');
    const accessories = JSON.parse(flow.dataset.prescription || '[]');
    const checkboxes = flow.querySelectorAll('.acc-toggle-cb');
    let added = 0;

    checkboxes.forEach((cb, idx) => {
        if(!cb.checked) return;
        const acc = accessories[idx];
        if(!acc) return;

        // Add as custom lift with periodized data
        const dayIdx = accDayPlacement[acc.s] || 2;
        state.customLifts.push({
            n: acc.n + ' 🔧',
            t: acc.n,
            p: acc.pctByWeek[0],
            r: acc.repsByWeek[0],
            s: acc.s,
            dayIndex: dayIdx,
            isAutoAcc: true,
            pctByWeek: acc.pctByWeek,
            repsByWeek: acc.repsByWeek
        });
        added++;
    });

    if(added > 0) {
        localStorage.setItem('andreMapCustomLifts', JSON.stringify(state.customLifts));
        saveToCloud();
        render();
        toast(`🔧 ${added} accessor${added===1?'y':'ies'} added to program!`);
    }

    document.getElementById('autoAccModal').remove();
};

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
function calculateDots(total, bw, sex) {
    if(!bw||!total) return '-';
    let w=parseFloat(bw)/2.20462, t=parseFloat(total)/2.20462;
    sex = sex || state.settings.sex || 'male';
    let den;
    if(sex === 'female') {
        den = -0.0000010706*Math.pow(w,4)+0.0005158568*Math.pow(w,3)-0.1126655495*Math.pow(w,2)+13.6175032*w-57.96288;
    } else {
        den = -0.000001093*Math.pow(w,4)+0.0007391293*Math.pow(w,3)-0.1918751679*Math.pow(w,2)+24.0900756*w-307.75076;
    }
    return (t*(500/den)).toFixed(2);
}

window.openDotsCalc = function() {
    const existing = document.getElementById('dotsCalcModal');
    if(existing) existing.remove();
    const total = (state.maxes.Squat||0)+(state.maxes.Bench||0)+(state.maxes.Deadlift||0);
    const bw = state.settings.bw || '';
    const sex = state.settings.sex || 'male';
    const modal = document.createElement('div');
    modal.id = 'dotsCalcModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:9000;display:flex;align-items:center;justify-content:center;';
    modal.addEventListener('click', e => { if(e.target === modal) modal.remove(); });
    modal.innerHTML = `<div style="background:var(--surface,#1e1e1e);border:1px solid var(--border,#333);border-radius:14px;padding:24px;width:90%;max-width:380px;color:var(--text,#fff);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 style="margin:0;color:#FFD700;">DOTS Calculator</h3>
            <button onclick="document.getElementById('dotsCalcModal').remove()" style="background:none;border:none;color:var(--text,#fff);font-size:22px;cursor:pointer;">✕</button>
        </div>
        <div style="display:grid;gap:12px;">
            <div>
                <label style="font-size:0.7em;color:var(--text-muted,#888);display:block;margin-bottom:4px;">Total (S+B+D)</label>
                <input type="number" id="dotsTotal" value="${total}" style="width:100%;background:var(--surface2,#222);color:var(--text,#fff);border:1px solid var(--border,#444);padding:10px;border-radius:6px;" oninput="recalcDots()">
            </div>
            <div>
                <label style="font-size:0.7em;color:var(--text-muted,#888);display:block;margin-bottom:4px;">Bodyweight (lbs)</label>
                <input type="number" id="dotsBW" value="${bw}" placeholder="Enter bodyweight" style="width:100%;background:var(--surface2,#222);color:var(--text,#fff);border:1px solid var(--border,#444);padding:10px;border-radius:6px;" oninput="recalcDots()">
            </div>
            <div>
                <label style="font-size:0.7em;color:var(--text-muted,#888);display:block;margin-bottom:4px;">Sex</label>
                <div style="display:flex;gap:8px;">
                    <button onclick="setDotsSex('male')" id="dotsSexM" style="flex:1;padding:10px;border-radius:6px;font-weight:bold;cursor:pointer;border:2px solid ${sex==='male'?'#2196f3':'var(--border,#444)'};background:${sex==='male'?'rgba(33,150,243,0.15)':'var(--surface2,#222)'};color:var(--text,#fff);">Male</button>
                    <button onclick="setDotsSex('female')" id="dotsSexF" style="flex:1;padding:10px;border-radius:6px;font-weight:bold;cursor:pointer;border:2px solid ${sex==='female'?'#e91e63':'var(--border,#444)'};background:${sex==='female'?'rgba(233,30,99,0.15)':'var(--surface2,#222)'};color:var(--text,#fff);">Female</button>
                </div>
            </div>
            <div id="dotsResult" style="text-align:center;padding:16px;background:var(--surface2,#222);border-radius:8px;border:1px solid #FFD700;">
                <div style="font-size:0.7em;color:#FFD700;text-transform:uppercase;letter-spacing:1px;">DOTS Score</div>
                <div id="dotsValue" style="font-size:2.5em;font-weight:900;color:#FFD700;margin-top:4px;">${calculateDots(total,bw,sex)}</div>
            </div>
        </div>
    </div>`;
    document.body.appendChild(modal);
};

window.setDotsSex = function(sex) {
    state.settings.sex = sex;
    saveToCloud();
    const mBtn = document.getElementById('dotsSexM');
    const fBtn = document.getElementById('dotsSexF');
    if(mBtn) { mBtn.style.borderColor = sex==='male' ? '#2196f3' : 'var(--border,#444)'; mBtn.style.background = sex==='male' ? 'rgba(33,150,243,0.15)' : 'var(--surface2,#222)'; }
    if(fBtn) { fBtn.style.borderColor = sex==='female' ? '#e91e63' : 'var(--border,#444)'; fBtn.style.background = sex==='female' ? 'rgba(233,30,99,0.15)' : 'var(--surface2,#222)'; }
    recalcDots();
};

window.recalcDots = function() {
    const t = parseFloat(document.getElementById('dotsTotal').value)||0;
    const b = parseFloat(document.getElementById('dotsBW').value)||0;
    const sex = state.settings.sex || 'male';
    const el = document.getElementById('dotsValue');
    if(el) el.innerText = calculateDots(t,b,sex);
};

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
            const displayName = state.settings.userName || user.displayName || user.email || "Anonymous";
            await setDoc(doc(db,"leaderboard",user.uid), {
                email: user.email||"Anonymous",
                name: displayName,
                total,
                squat:state.maxes.Squat||0, bench:state.maxes.Bench||0,
                deadlift:state.maxes.Deadlift||0, unit:state.unit,
                program: 'Andre Map Wave',
                week: state.activeWeek,
                updatedAt: Date.now()
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
            if(state.settings.userName) {
                const nameField = document.getElementById('userName');
                if(nameField) nameField.value = state.settings.userName;
                updateBrandName();
            }
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
                let finalPct, finalReps;

                // Auto-accessory with per-week periodization
                if(c.isAutoAcc && c.pctByWeek) {
                    const wIdx = Math.min(state.activeWeek - 1, c.pctByWeek.length - 1);
                    finalPct = c.pctByWeek[wIdx] || 0;
                    finalReps = c.repsByWeek ? c.repsByWeek[wIdx] : c.r;
                    if(finalReps === 'OFF' || finalPct === 0) return; // Skip this week
                } else {
                    const resolved = resolveSmartLift(c, state.activeWeek);
                    finalPct = resolved.pct;
                    finalReps = resolved.reps;
                }

                if(state.activeWeek === 6 && !c.isAutoAcc) finalPct = finalPct * 0.90;
                if(finalPct > 0) {
                    exs.push({ name: c.n+(c.isAutoAcc?'':'⭐'), sets:"3", reps:finalReps, pct:finalPct, type:{squat:'Squat',bench:'Bench',deadlift:'Deadlift',ohp:'OHP'}[c.s]||'Squat', isCustom:true, dbIndex:originalIndex });
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
            
            // RPE Auto-Regulation: apply adjustment if enabled
            const autoRegMult = getAutoRegAdjustment(m.name, m.type, state.activeWeek, day);
            let finalLoad = Math.round((baseLoad*modifier*autoRegMult)/5)*5;
            let loadDisplay = "", style = "", warn = "";
            let autoRegLabel = "";

            if(baseLoad > 0) {
                if(autoRegMult < 1.0) {
                    style="color:#ff9f0a;font-weight:bold;";
                    const dropPct = Math.round((1 - autoRegMult) * 100);
                    autoRegLabel = ` <span style='color:#ff9f0a;font-size:9px;'>↓${dropPct}% RPE</span>`;
                }
                if(modifier!==1.0 || overloadPct>0) { style="color:#ff4444;font-weight:bold;"; warn=" ⚠️"; }
                loadDisplay = `<span style="${style}">${finalLoad} LBS${warn}</span>${warningLabel}${autoRegLabel} <span onclick="adjustWeight('${m.name}',${baseLoad})" style="cursor:pointer;font-size:12px;color:#aaa;margin-left:5px;">✎</span>`;
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
    if(state.settings.userName) {
        const nameField = document.getElementById('userName');
        if(nameField) nameField.value = state.settings.userName;
    }
};

window.openAuthModal = function() { document.getElementById('authModal').style.display='flex'; };
window.closeModal = function(id) { document.getElementById(id).style.display='none'; };
window.saveSettings = function() {
    const nameField = document.getElementById('userName');
    if(nameField && nameField.value.trim()) state.settings.userName = nameField.value.trim();
    state.settings.bw = document.getElementById('bodyweight').value;
    if(state.settings.bw) saveBodyweightEntry(state.settings.bw);
    updateBrandName();
    saveToCloud();
    render();
    toast('Settings saved');
};
window.copyData = function() { toast('Data backed up to cloud ✓'); };

// ==========================================
// NAME PROMPT — ONE-TIME FIRST NAME ENTRY
// ==========================================
function showNamePrompt() {
    // Don't show if name already set
    if(state.settings.userName) return;
    const existing = document.getElementById('namePromptModal');
    if(existing) return;

    const modal = document.createElement('div');
    modal.id = 'namePromptModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
    <div style="background:var(--surface,#1e1e1e);border:1px solid var(--border,#333);border-radius:14px;padding:30px;width:90%;max-width:400px;text-align:center;">
        <div style="font-size:2rem;margin-bottom:10px;">👋</div>
        <h2 style="color:#fff;margin:0 0 8px 0;">Welcome to Andre's Calibrations</h2>
        <p style="color:var(--text-muted,#aaa);font-size:0.85rem;margin-bottom:20px;">Enter your first name to personalize your program.</p>
        <input type="text" id="namePromptInput" placeholder="First Name" 
            style="width:100%;padding:14px;background:var(--surface2,#222);color:#fff;border:1px solid var(--border,#444);border-radius:8px;font-size:1.1rem;text-align:center;text-transform:capitalize;font-family:inherit;margin-bottom:14px;"
            onkeydown="if(event.key==='Enter')submitNamePrompt()">
        <button onclick="submitNamePrompt()" 
            style="width:100%;padding:14px;background:#d32f2f;color:#fff;border:none;border-radius:8px;font-weight:900;font-size:1rem;cursor:pointer;text-transform:uppercase;letter-spacing:1px;">
            Let's Go
        </button>
    </div>`;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('namePromptInput').focus(), 100);
}

window.submitNamePrompt = function() {
    const input = document.getElementById('namePromptInput');
    const name = input ? input.value.trim() : '';
    if(!name) { input.style.borderColor = '#f44336'; return; }
    state.settings.userName = name;
    const nameField = document.getElementById('userName');
    if(nameField) nameField.value = name;
    updateBrandName();
    saveToCloud();
    const modal = document.getElementById('namePromptModal');
    if(modal) modal.remove();
    toast(`Welcome, ${name}! 💪`);
};

function updateBrandName() {
    const brand = document.querySelector('.brand');
    if(!brand) return;
    const name = state.settings.userName;
    if(name) {
        brand.innerText = `${name.toUpperCase()}'S ANDRE MAP WAVE`;
    } else {
        brand.innerText = 'ANDRE MAP WAVE';
    }
}
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
            loadFromCloud(user.uid).then(() => {
                // Show name prompt if user hasn't set one yet
                if(!state.settings.userName) showNamePrompt();
            });
            const btn = document.getElementById('login-btn');
            if(btn) {
                btn.innerText = 'Log Out';
                btn.onclick = () => {
                    signOut(auth);
                    localStorage.removeItem('andreMapCustomLifts');
                    location.reload();
                };
            }
        } else {
            // Not logged in — show gentle sign-up prompt after delay
            const dismissed = sessionStorage.getItem('signupPromptDismissed');
            if (!dismissed) {
                setTimeout(() => {
                    if (auth.currentUser) return;
                    showSignupPrompt();
                }, 5000);
            }
        }
    });

    function showSignupPrompt() {
        const existing = document.getElementById('signupPromptOverlay');
        if (existing) return;
        const overlay = document.createElement('div');
        overlay.id = 'signupPromptOverlay';
        overlay.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9700;display:flex;justify-content:center;padding:16px;pointer-events:none;animation:slideUp 0.4s cubic-bezier(0.28,0.11,0.32,1);';
        overlay.innerHTML = `
        <div style="pointer-events:auto;background:#1c1c1e;border:0.5px solid #38383a;border-radius:16px;padding:20px 24px;max-width:440px;width:100%;display:flex;align-items:center;gap:16px;box-shadow:0 -4px 30px rgba(0,0,0,0.5);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
            <div style="flex-shrink:0;width:44px;height:44px;background:linear-gradient(135deg,#ff453a,#ff9f0a);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;">🏋️</div>
            <div style="flex:1;min-width:0;">
                <div style="color:#fff;font-weight:700;font-size:0.92rem;margin-bottom:2px;">Save your progress</div>
                <div style="color:#98989d;font-size:0.78rem;line-height:1.4;">Create a free account to sync your data, track PRs, and appear on the leaderboard.</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
                <button onclick="document.getElementById('signupPromptOverlay').remove();sessionStorage.setItem('signupPromptDismissed','1');openAuthModal();"
                    style="background:#ff453a;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-weight:700;font-size:0.8rem;cursor:pointer;white-space:nowrap;">Sign Up</button>
                <button onclick="document.getElementById('signupPromptOverlay').remove();sessionStorage.setItem('signupPromptDismissed','1');"
                    style="background:none;border:none;color:#636366;font-size:0.72rem;cursor:pointer;">Dismiss</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
    }

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

    // Inject Auto-Regulation toggle
    const autoRegContainer = document.getElementById('autoRegContainer');
    if (autoRegContainer) autoRegContainer.innerHTML = buildAutoRegToggle();

    render();
}

init();

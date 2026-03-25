/* ================================================================
   BUILD YOUR OWN PROGRAM — script_custom.js
   ================================================================ */

// ─── STATE ────────────────────────────────────────────────────────
const cfg = {
    goal: null,          // 'strength' | 'size' | 'both'
    experience: null,    // 'novice' | 'intermediate' | 'elite'
    programType: null,   // 'single' | 'macrocycle'
    phase: null,         // 'hypertrophy' | 'strength' | 'peaking' (single only)
    blocks: [],          // array of { phase, weeks } — one entry for single, three for macro
    includeDeload: true,
    lifts: {
        squat:    { selected: false, max: 0, sets: 4, repKey: '4-6', frequency: 2 },
        bench:    { selected: false, max: 0, sets: 4, repKey: '4-6', frequency: 3 },
        deadlift: { selected: false, max: 0, sets: 3, repKey: '4-6', frequency: 1 },
        ohp:      { selected: false, max: 0, sets: 3, repKey: '4-6', frequency: 2 }
    }
};

let currentStep = 1;
const TOTAL_STEPS = 8;

// ─── EXPERIENCE + PHASE DEFAULTS ─────────────────────────────────
const PHASE_DEFAULTS = {
    novice: {
        hypertrophy: { weeks: 4, startPct: 60, jump: 5,   repKey: '8-12', recSets: 3, rpe: '6–7',   rir: '2–4 RIR', restMain: 2,   restAcc: 1 },
        strength:    { weeks: 4, startPct: 70, jump: 5,   repKey: '4-6',  recSets: 4, rpe: '7–8',   rir: '1–3 RIR', restMain: 3,   restAcc: 1.5 },
        peaking:     { weeks: 3, startPct: 80, jump: 5,   repKey: '1-3',  recSets: 3, rpe: '8–9',   rir: '0–2 RIR', restMain: 4,   restAcc: 2 }
    },
    intermediate: {
        hypertrophy: { weeks: 4, startPct: 60, jump: 2.5, repKey: '6-8',  recSets: 4, rpe: '6–7',   rir: '2–4 RIR', restMain: 2,   restAcc: 1 },
        strength:    { weeks: 4, startPct: 75, jump: 2.5, repKey: '4-6',  recSets: 4, rpe: '7–8.5', rir: '1–3 RIR', restMain: 3,   restAcc: 1.5 },
        peaking:     { weeks: 4, startPct: 82, jump: 2.5, repKey: '1-3',  recSets: 3, rpe: '8.5–9.5', rir: '0–1 RIR', restMain: 5, restAcc: 2 }
    },
    elite: {
        hypertrophy: { weeks: 8, startPct: 65, jump: 1.5, repKey: '6-8',  recSets: 4, rpe: '6–7',   rir: '2–4 RIR', restMain: 2,   restAcc: 1 },
        strength:    { weeks: 6, startPct: 80, jump: 2,   repKey: '3-5',  recSets: 4, rpe: '7–8.5', rir: '1–2 RIR', restMain: 4,   restAcc: 1.5 },
        peaking:     { weeks: 4, startPct: 85, jump: 1.5, repKey: '1-3',  recSets: 3, rpe: '8.5–9.5', rir: '0–1 RIR', restMain: 5, restAcc: 2 }
    }
};

// Goal overrides repKey defaults
const GOAL_REP_OVERRIDE = {
    strength: null,   // use phase defaults
    size:     { hypertrophy: '8-12', strength: '6-8', peaking: '6-8' },
    both:     { hypertrophy: '6-8',  strength: '4-6', peaking: '3-5' }
};

const FREQ_DEFAULTS = {
    squat:    { novice: 2, intermediate: 2, elite: 2 },
    bench:    { novice: 2, intermediate: 3, elite: 3 },
    deadlift: { novice: 2, intermediate: 1, elite: 1 },
    ohp:      { novice: 2, intermediate: 2, elite: 2 }
};

const REP_NUMS = {
    '1-3':  { display: '1–3', label: 'Peaking',       reps: 2 },
    '3-5':  { display: '3–5', label: 'Strength+',     reps: 4 },
    '4-6':  { display: '4–6', label: 'Strength',      reps: 5 },
    '6-8':  { display: '6–8', label: 'Functional',    reps: 7 },
    '8-12': { display: '8–12', label: 'Hypertrophy',  reps: 10 }
};

const LIFT_COLORS = {
    squat: '#64d2ff', bench: '#ff9f0a', deadlift: '#ff453a', ohp: '#bf5af2'
};

const PHASE_LABELS = { hypertrophy: 'Hypertrophy', strength: 'Strength', peaking: 'Peaking' };

// ─── PROGRESSIVE OVERLOAD LABELS ─────────────────────────────────
const OVERLOAD_METHODS = {
    novice:       { label: 'Weekly Load Progression', detail: '+5% per week — add weight every single session' },
    intermediate: { label: 'Volume → Load Progression', detail: 'Add sets first (MEV→MRV), then increase weight next block' },
    elite:        { label: 'Wave Loading', detail: '4-week wave cycles — step back every 3rd week to clear fatigue, then hit a new high' }
};

// ─── ACCESSORY DATABASE ───────────────────────────────────────────
const ACCESSORY_DB = {
    squat: [
        { key: 'sq_pause',   n: 'Paused Squat (3s)',       target: 'Strength out of hole',       sets: 3, reps: 3,  restMin: 3   },
        { key: 'sq_box',     n: 'Box Squat',               target: 'Hip drive / breaking floor', sets: 3, reps: 5,  restMin: 3   },
        { key: 'sq_ssb',     n: 'SSB Squat',               target: 'Upper back / quad strength', sets: 3, reps: 5,  restMin: 3   },
        { key: 'sq_tempo',   n: 'Tempo Squat (3s down)',   target: 'Control + muscle building',  sets: 3, reps: 4,  restMin: 2   },
        { key: 'sq_bss',     n: 'Bulgarian Split Squat',   target: 'Quad balance / unilateral',  sets: 3, reps: 8,  restMin: 2   },
        { key: 'sq_legpress',n: 'Leg Press',               target: 'Quad volume',                sets: 3, reps: 10, restMin: 1.5 },
    ],
    bench: [
        { key: 'bp_cg',      n: 'Close Grip Bench',        target: 'Tricep lockout strength',    sets: 3, reps: 5,  restMin: 3   },
        { key: 'bp_pause',   n: 'Paused Bench (2s)',       target: 'Off-chest drive',            sets: 3, reps: 4,  restMin: 3   },
        { key: 'bp_spoto',   n: 'Spoto Press',             target: 'Mid-range strength',         sets: 3, reps: 4,  restMin: 2.5 },
        { key: 'bp_db',      n: 'DB Bench Press',          target: 'Hypertrophy + stability',    sets: 3, reps: 10, restMin: 2   },
        { key: 'bp_incline', n: 'Incline Bench Press',     target: 'Upper chest + strength',     sets: 3, reps: 6,  restMin: 2   },
        { key: 'bp_tri',     n: 'Tricep Pushdown',         target: 'Tricep hypertrophy',         sets: 4, reps: 12, restMin: 1   },
        { key: 'bp_face',    n: 'Face Pulls',              target: 'Shoulder health + rear delt',sets: 3, reps: 15, restMin: 1   },
    ],
    deadlift: [
        { key: 'dl_rdl',     n: 'Romanian Deadlift',       target: 'Hamstring strength',         sets: 3, reps: 6,  restMin: 2   },
        { key: 'dl_block',   n: 'Block Pull (3")',         target: 'Lockout strength',           sets: 3, reps: 4,  restMin: 4   },
        { key: 'dl_deficit', n: 'Deficit Deadlift (2")',   target: 'Off-floor strength',         sets: 3, reps: 4,  restMin: 3   },
        { key: 'dl_sldl',    n: 'Stiff Leg Deadlift',     target: 'Posterior chain volume',     sets: 3, reps: 8,  restMin: 2   },
        { key: 'dl_gm',      n: 'Good Morning',           target: 'Lower back + hip hinge',     sets: 3, reps: 8,  restMin: 2   },
        { key: 'dl_row',     n: 'Barbell Row',            target: 'Upper back bracing strength',sets: 3, reps: 8,  restMin: 2   },
        { key: 'dl_curl',    n: 'Leg Curl',               target: 'Hamstring isolation',        sets: 4, reps: 12, restMin: 1   },
    ],
    ohp: [
        { key: 'ohp_push',   n: 'Push Press',             target: 'Overhead power',             sets: 3, reps: 5,  restMin: 3   },
        { key: 'ohp_db',     n: 'DB Shoulder Press',      target: 'Shoulder hypertrophy',       sets: 3, reps: 10, restMin: 2   },
        { key: 'ohp_z',      n: 'Z Press',                target: 'Strict pressing strength',   sets: 3, reps: 5,  restMin: 2.5 },
        { key: 'ohp_lat',    n: 'Lateral Raises',         target: 'Side delt + shoulder health',sets: 4, reps: 15, restMin: 1   },
        { key: 'ohp_band',   n: 'Band Pull Apart',        target: 'Shoulder health / prehab',   sets: 3, reps: 20, restMin: 1   },
    ],
    general: [
        { key: 'gen_plank',  n: 'Weighted Plank',         target: 'Core stability',             sets: 3, reps: 0, restMin: 1, isTime: true, seconds: 45 },
        { key: 'gen_pallof', n: 'Pallof Press',           target: 'Anti-rotation core',         sets: 3, reps: 10, restMin: 1   },
        { key: 'gen_back',   n: 'Back Extension',         target: 'Lower back / erectors',      sets: 3, reps: 15, restMin: 1.5 },
        { key: 'gen_ab',     n: 'Weighted Ab Crunch',     target: 'Core strength',              sets: 3, reps: 15, restMin: 1   },
    ]
};

// All accessories as a flat lookup by key
const ACC_BY_KEY = {};
Object.values(ACCESSORY_DB).flat().forEach(a => { ACC_BY_KEY[a.key] = a; });

// Per-day added accessories: { 'w0-d0': [{ key, n, sets, reps, restMin }] }
const addedAccessories = {};

// ─── NAVIGATION ───────────────────────────────────────────────────
// Step 4 is either 4a (single) or 4b (macrocycle)
function goToStep(n) {
    // Hide all current steps
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    currentStep = n;

    // Step 4 needs special handling
    if (n === 4) {
        const target = cfg.programType === 'single' ? 'step-4a' : 'step-4b';
        document.getElementById(target).classList.add('active');
    } else {
        document.getElementById(`step-${n}`)?.classList.add('active');
    }

    document.getElementById('step-counter').textContent = `Step ${n} of ${TOTAL_STEPS}`;
    document.getElementById('progress-fill').style.width = `${(n / TOTAL_STEPS) * 100}%`;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Special renders
    if (n === 5) buildDurationFields();
    if (n === 8) buildReviewSummary();
}

// ─── STEP 1: GOAL ─────────────────────────────────────────────────
function selectGoal(g) {
    cfg.goal = g;
    document.querySelectorAll('#step-1 .choice-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`goal-${g}`).classList.add('selected');
    document.getElementById('goal-next').disabled = false;
    applyGoalFreqBadges();
}

function applyGoalFreqBadges() {
    // Update frequency badge hints on lift selection screen
}

// ─── INTAKE QUESTIONNAIRE ("I Don't Know") ────────────────────────
const intakeAnswers = { q1: null, q2: null, q3: null };

function showIntakeQuiz() {
    document.getElementById('intake-overlay').style.display = 'flex';
}

function closeIntakeQuiz() {
    document.getElementById('intake-overlay').style.display = 'none';
}

function intakeAnswer(q, val) {
    intakeAnswers[q] = val;
    document.querySelectorAll(`[data-q="${q}"]`).forEach(b => b.classList.remove('selected'));
    document.querySelector(`[data-q="${q}"][data-val="${val}"]`)?.classList.add('selected');
    const allAnswered = intakeAnswers.q1 && intakeAnswers.q2 && intakeAnswers.q3;
    document.getElementById('intake-submit').disabled = !allAnswered;
}

function submitIntake() {
    const { q1, q2, q3 } = intakeAnswers;
    let exp, phase;

    // Safety default: always start at Novice + Hypertrophy unless clearly more advanced
    if (q1 === 'lt6mo') {
        exp = 'novice'; phase = 'hypertrophy';
    } else if (q1 === '6to12mo' && q2 === 'no') {
        exp = 'novice'; phase = 'hypertrophy';
    } else if (q1 === '6to12mo' && q2 !== 'no') {
        exp = 'novice'; phase = 'strength';
    } else if (q1 === '1to3yr') {
        exp = 'intermediate'; phase = 'strength';
    } else { // 3+yr
        exp = 'elite'; phase = 'strength';
    }

    // Override goal from q3 if not yet set
    if (!cfg.goal && q3) cfg.goal = q3;
    if (q3 && !cfg.goal) {
        cfg.goal = q3;
        document.querySelectorAll('#step-1 .choice-card').forEach(c => c.classList.remove('selected'));
        document.getElementById(`goal-${q3}`)?.classList.add('selected');
        document.getElementById('goal-next').disabled = false;
    }

    selectExp(exp);
    // Pre-flag the recommended starting phase for use in step 4
    cfg._intakePhase = phase;
    closeIntakeQuiz();

    const expLabels = { novice: 'New Lifter', intermediate: 'Intermediate', elite: 'Experienced' };
    showToast(`Profile set: ${expLabels[exp]} · Recommended start: ${PHASE_LABELS[phase]}`);
}

// ─── STEP 2: EXPERIENCE ───────────────────────────────────────────
function selectExp(e) {
    cfg.experience = e;
    document.querySelectorAll('#step-2 .choice-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`exp-${e}`).classList.add('selected');
    document.getElementById('exp-next').disabled = false;

    // Update frequency defaults on lift rows
    ['squat','bench','deadlift','ohp'].forEach(lift => {
        const freq = FREQ_DEFAULTS[lift][e];
        cfg.lifts[lift].frequency = freq;
        const badge = document.getElementById(`freq-badge-${lift}`);
        if (badge) badge.textContent = `${freq}× / week`;
    });
}

// ─── STEP 3: PROGRAM TYPE ─────────────────────────────────────────
function selectType(t) {
    cfg.programType = t;
    document.querySelectorAll('#step-3 .choice-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`type-${t}`).classList.add('selected');
    document.getElementById('type-next').disabled = false;
}

function onTypeNext() {
    if (cfg.programType === 'single') {
        goToStep(4);
    } else {
        buildMacrocycleBlocks();
        goToStep(4);
    }
}

function buildMacrocycleBlocks() {
    const exp = cfg.experience;
    cfg.blocks = [
        { phase: 'hypertrophy', weeks: PHASE_DEFAULTS[exp].hypertrophy.weeks },
        { phase: 'strength',    weeks: PHASE_DEFAULTS[exp].strength.weeks },
        { phase: 'peaking',     weeks: PHASE_DEFAULTS[exp].peaking.weeks }
    ];
}

// ─── STEP 4A: PHASE SELECTION ─────────────────────────────────────
function selectPhase(phase, cardEl) {
    cfg.phase = phase;
    cfg.blocks = [{ phase, weeks: PHASE_DEFAULTS[cfg.experience][phase].weeks }];
    document.querySelectorAll('.phase-card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
    document.getElementById('phase-next').disabled = false;
}

function togglePhaseExpand(e, id) {
    e.stopPropagation();
    const card = document.getElementById(id);
    card.classList.toggle('expanded');
    const toggle = card.querySelector('.phase-expand-toggle');
    toggle.textContent = card.classList.contains('expanded') ? '▾ Less' : '▸ Learn more';
}

// ─── STEP 4B: MACROCYCLE OVERVIEW ────────────────────────────────
function buildMacrocycleOverview() {
    const exp = cfg.experience;
    const totalWeeks = cfg.blocks.reduce((s, b) => s + b.weeks, 0) + (cfg.includeDeload ? 1 : 0);
    const container = document.getElementById('macrocycle-overview');
    const icons = { hypertrophy: '🏗️', strength: '⚙️', peaking: '🎯' };
    const descriptions = {
        hypertrophy: 'Build the engine. High volume, lower intensity, address weak points.',
        strength: 'Translate size to power. Heavy working sets, moderate reps.',
        peaking: 'Express max strength. Low volume, very high intensity.'
    };
    container.innerHTML = cfg.blocks.map((b, i) => `
        <div class="info-card" style="border-left: 3px solid ${['#64d2ff','#ff9f0a','#ff453a'][i]}">
            <div class="info-card-title">${icons[b.phase]} Phase ${i+1}: ${PHASE_LABELS[b.phase]} Block</div>
            <div class="info-card-body">${descriptions[b.phase]}</div>
            <div style="margin-top:10px; display:flex; align-items:center; gap:10px;">
                <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Duration</span>
                <div class="num-control" style="transform:scale(0.9); transform-origin:left">
                    <button class="num-btn" onclick="adjustBlockWeeks(${i}, -1)">−</button>
                    <input type="number" class="num-val" id="block-weeks-${i}" value="${b.weeks}" min="2" max="16" onchange="cfg.blocks[${i}].weeks = parseInt(this.value)||${b.weeks}">
                    <button class="num-btn" onclick="adjustBlockWeeks(${i}, 1)">+</button>
                </div>
                <span style="font-size:0.8rem; color:var(--text-sub); font-weight:600;">weeks</span>
            </div>
        </div>
    `).join('') + `
        <div class="info-card" style="border-left: 3px solid var(--green); opacity:0.7">
            <div class="info-card-title">🔋 Deload Week</div>
            <div class="info-card-body">Auto-added at the end. Volume cuts 50%, intensity maintained. Clears fatigue and locks in adaptations.</div>
        </div>
        <div style="text-align:center; padding:12px 0; font-size:0.8rem; color:var(--text-sub);">
            Estimated total: <strong style="color:var(--text)">${totalWeeks + 1} weeks</strong>
        </div>
    `;
}

function adjustBlockWeeks(idx, delta) {
    const input = document.getElementById(`block-weeks-${idx}`);
    const current = parseInt(input.value) || cfg.blocks[idx].weeks;
    const newVal = Math.max(2, Math.min(16, current + delta));
    input.value = newVal;
    cfg.blocks[idx].weeks = newVal;
}

// ─── STEP 5: DURATION FIELDS ─────────────────────────────────────
function buildDurationFields() {
    const container = document.getElementById('duration-fields');
    // Update back button destination
    document.getElementById('dur-back-btn').onclick = () => goToStep(cfg.programType === 'single' ? 4 : 4);

    if (cfg.programType === 'macrocycle') {
        // For macrocycle, blocks were set in step 4b — show them here too
        container.innerHTML = '<div class="info-card"><div class="info-card-body">Block durations are configured on the macrocycle overview screen. You can go back to adjust them.</div></div>';
        buildMacrocycleOverview();
        return;
    }

    // Single block
    const b = cfg.blocks[0];
    const exp = cfg.experience;
    const def = PHASE_DEFAULTS[exp][b.phase];
    const rec = def.weeks;
    const totalWks = b.weeks + 1;

    container.innerHTML = `
        <div class="form-section">
            <div class="form-label">${PHASE_LABELS[b.phase]} Block Length</div>
            <div style="display:flex; align-items:center; gap:16px; margin-bottom:8px">
                <div class="num-control">
                    <button class="num-btn" onclick="adjustSingleBlock(-1)">−</button>
                    <input type="number" class="num-val" id="single-block-weeks" value="${b.weeks}" min="2" max="20" onchange="updateSingleBlock(this.value)">
                    <button class="num-btn" onclick="adjustSingleBlock(1)">+</button>
                </div>
                <span style="font-size:0.85rem; color:var(--text-sub); font-weight:600;">weeks</span>
            </div>
            <div class="form-hint">Recommended for ${cfg.experience}: <span class="rec">${rec} weeks</span></div>
        </div>
        <div id="ramp-preview-container">${buildRampPreview(b.weeks)}</div>
    `;
}

function adjustSingleBlock(delta) {
    const input = document.getElementById('single-block-weeks');
    if (!input) return;
    const newVal = Math.max(2, Math.min(20, (parseInt(input.value) || 4) + delta));
    input.value = newVal;
    updateSingleBlock(newVal);
}

function updateSingleBlock(val) {
    const weeks = parseInt(val) || 4;
    cfg.blocks[0].weeks = weeks;
    const preview = document.getElementById('ramp-preview-container');
    if (preview) preview.innerHTML = buildRampPreview(weeks);
}

function buildRampPreview(weeks) {
    const deloadWeek = cfg.includeDeload ? 1 : 0;
    const bars = [];
    for (let w = 0; w < weeks; w++) {
        const isFirst = w === 0;
        const isLast = w === weeks - 1;
        const cls = isFirst ? 'mev' : isLast ? 'mrv' : 'mid';
        const label = isFirst ? 'MEV' : isLast ? 'MRV' : `W${w+1}`;
        bars.push({ cls, label });
    }
    if (deloadWeek) bars.push({ cls: 'deload-bar', label: 'DL' });

    return `
        <div class="info-card">
            <div class="info-card-title">Volume Ramp Preview</div>
            <div class="info-card-body" style="margin-bottom:12px">Sets ramp from MEV (minimum) to MRV (maximum). The deload clears fatigue and locks in the gains.</div>
            <div class="volume-ramp-preview">
                ${bars.map((b, i) => `
                    <div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:4px">
                        <div class="ramp-bar ${b.cls}" style="width:100%;height:${24 + i * (b.cls==='deload-bar'?0:6)}px;min-height:24px;"></div>
                        <div class="ramp-label">${b.label}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ─── STEP 6: LIFT SELECTION ───────────────────────────────────────
function toggleLift(lift) {
    const cb = document.getElementById(`cb-${lift}`);
    const row = document.getElementById(`lift-row-${lift}`);
    const maxRow = document.getElementById(`max-row-${lift}`);
    cfg.lifts[lift].selected = cb.checked;
    row.classList.toggle('active', cb.checked);
    maxRow.style.display = cb.checked ? 'flex' : 'none';
    validateLiftStep();
}

function updateMax(lift, val) {
    cfg.lifts[lift].max = parseInt(val) || 0;
    validateLiftStep();
}

function validateLiftStep() {
    const anySelected = Object.values(cfg.lifts).some(l => l.selected);
    const allMaxEntered = Object.entries(cfg.lifts)
        .filter(([, l]) => l.selected)
        .every(([, l]) => l.max > 0);
    document.getElementById('lift-next').disabled = !(anySelected && allMaxEntered);
}

// ─── STEP 7: CONFIGURE LIFTS ──────────────────────────────────────
function buildConfigStep() {
    const selected = Object.entries(cfg.lifts).filter(([, l]) => l.selected);
    const exp = cfg.experience;
    const phase = cfg.blocks[0]?.phase || 'strength';
    const tabsEl = document.getElementById('config-tabs');
    const panelsEl = document.getElementById('config-panels');

    tabsEl.innerHTML = '';
    panelsEl.innerHTML = '';

    selected.forEach(([lift, data], i) => {
        const def = PHASE_DEFAULTS[exp][phase];
        const goalOverride = GOAL_REP_OVERRIDE[cfg.goal]?.[phase];
        const recRepKey = goalOverride || def.repKey;
        const recSets = def.recSets;
        const recFreq = FREQ_DEFAULTS[lift][exp];

        // Apply recommendations if not already customized
        if (!data._customized) {
            cfg.lifts[lift].repKey = recRepKey;
            cfg.lifts[lift].sets = recSets;
            cfg.lifts[lift].frequency = recFreq;
        }

        // Tab
        const tab = document.createElement('button');
        tab.className = `lift-tab ${i === 0 ? 'active' : ''}`;
        tab.textContent = lift.charAt(0).toUpperCase() + lift.slice(1);
        tab.onclick = () => switchConfigTab(lift);
        tabsEl.appendChild(tab);

        // Panel
        const panel = document.createElement('div');
        panel.className = `lift-config-panel ${i === 0 ? 'active' : ''}`;
        panel.id = `panel-${lift}`;
        panel.innerHTML = buildConfigPanel(lift, recRepKey, recSets, recFreq);
        panelsEl.appendChild(panel);
    });

    goToStep(7);
}

function buildConfigPanel(lift, recRepKey, recSets, recFreq) {
    const d = cfg.lifts[lift];
    const color = LIFT_COLORS[lift];
    return `
        <!-- SETS -->
        <div class="form-section">
            <div class="form-label" style="color:${color}">Sets Per Session</div>
            <div class="config-row">
                <div class="config-row-label">
                    <div class="main">Working Sets</div>
                    <div class="sub">Sets that actually drive adaptation — not warm-ups</div>
                </div>
                <div class="config-row-control">
                    <div class="num-control">
                        <button class="num-btn" onclick="adjustLiftCfg('${lift}','sets',-1)">−</button>
                        <input type="number" class="num-val" id="sets-${lift}" value="${d.sets}" min="1" max="10" onchange="setLiftCfg('${lift}','sets',this.value)">
                        <button class="num-btn" onclick="adjustLiftCfg('${lift}','sets',1)">+</button>
                    </div>
                </div>
            </div>
            <div class="form-hint">Recommended: <span class="rec">${recSets} sets</span></div>
            <details class="edu-block" style="margin-top:10px">
                <summary>How many sets should I do?</summary>
                <div class="edu-content">
                    <h4>1–2 Sets: Peaking & Maximum Intensity</h4>
                    <p>Used when the weight on the bar is at its absolute highest. 1–2 perfect sets deliver maximum CNS stimulus without destroying your ability to recover. Any more at this intensity is junk volume.</p>
                    <h4>3–5 Sets: The Strength Sweet Spot</h4>
                    <p>The gold standard for powerlifting. Enough practice repetitions to master the groove under real working weight, without accumulating crushing fatigue. This is where most of your career will live.</p>
                    <h4>6+ Sets: Hypertrophy & Overreaching</h4>
                    <p>High set counts are used during volume blocks to intentionally push to your MRV. The weight is lighter but the sheer number of sets builds muscle. Warning: junk volume becomes a real risk above 6 sets — if you can't maintain technique, stop.</p>
                    <h4>The Junk Volume Warning</h4>
                    <p>There's a biological limit to how much a muscle can be stimulated per session. If 4 sets is your maximum effective dose, sets 5, 6, and 7 add zero strength benefit but pack on fatigue you now have to recover from.</p>
                </div>
            </details>
        </div>

        <!-- REPS -->
        <div class="form-section">
            <div class="form-label" style="color:${color}">Rep Range</div>
            <div class="rep-seg" id="rep-seg-${lift}">
                ${Object.entries(REP_NUMS).map(([key, v]) => `
                    <button class="rep-seg-btn ${d.repKey === key ? 'selected' : ''}"
                        data-repkey="${key}"
                        onclick="selectRepRange('${lift}','${key}')">
                        <span class="rep-range">${v.display}</span>
                        ${v.label}
                    </button>
                `).join('')}
            </div>
            <div class="form-hint">Recommended: <span class="rec">${REP_NUMS[recRepKey].display} reps (${REP_NUMS[recRepKey].label})</span></div>
            <details class="edu-block" style="margin-top:10px">
                <summary>What do different rep ranges actually do?</summary>
                <div class="edu-content">
                    <h4>1–3 Reps: Neurological Efficiency (Peaking)</h4>
                    <p>Less about building muscle, entirely about training your CNS. Heavy singles and doubles teach your brain to fire all available motor units simultaneously. This is pure skill practice — you're training the coordination to move a maximal load.</p>
                    <h4>4–6 Reps: Functional Hypertrophy (The Powerlifter's Sweet Spot)</h4>
                    <p>Drives myofibrillar hypertrophy — the thickening of contractile muscle fibers. Makes the muscle denser and stronger, not just bigger. This is the rep range where most elite powerlifters live during their strength block.</p>
                    <h4>8–12 Reps: Structural Hypertrophy (The Base Builder)</h4>
                    <p>Builds a larger muscle with more potential. A bigger muscle is a stronger muscle. Used during the off-season to build the engine. Also heavily used for accessories to fix weak points and protect joints.</p>
                    <h4>15+ Reps: Prehab & Tendon Health</h4>
                    <p>Forces blood into muscles and connective tissue, which have poor circulation. Protects your tendons from the beating they take under heavy loads. Use this on isolation movements, not competition lifts.</p>
                </div>
            </details>
        </div>

        <!-- FREQUENCY -->
        <div class="form-section">
            <div class="form-label" style="color:${color}">Weekly Frequency</div>
            <div class="config-row">
                <div class="config-row-label">
                    <div class="main">Sessions per Week</div>
                    <div class="sub">How often you train this specific lift</div>
                </div>
                <div class="config-row-control">
                    <div class="num-control">
                        <button class="num-btn" onclick="adjustLiftCfg('${lift}','frequency',-1)">−</button>
                        <input type="number" class="num-val" id="freq-${lift}" value="${d.frequency}" min="1" max="5" onchange="setLiftCfg('${lift}','frequency',this.value)">
                        <button class="num-btn" onclick="adjustLiftCfg('${lift}','frequency',1)">+</button>
                    </div>
                </div>
            </div>
            <div class="form-hint">Recommended for ${lift}: <span class="rec">${recFreq}× / week</span></div>
            <details class="edu-block" style="margin-top:10px">
                <summary>Why does frequency matter?</summary>
                <div class="edu-content">
                    <h4>Frequency is a delivery system, not a driver</h4>
                    <p>Frequency doesn't drive adaptation by itself — total weekly volume does. Frequency is how you distribute that volume so it stays high quality.</p>
                    <p>If you need 12 sets of bench this week, doing all 12 on Monday creates massive fatigue and your technique degrades by set 6. Splitting it across 3 days means every set is high quality.</p>
                    <h4>The Priority Order</h4>
                    <p><strong>First: Total sets per week</strong> — this is the primary driver. <strong>Second: Rep range</strong> — this determines the type of adaptation. <strong>Third: Frequency</strong> — this is just how you organize the first two to maximize quality.</p>
                </div>
            </details>
        </div>
    `;
}

function switchConfigTab(lift) {
    document.querySelectorAll('.lift-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.lift-config-panel').forEach(p => p.classList.remove('active'));
    const selected = Object.keys(cfg.lifts).filter(k => cfg.lifts[k].selected);
    const idx = selected.indexOf(lift);
    document.querySelectorAll('.lift-tab')[idx]?.classList.add('active');
    document.getElementById(`panel-${lift}`)?.classList.add('active');
}

function adjustLiftCfg(lift, key, delta) {
    const input = document.getElementById(`${key === 'frequency' ? 'freq' : key}-${lift}`);
    if (!input) return;
    const limits = { sets: [1, 10], frequency: [1, 5] };
    const [min, max] = limits[key];
    const newVal = Math.max(min, Math.min(max, (parseInt(input.value) || 1) + delta));
    input.value = newVal;
    cfg.lifts[lift][key] = newVal;
    cfg.lifts[lift]._customized = true;
}

function setLiftCfg(lift, key, val) {
    cfg.lifts[lift][key] = parseInt(val) || cfg.lifts[lift][key];
    cfg.lifts[lift]._customized = true;
}

function selectRepRange(lift, key) {
    cfg.lifts[lift].repKey = key;
    cfg.lifts[lift]._customized = true;
    document.querySelectorAll(`#rep-seg-${lift} .rep-seg-btn`).forEach(b => {
        b.classList.toggle('selected', b.dataset.repkey === key);
    });
}

// ─── STEP 8: REVIEW SUMMARY ───────────────────────────────────────
function buildReviewSummary() {
    const selected = Object.entries(cfg.lifts).filter(([, l]) => l.selected);
    const totalWeeks = cfg.blocks.reduce((s, b) => s + b.weeks, 0) + (cfg.includeDeload ? 1 : 0);
    const container = document.getElementById('program-review-summary');

    container.innerHTML = `
        <div class="info-card" style="margin-bottom:16px">
            <div class="info-card-title">Program Summary</div>
            <table class="review-table" style="margin-top:8px">
                <thead>
                    <tr>
                        <th>Lift</th>
                        <th>Sets × Reps</th>
                        <th>Freq</th>
                        <th>Training Max</th>
                    </tr>
                </thead>
                <tbody>
                    ${selected.map(([lift, d]) => `
                        <tr>
                            <td>
                                <span class="lift-type-dot" style="background:${LIFT_COLORS[lift]}"></span>
                                ${lift.charAt(0).toUpperCase() + lift.slice(1)}
                            </td>
                            <td style="font-weight:800; color:${LIFT_COLORS[lift]}">${d.sets}×${REP_NUMS[d.repKey].reps}</td>
                            <td style="color:var(--text-sub)">${d.frequency}×/wk</td>
                            <td style="font-weight:700">${d.max} lbs</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="info-card">
            <div class="info-card-title">Block Structure</div>
            <div class="info-card-body">
                ${cfg.blocks.map(b => `<strong>${PHASE_LABELS[b.phase]}:</strong> ${b.weeks} weeks`).join(' → ')}
                ${cfg.includeDeload ? ' → <strong>Deload:</strong> 1 week' : ''}
                <br><span style="color:var(--accent); font-weight:700">Total: ${totalWeeks} weeks</span>
            </div>
        </div>
    `;
}

// ─── PROGRAM GENERATION ───────────────────────────────────────────
function generateAndRender() {
    cfg.includeDeload = document.getElementById('deload-toggle').checked;
    const programData = generateProgramData();
    renderProgram(programData);
    saveCustomProgram(programData);
}

function generateProgramData() {
    const programWeeks = [];

    cfg.blocks.forEach((block, blockIdx) => {
        const def = PHASE_DEFAULTS[cfg.experience][block.phase];
        const weekOffset = programWeeks.length;

        for (let w = 0; w < block.weeks; w++) {
            const pct = calcPct(def, w, block.weeks, block.phase);
            const days = buildDays(w, block.weeks, pct, block.phase, def);
            programWeeks.push({
                weekNum: weekOffset + w + 1,
                phase: block.phase,
                pct: Math.round(pct * 10) / 10,
                isDeload: false,
                days
            });
        }

        // For macrocycle: insert a deload between every block transition
        const isLastBlock = blockIdx === cfg.blocks.length - 1;
        if (cfg.programType === 'macrocycle' && !isLastBlock) {
            programWeeks.push({
                weekNum: programWeeks.length + 1,
                phase: 'deload',
                pct: 60,
                isDeload: true,
                deloadLabel: `Transition Deload (${PHASE_LABELS[block.phase]} → ${PHASE_LABELS[cfg.blocks[blockIdx + 1].phase]})`,
                days: buildDeloadDays()
            });
        }
    });

    // Final deload (end of program or single block)
    if (cfg.includeDeload) {
        programWeeks.push({
            weekNum: programWeeks.length + 1,
            phase: 'deload',
            pct: 60,
            isDeload: true,
            deloadLabel: 'Final Deload',
            days: buildDeloadDays()
        });
    }

    return programWeeks;
}

function calcPct(def, weekIdx, totalWeeks, phase) {
    // Elite strength block: wave loading
    if (cfg.experience === 'elite' && phase === 'strength') {
        const cycle = weekIdx % 4;
        const cycleNum = Math.floor(weekIdx / 4);
        const base = def.startPct + cycleNum * 7.5;
        return [base, base + 2.5, base - 5, base + 5][cycle] || base;
    }
    return def.startPct + weekIdx * def.jump;
}

function getSetsForWeek(userMaxSets, totalWeeks, weekIdx) {
    // Ramp from (maxSets - 2) at week 0 to maxSets at final third
    const mev = Math.max(2, userMaxSets - 2);
    const rampWeeks = Math.max(1, totalWeeks - 1);
    return Math.min(userMaxSets, Math.round(mev + (weekIdx / rampWeeks) * (userMaxSets - mev)));
}

function buildDays(weekIdx, totalWeeks, pct, phase, def) {
    const selectedLifts = Object.entries(cfg.lifts).filter(([, l]) => l.selected);
    if (selectedLifts.length === 0) return [];

    const maxFreq = Math.max(...selectedLifts.map(([, l]) => l.frequency));
    const days = Array.from({ length: maxFreq }, (_, i) => ({ name: '', lifts: [], dayIdx: i }));

    selectedLifts.forEach(([lift, liftData]) => {
        const freq = liftData.frequency;
        for (let session = 0; session < freq; session++) {
            const dayIdx = Math.round(session * (maxFreq / freq));
            const isPrimary = session === 0;
            const sessionPct = isPrimary ? pct : Math.max(pct - 5, 50);
            const weekSets = getSetsForWeek(liftData.sets, totalWeeks, weekIdx);
            const sessionSets = isPrimary ? weekSets : Math.max(weekSets - 1, 2);
            const reps = REP_NUMS[liftData.repKey].reps;
            const weight = Math.round((liftData.max * sessionPct / 100) / 5) * 5;

            days[dayIdx].lifts.push({
                name: getLiftDisplayName(lift, isPrimary, phase, cfg.goal),
                type: lift,
                sets: sessionSets,
                reps,
                pct: Math.round(sessionPct),
                weight,
                isPrimary,
                sessionLabel: isPrimary ? 'Primary' : `Secondary (Session ${session + 1})`
            });
        }
    });

    // Name days
    days.forEach((day, i) => {
        const primary = day.lifts.filter(l => l.isPrimary).map(l => capitalize(l.type));
        day.name = primary.length > 0 ? `Day ${i + 1}: ${primary.join(' + ')}` : `Day ${i + 1}: Accessory`;
    });

    return days.filter(d => d.lifts.length > 0);
}

function buildDeloadDays() {
    const selectedLifts = Object.entries(cfg.lifts).filter(([, l]) => l.selected);
    const maxFreq = Math.max(...selectedLifts.map(([, l]) => l.frequency));
    const deloadFreq = Math.max(1, Math.ceil(maxFreq / 2)); // half the sessions

    const days = [];
    for (let d = 0; d < deloadFreq; d++) {
        const liftsForDay = selectedLifts
            .filter(([, l]) => {
                const step = Math.round(l.frequency / deloadFreq);
                return (d % step) === 0 || d < l.frequency;
            })
            .slice(0, 2)
            .map(([lift, l]) => ({
                name: getLiftDisplayName(lift, true, 'strength', cfg.goal),
                type: lift,
                sets: Math.max(2, Math.floor(l.sets / 2)),
                reps: REP_NUMS[l.repKey].reps,
                pct: 60,
                weight: Math.round((l.max * 0.60) / 5) * 5,
                isPrimary: true,
                sessionLabel: 'Deload'
            }));

        if (liftsForDay.length > 0) {
            const names = liftsForDay.map(l => capitalize(l.type));
            days.push({ name: `Day ${d + 1}: ${names.join(' + ')}`, lifts: liftsForDay, dayIdx: d });
        }
    }
    return days;
}

function getLiftDisplayName(lift, isPrimary, phase, goal) {
    if (!isPrimary) {
        const variations = {
            squat: 'Secondary Squat (Variation)',
            bench: 'Secondary Bench',
            deadlift: 'RDL / Variation',
            ohp: 'Secondary OHP'
        };
        return variations[lift] || lift;
    }
    if (goal === 'size') {
        const sizeNames = { squat: 'High Bar Squat', bench: 'Bench Press', deadlift: 'Deadlift', ohp: 'Overhead Press' };
        return sizeNames[lift] || lift;
    }
    const compNames = { squat: 'Competition Squat', bench: 'Competition Bench', deadlift: 'Competition Deadlift', ohp: 'Overhead Press' };
    return compNames[lift] || lift;
}

// ─── WEEK NOTE GENERATOR ──────────────────────────────────────────
function getWeekNote(week, totalWeeks) {
    if (week.isDeload) {
        const label = week.deloadLabel || 'Deload';
        return `🔋 ${label}. Cut sets by ~50%. Keep intensity (weight) the same or 5% lighter — your goal is to maintain the nervous system signal while fatigue clears. You should feel noticeably fresher within 3–4 days. Do not go to failure on anything.`;
    }
    const def = PHASE_DEFAULTS[cfg.experience]?.[week.phase];
    const rpeText = def ? `Target RPE: <strong>${def.rpe}</strong> (${def.rir}) on working sets.` : '';
    const phaseName = PHASE_LABELS[week.phase] || week.phase;

    if (week.weekNum === 1) {
        return `📦 Week 1 — ${phaseName} Block (MEV). Start conservative. ${rpeText} Leave reps in the tank. The goal is to sensitize your body to the stimulus, not exhaust it.`;
    }
    const isLastTrainingWeek = !week.isDeload && week.weekNum === totalWeeks - (cfg.includeDeload ? 1 : 0);
    if (isLastTrainingWeek) {
        return `🔥 Final training week — ${phaseName} (MRV). ${rpeText} Expect accumulated fatigue. Push through with clean technique. Your best performance comes after the deload, not this week.`;
    }
    return `📈 Week ${week.weekNum} — ${phaseName}. Volume is ramping. ${rpeText} If RPE feels 9+ on working sets that were 7–8 last week, your MRV may be close. Don't add sets — maintain quality.`;
}

// ─── WARM-UP PROTOCOL ────────────────────────────────────────────
function buildInlineWarmup(workingWeight, liftType) {
    const sets = [];
    const w = workingWeight;
    // Always start with bar
    if (w > 95) sets.push({ weight: 45, reps: 8, note: 'Bar' });
    const warmupTargets = [
        { pct: 0.40, reps: 5 },
        { pct: 0.60, reps: 3 },
        { pct: 0.75, reps: 2 },
        { pct: 0.88, reps: 1 },
    ];
    warmupTargets.forEach(({ pct, reps }) => {
        const wt = Math.round((w * pct) / 5) * 5;
        if (wt < w && wt > 45) sets.push({ weight: wt, reps, note: `${Math.round(pct * 100)}%` });
    });
    sets.push({ weight: w, reps: '—', note: 'Working weight', isWork: true });

    return `
        <div class="warmup-mini">
            <div class="warmup-mini-title">🔥 Warm-Up Protocol — ${workingWeight} lbs</div>
            <div class="warmup-rows">
                ${sets.map(s => `
                    <div class="warmup-row-item ${s.isWork ? 'work-set' : ''}">
                        <span class="wu-weight">${s.weight}</span>
                        <span class="wu-x">×</span>
                        <span class="wu-reps">${s.reps}</span>
                        <span class="wu-note">${s.note}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ─── ACCESSORY PICKER ────────────────────────────────────────────
let _accPickerTarget = null; // { weekIdx, dayIdx, mainSets }

function openAccessoryPicker(weekIdx, dayIdx, mainSets) {
    _accPickerTarget = { weekIdx, dayIdx, mainSets };
    const budget = getVolumeBudget(mainSets);
    const used = (addedAccessories[`w${weekIdx}-d${dayIdx}`] || []).reduce((s, a) => s + a.sets, 0);
    const remaining = Math.max(0, budget - used);

    const modal = document.getElementById('acc-picker-modal');
    document.getElementById('acc-budget-bar').innerHTML = `
        <span>Accessory Budget: </span>
        <strong style="color:${remaining > 0 ? 'var(--green)' : 'var(--red)'}">${remaining} sets remaining</strong>
        <span style="color:var(--text-muted)"> of ${budget} (${mainSets} main sets × 60%)</span>
    `;

    // Build exercise list
    const liftTypes = Object.keys(cfg.lifts).filter(l => cfg.lifts[l].selected);
    const categories = [...liftTypes, 'general'];
    const existing = (addedAccessories[`w${weekIdx}-d${dayIdx}`] || []).map(a => a.key);

    document.getElementById('acc-exercise-list').innerHTML = categories.map(cat => {
        const exs = ACCESSORY_DB[cat];
        if (!exs) return '';
        const catLabel = cat === 'general' ? 'Core & General' : capitalize(cat) + ' Accessories';
        return `
            <div class="acc-category">
                <div class="acc-cat-title">${catLabel}</div>
                ${exs.map(ex => `
                    <div class="acc-exercise-row ${existing.includes(ex.key) ? 'added' : ''}" id="accrow-${ex.key}">
                        <div class="acc-ex-info">
                            <div class="acc-ex-name">${ex.n}</div>
                            <div class="acc-ex-meta">${ex.sets}×${ex.isTime ? ex.seconds + 's' : ex.reps} · Rest ${formatRest(ex.restMin)} · ${ex.target}</div>
                        </div>
                        <button class="acc-add-btn ${existing.includes(ex.key) ? 'added' : ''}"
                            onclick="toggleAccessory('${ex.key}')">
                            ${existing.includes(ex.key) ? '✓ Added' : '+ Add'}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');

    modal.style.display = 'flex';
}

function closeAccessoryPicker() {
    document.getElementById('acc-picker-modal').style.display = 'none';
    if (_accPickerTarget !== null) {
        refreshAccessoryDisplay(_accPickerTarget.weekIdx, _accPickerTarget.dayIdx, _accPickerTarget.mainSets);
    }
    _accPickerTarget = null;
}

function toggleAccessory(key) {
    if (!_accPickerTarget) return;
    const { weekIdx, dayIdx, mainSets } = _accPickerTarget;
    const slotKey = `w${weekIdx}-d${dayIdx}`;
    if (!addedAccessories[slotKey]) addedAccessories[slotKey] = [];

    const existing = addedAccessories[slotKey].findIndex(a => a.key === key);
    if (existing >= 0) {
        addedAccessories[slotKey].splice(existing, 1);
        document.getElementById(`accrow-${key}`)?.classList.remove('added');
        document.querySelector(`#accrow-${key} .acc-add-btn`)?.classList.remove('added');
        document.querySelector(`#accrow-${key} .acc-add-btn`).textContent = '+ Add';
    } else {
        const budget = getVolumeBudget(mainSets);
        const used = addedAccessories[slotKey].reduce((s, a) => s + a.sets, 0);
        const acc = ACC_BY_KEY[key];
        if (used + acc.sets > budget) {
            showToast(`Budget exceeded — max ${budget} accessory sets this day`);
            return;
        }
        addedAccessories[slotKey].push({ ...acc });
        document.getElementById(`accrow-${key}`)?.classList.add('added');
        const btn = document.querySelector(`#accrow-${key} .acc-add-btn`);
        if (btn) { btn.classList.add('added'); btn.textContent = '✓ Added'; }
    }

    // Update budget display
    const used2 = addedAccessories[slotKey].reduce((s, a) => s + a.sets, 0);
    const budget = getVolumeBudget(mainSets);
    const remaining = Math.max(0, budget - used2);
    document.getElementById('acc-budget-bar').innerHTML = `
        <span>Accessory Budget: </span>
        <strong style="color:${remaining > 0 ? 'var(--green)' : 'var(--red)'}">${remaining} sets remaining</strong>
        <span style="color:var(--text-muted)"> of ${budget} (${mainSets} main sets × 60%)</span>
    `;
}

function getVolumeBudget(mainSets) {
    return Math.max(2, Math.min(6, Math.floor(mainSets * 0.6)));
}

function refreshAccessoryDisplay(weekIdx, dayIdx, mainSets) {
    const slot = addedAccessories[`w${weekIdx}-d${dayIdx}`] || [];
    const container = document.getElementById(`acc-display-w${weekIdx}-d${dayIdx}`);
    if (!container) return;

    const budget = getVolumeBudget(mainSets);
    const used = slot.reduce((s, a) => s + a.sets, 0);
    container.innerHTML = `
        <div class="acc-section-header">
            <span class="acc-section-title">Accessories</span>
            <span class="acc-budget-pill">${used}/${budget} sets</span>
            <button class="acc-open-btn" onclick="openAccessoryPicker(${weekIdx}, ${dayIdx}, ${mainSets})">
                ${slot.length > 0 ? '✏️ Edit' : '+ Add Accessories'}
            </button>
        </div>
        ${slot.length > 0 ? `
            <table class="lifts-table" style="margin-top:8px">
                <tbody>
                    ${slot.map(a => `
                        <tr>
                            <td class="lift-name-cell" style="color:var(--text-muted)">${a.n}<span class="session-label">${a.target}</span></td>
                            <td class="sets-reps-cell" style="color:var(--text-muted)">${a.sets}×${a.isTime ? a.seconds + 's' : a.reps}</td>
                            <td class="pct-cell">—</td>
                            <td class="weight-cell" style="color:var(--text-muted)">${formatRest(a.restMin)} rest</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<div style="font-size:0.75rem;color:var(--text-muted);padding:8px 0">No accessories added · Budget: ' + budget + ' sets available</div>'}
    `;
}

function formatRest(mins) {
    if (mins >= 1) {
        const m = Math.floor(mins);
        const s = Math.round((mins - m) * 60);
        return s > 0 ? `${m}:${String(s).padStart(2,'0')}` : `${m} min`;
    }
    return `${Math.round(mins * 60)}s`;
}

// ─── RENDERER ────────────────────────────────────────────────────
function renderProgram(programData) {
    const wizard = document.getElementById('wizard');
    const output = document.getElementById('program-output');
    wizard.style.display = 'none';
    output.style.display = 'block';

    // Title + overload method
    const exp = { novice: 'Novice', intermediate: 'Intermediate', elite: 'Elite' }[cfg.experience];
    const goalLabel = { strength: 'Strength', size: 'Size', both: 'Strength + Size' }[cfg.goal];
    const totalWeeks = programData.length;
    const overload = OVERLOAD_METHODS[cfg.experience];
    document.getElementById('output-title').textContent = `${goalLabel} Program`;
    document.getElementById('output-sub').innerHTML = `
        ${exp} · ${cfg.programType === 'macrocycle' ? 'Full Macrocycle' : PHASE_LABELS[cfg.blocks[0].phase] + ' Block'} · ${totalWeeks} weeks
        <span class="overload-badge" title="${overload.detail}">📈 ${overload.label}</span>
    `;

    // Week nav
    const navEl = document.getElementById('week-nav');
    navEl.innerHTML = programData.map((week, i) => {
        const phaseFirst = programData[0].phase;
        const phaseChanged = !week.isDeload && week.phase !== phaseFirst;
        return `
            <button class="week-tab ${week.isDeload ? 'deload-tab' : ''} ${i === 0 ? 'active' : ''}"
                onclick="showWeek(${i})" id="nav-tab-${i}">
                ${week.isDeload
                    ? '🔋 DL'
                    : `Wk${week.weekNum}${phaseChanged ? `<span style="font-size:0.5em;opacity:0.6;display:block">${PHASE_LABELS[week.phase][0].toUpperCase()}</span>` : ''}`}
            </button>
        `;
    }).join('');

    // Week sections
    const sectionsEl = document.getElementById('week-sections');
    sectionsEl.innerHTML = programData.map((week, weekIdx) => {
        const def = PHASE_DEFAULTS[cfg.experience]?.[week.phase];
        const rpeDisplay = (!week.isDeload && def)
            ? `<span class="rpe-badge">RPE ${def.rpe}</span><span class="rir-badge">${def.rir}</span>`
            : '';
        const mainSetsTotal = week.days.reduce((s, d) => s + d.lifts.reduce((ss, l) => ss + l.sets, 0), 0);

        return `
        <div class="week-section ${weekIdx === 0 ? 'active' : ''}" id="week-section-${weekIdx}">
            <div class="week-band">
                <div class="week-band-title">${week.isDeload ? `🔋 ${week.deloadLabel || 'Deload'}` : `Week ${week.weekNum} — ${PHASE_LABELS[week.phase] || 'Training'}`}</div>
                <div class="week-band-right">
                    ${week.isDeload ? '<span style="color:var(--green);font-size:0.75rem;font-weight:700">Recovery</span>' : `<span class="pct-badge">${week.pct}%</span>${rpeDisplay}`}
                </div>
            </div>
            <div class="week-note ${week.isDeload ? 'deload-note' : ''}">${getWeekNote(week, programData.length)}</div>
            ${week.days.map((day, dayIdx) => {
                const dayMainSets = day.lifts.reduce((s, l) => s + l.sets, 0);
                const restMin = def ? def.restMain : 3;
                return `
                <div class="day-block">
                    <div class="day-title">${day.name}</div>
                    <table class="lifts-table">
                        <thead>
                            <tr>
                                <th>Exercise</th>
                                <th>Sets × Reps</th>
                                <th>%</th>
                                <th>Weight</th>
                                <th>Rest</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${day.lifts.map((lift, liftIdx) => {
                                const warmupId = `wu-w${weekIdx}-d${dayIdx}-l${liftIdx}`;
                                return `
                                <tr>
                                    <td class="lift-name-cell">
                                        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${LIFT_COLORS[lift.type]};margin-right:8px;vertical-align:middle"></span>
                                        ${lift.name}
                                        <span class="session-label">${lift.sessionLabel}</span>
                                    </td>
                                    <td class="sets-reps-cell">${lift.sets}×${lift.reps}</td>
                                    <td class="pct-cell">${lift.pct}%</td>
                                    <td class="weight-cell">
                                        ${lift.weight} lbs
                                        <button class="wu-toggle-btn" onclick="toggleWarmup('${warmupId}')" title="Show warm-up protocol">🔥</button>
                                    </td>
                                    <td class="rest-cell"><span class="rest-badge">${restMin >= 1 ? restMin + ' min' : Math.round(restMin * 60) + 's'}</span></td>
                                </tr>
                                <tr class="warmup-expand-row" id="${warmupId}" style="display:none">
                                    <td colspan="5" style="padding:0 12px 12px">${buildInlineWarmup(lift.weight, lift.type)}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    <div class="acc-display-container" id="acc-display-w${weekIdx}-d${dayIdx}"></div>
                </div>
                `;
            }).join('')}
        </div>
        `;
    }).join('');

    // Populate accessory displays
    programData.forEach((week, weekIdx) => {
        if (week.isDeload) return;
        const def = PHASE_DEFAULTS[cfg.experience]?.[week.phase];
        week.days.forEach((day, dayIdx) => {
            const mainSets = day.lifts.reduce((s, l) => s + l.sets, 0);
            refreshAccessoryDisplay(weekIdx, dayIdx, mainSets);
        });
    });

    output.scrollIntoView({ behavior: 'smooth' });
    showToast('Program generated and saved');
}

function toggleWarmup(id) {
    const row = document.getElementById(id);
    if (!row) return;
    row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
}

function showWeek(idx) {
    document.querySelectorAll('.week-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.week-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`week-section-${idx}`)?.classList.add('active');
    document.getElementById(`nav-tab-${idx}`)?.classList.add('active');
}

function editProgram() {
    document.getElementById('wizard').style.display = 'block';
    document.getElementById('program-output').style.display = 'none';
    goToStep(1);
}

function newProgram() {
    if (!confirm('Start a new program? Your current program will be cleared.')) return;
    localStorage.removeItem('customProgram');
    Object.keys(addedAccessories).forEach(k => delete addedAccessories[k]);
    // Reset cfg
    Object.assign(cfg, {
        goal: null, experience: null, programType: null, phase: null, blocks: [], includeDeload: true,
        lifts: {
            squat:    { selected: false, max: 0, sets: 4, repKey: '4-6', frequency: 2 },
            bench:    { selected: false, max: 0, sets: 4, repKey: '4-6', frequency: 3 },
            deadlift: { selected: false, max: 0, sets: 3, repKey: '4-6', frequency: 1 },
            ohp:      { selected: false, max: 0, sets: 3, repKey: '4-6', frequency: 2 }
        }
    });
    document.getElementById('wizard').style.display = 'block';
    document.getElementById('program-output').style.display = 'none';
    // Clear all selected states in wizard
    document.querySelectorAll('.choice-card.selected').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.btn-next').forEach(b => b.disabled = true);
    goToStep(1);
}

// ─── SAVE / LOAD ─────────────────────────────────────────────────
function saveCustomProgram(programData) {
    try {
        const save = {
            cfg: JSON.parse(JSON.stringify(cfg)),
            programData,
            accessories: JSON.parse(JSON.stringify(addedAccessories)),
            savedAt: Date.now()
        };
        localStorage.setItem('customProgram', JSON.stringify(save));
        localStorage.setItem('last_program_page', 'custom.html');
    } catch (e) {
        console.warn('Could not save custom program:', e);
    }
}

function loadSavedProgram() {
    try {
        const raw = localStorage.getItem('customProgram');
        if (!raw) return false;
        const save = JSON.parse(raw);
        if (!save.programData || !save.cfg) return false;
        Object.assign(cfg, save.cfg);
        // Restore accessories
        if (save.accessories) Object.assign(addedAccessories, save.accessories);
        renderProgram(save.programData);
        const daysAgo = Math.floor((Date.now() - save.savedAt) / 86400000);
        const when = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`;
        showToast(`Program restored (saved ${when})`);
        return true;
    } catch (e) {
        return false;
    }
}

// ─── UTILITIES ───────────────────────────────────────────────────
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Always try to restore a saved program first — no ?load param needed
    if (loadSavedProgram()) return;
});

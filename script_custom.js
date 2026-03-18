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
        hypertrophy: { weeks: 4, startPct: 60, jump: 5,   repKey: '8-12', recSets: 3 },
        strength:    { weeks: 4, startPct: 70, jump: 5,   repKey: '4-6',  recSets: 4 },
        peaking:     { weeks: 3, startPct: 80, jump: 5,   repKey: '1-3',  recSets: 3 }
    },
    intermediate: {
        hypertrophy: { weeks: 4, startPct: 60, jump: 2.5, repKey: '6-8',  recSets: 4 },
        strength:    { weeks: 4, startPct: 75, jump: 2.5, repKey: '4-6',  recSets: 4 },
        peaking:     { weeks: 4, startPct: 82, jump: 2.5, repKey: '1-3',  recSets: 3 }
    },
    elite: {
        hypertrophy: { weeks: 8, startPct: 65, jump: 1.5, repKey: '6-8',  recSets: 4 },
        strength:    { weeks: 6, startPct: 80, jump: 2,   repKey: '3-5',  recSets: 4 },
        peaking:     { weeks: 4, startPct: 85, jump: 1.5, repKey: '1-3',  recSets: 3 }
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

    cfg.blocks.forEach(block => {
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
    });

    if (cfg.includeDeload) {
        const days = buildDeloadDays();
        programWeeks.push({
            weekNum: programWeeks.length + 1,
            phase: 'deload',
            pct: 60,
            isDeload: true,
            days
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
        return '🔋 Deload week. Reduce sets by ~50%. Keep the weight the same — the goal is to maintain the nervous system signal while clearing accumulated fatigue. You should feel noticeably fresher by day 3.';
    }
    const phaseName = PHASE_LABELS[week.phase] || week.phase;
    if (week.weekNum === 1) {
        return `📦 Week 1 of the ${phaseName} block. Start conservative — this is your MEV (Minimum Effective Volume). Leave 2–3 reps in the tank. The goal is to sensitize your body to the stimulus, not exhaust it.`;
    }
    const isLastTrainingWeek = !week.isDeload && week.weekNum === totalWeeks - (cfg.includeDeload ? 1 : 0);
    if (isLastTrainingWeek) {
        return `🔥 Final training week of the block. This is your MRV — maximum recoverable volume. Expect fatigue. Push through with good technique. Your strongest session is after the deload, not now.`;
    }
    return `📈 Week ${week.weekNum}: Volume is ramping. Add one set compared to last week if prescribed. Focus on bar speed and quality reps over raw weight. If RPE feels 9+ on working sets, take note — you may be approaching your MRV early.`;
}

// ─── RENDERER ────────────────────────────────────────────────────
function renderProgram(programData) {
    const wizard = document.getElementById('wizard');
    const output = document.getElementById('program-output');
    wizard.style.display = 'none';
    output.style.display = 'block';

    // Title
    const exp = { novice: 'Novice', intermediate: 'Intermediate', elite: 'Elite' }[cfg.experience];
    const goalLabel = { strength: 'Strength', size: 'Size', both: 'Strength + Size' }[cfg.goal];
    const totalWeeks = programData.length;
    document.getElementById('output-title').textContent = `${goalLabel} Program`;
    document.getElementById('output-sub').textContent = `${exp} · ${cfg.programType === 'macrocycle' ? 'Full Macrocycle' : PHASE_LABELS[cfg.blocks[0].phase] + ' Block'} · ${totalWeeks} weeks`;

    // Week nav
    const navEl = document.getElementById('week-nav');
    navEl.innerHTML = programData.map((week, i) => `
        <button class="week-tab ${week.isDeload ? 'deload-tab' : ''} ${i === 0 ? 'active' : ''}"
            onclick="showWeek(${i})" id="nav-tab-${i}">
            ${week.isDeload ? '🔋 Deload' : `Wk ${week.weekNum}${week.phase !== programData[0].phase ? ` <span style="font-size:0.55em; opacity:0.6">${PHASE_LABELS[week.phase][0]}</span>` : ''}`}
        </button>
    `).join('');

    // Week sections
    const sectionsEl = document.getElementById('week-sections');
    sectionsEl.innerHTML = programData.map((week, i) => `
        <div class="week-section ${i === 0 ? 'active' : ''}" id="week-section-${i}">
            <div class="week-band">
                <div class="week-band-title">${week.isDeload ? '🔋 Deload Week' : `Week ${week.weekNum} — ${PHASE_LABELS[week.phase] || 'Training'}`}</div>
                <div class="week-band-sub">${week.isDeload ? 'Recovery' : `${week.pct}% Intensity`}</div>
            </div>
            <div class="week-note ${week.isDeload ? 'deload-note' : ''}">${getWeekNote(week, programData.length)}</div>
            ${week.days.map(day => `
                <div class="day-block">
                    <div class="day-title">${day.name}</div>
                    <table class="lifts-table">
                        <thead>
                            <tr>
                                <th>Exercise</th>
                                <th>Sets × Reps</th>
                                <th>%</th>
                                <th>Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${day.lifts.map(lift => `
                                <tr>
                                    <td class="lift-name-cell">
                                        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${LIFT_COLORS[lift.type]};margin-right:8px;vertical-align:middle"></span>
                                        ${lift.name}
                                        <span class="session-label">${lift.sessionLabel}</span>
                                    </td>
                                    <td class="sets-reps-cell">${lift.sets}×${lift.reps}</td>
                                    <td class="pct-cell">${lift.pct}%</td>
                                    <td class="weight-cell">${lift.weight} lbs</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}
        </div>
    `).join('');

    output.scrollIntoView({ behavior: 'smooth' });
    showToast('Program generated and saved');
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

// ─── SAVE / LOAD ─────────────────────────────────────────────────
function saveCustomProgram(programData) {
    try {
        const save = {
            cfg: JSON.parse(JSON.stringify(cfg)),
            programData,
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
        renderProgram(save.programData);
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
    // Check for saved program from URL param
    const params = new URLSearchParams(window.location.search);
    if (params.get('load') === '1') {
        if (loadSavedProgram()) return;
    }

    // Check if they have a recent saved program to resume
    try {
        const raw = localStorage.getItem('customProgram');
        if (raw) {
            const save = JSON.parse(raw);
            const daysSince = (Date.now() - save.savedAt) / 86400000;
            if (daysSince < 60) {
                // Silently pre-fill cfg, user still goes through wizard unless they come from redirect
            }
        }
    } catch (e) {}
});

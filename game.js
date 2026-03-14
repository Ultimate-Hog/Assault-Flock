'use strict';

// ════════════════════════════════════════════════
// BUILD / VERSION INFO
// ════════════════════════════════════════════════

// Centralized build metadata so playtests can verify the correct version.
// Update this when cutting a new build.
// [year, month, day, hour, minute]; month is 1-based for readability.
const GAME_VERSION_TIMESTAMP = [2026, 3, 14, 12, 0];

const GAME_VERSION = (() => {
  const [year, month, day, hour, minute] = GAME_VERSION_TIMESTAMP;
  const pad2 = (n) => String(n).padStart(2, '0');
  // Full timestamp-based build id: YYYYMMDDHHMM (numeric).
  const buildIdNum = Number(
    `${year}${pad2(month)}${pad2(day)}${pad2(hour)}${pad2(minute)}`
  );
  return {
    phase: 'pre-alpha',
    buildId: buildIdNum,
    timestampArray: GAME_VERSION_TIMESTAMP,
  };
})();

// ════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════

const W            = 600;
const H            = 700;
const FLOCK_X      = W / 2;
const FLOCK_Y      = H * 0.70;
const BOSS_TRIGGER = 65;     // seconds until boss spawns
const BOSS_FIGHT_Y = 300;   // px — boss parks here after entering from off-screen
const SIM_TICK     = 0.15;   // call card evaluation interval (s)
const CARD_COOLDOWN= 5.0;    // seconds before same card can re-fire
const BIRD_R            = 13;
const ENEMY_R           = 11;
const PROJ_R            = 3;
const BIRD_ICON         = '^';    // Central icon used for all bird canvas/UI visuals
const MELEE_RANGE_MULT  = 1.35;   // Global melee engagement radius multiplier
const PECK_CHARGE_MULT  = 1.8;
const PECK_BOSS_MULT    = 1.6;   // Peck cooldown multiplier when targeting boss
const PECK_MINIBOSS_MULT= 1.3;   // Peck cooldown multiplier when targeting mini-boss

// Boss melee defense
const BOSS_PARRY_WINDOW   = 0.6;   // Duration of parry state (s)
const BOSS_PARRY_COOLDOWN = 3.5;   // Time between parries (s)
const BOSS_PARRY_CHANCE   = 0.30;  // Probability parry triggers when cooldown ready
const MINI_BOSS_PARRY_CHANCE = 0.18;
const BOSS_SWEEP_RADIUS       = 80;   // px, close-range trigger for anti-melee sweep
const BOSS_SWEEP_DAMAGE       = 25;
const BOSS_SWEEP_KNOCKBACK_DIST = 180;
const BOSS_SWEEP_COOLDOWN     = 4.0;
const BOSS_SWEEP_TRIGGER_COUNT = 2;
const BOSS_SWEEP_CHARGE_UP     = 0.5;  // s before sweep executes
const BOSS_MELEE_DMG_BUDGET   = 0.06; // Fraction of boss maxHP per second from melee
const MINI_BOSS_MELEE_DMG_BUDGET = 0.10; // Lighter cap for mini-bosses
const MINI_BOSS_PARRY_WINDOW    = 0.4;
const MINI_BOSS_PARRY_COOLDOWN  = 4.0;
const MINI_BOSS_SWEEP_COOLDOWN  = 5.0;
const MINI_BOSS_SWEEP_TRIGGER_COUNT = 2;
const PARRY_PENALTY_COOLDOWN  = 1.0;  // Extra peck cooldown when parried (s)
const KNOCKBACK_RECOVERY_TIME = 1.5;  // s before melee can re-engage after knockback

const UNLOCK = {
  SPREAD_LINE:    100,
  TIER2_CARDS:    200,
  TIGHT_CLUSTER:  300,
  CARD_SLOT_4:    500,
  ECHELON:        600,
  TIER3_CARDS:    800,
};

// ════════════════════════════════════════════════
// SPECIES DATA
// ════════════════════════════════════════════════

const SPECIES = {
  danger_sparrow:   { label:'Danger Sparrow',    init:'DS', role:'Striker',     color:'#e06030', hp:65,  dmg:22, spd:1.5, range:110, atkRate:1.2, aggression:0.9, combatClass:'melee',  rangedType:null,       critChance:0.15, peelSpd:3.2, peckSpeed:1.2, peckDmgMin:14, peckDmgMax:22 },
  feathered_loiter: { label:'Feathered Loiterer',init:'FL', role:'Screen',      color:'#8aaa50', hp:42,  dmg:6,  spd:1.3, range:80,  atkRate:2.0, aggression:0.3, combatClass:'ranged', rangedType:'rapid',    critChance:0.10, peelSpd:0   },
  goth_chicken:     { label:'Goth Chicken',      init:'GC', role:'Opportunist', color:'#9955dd', hp:82,  dmg:11, spd:1.9, range:90,  atkRate:1.0, aggression:0.5, combatClass:'melee',  rangedType:null,       critChance:0.28, peelSpd:3.0, peckSpeed:1.6, peckDmgMin:8,  peckDmgMax:18 },
  angry_honker:     { label:'Angry Honker',      init:'AH', role:'Anchor',      color:'#d4860a', hp:130, dmg:38, spd:0.8, range:100, atkRate:0.3, aggression:0.4, combatClass:'melee',  rangedType:null,       critChance:0.10, peelSpd:2.8, peckSpeed:3.0, peckDmgMin:30, peckDmgMax:55 },
  wise_old_bird:    { label:'Wise Old Bird',     init:'WB', role:'Specialist',  color:'#50a0cc', hp:72,  dmg:30, spd:1.1, range:160, atkRate:0.45,aggression:0.6, combatClass:'ranged', rangedType:'sniper',   critChance:0.12, peelSpd:0   },
  beach_screamer:   { label:'Beach Screamer',    init:'BS', role:'Medic',       color:'#40c0a0', hp:95,  dmg:9,  spd:1.2, range:65,  atkRate:0.7, aggression:0.2, combatClass:'ranged', rangedType:'triple',   critChance:0.10, peelSpd:0   },
  clueless_borb:    { label:'Clueless Borb',     init:'CB', role:'Filler',      color:'#9090aa', hp:30,  dmg:4,  spd:1.0, range:80,  atkRate:0.7, aggression:0.1, combatClass:'ranged', rangedType:'rapid',    critChance:0.05, peelSpd:0   },
};

const TRAITS = {
  'Enduring':        { type:'positive', desc:'Reduced stamina drain.' },
  'Protective':      { type:'positive', desc:'Bodyblocks for nearby allies.' },
  'Vengeful':        { type:'positive', desc:'Damage boost after an ally dies.' },
  'Steady Wing':     { type:'positive', desc:'Reduced front-position penalties.' },
  'Reckless':        { type:'negative', desc:'Over-commits on attack calls.' },
  'Cautious':        { type:'negative', desc:'Delays before aggressive calls.' },
  'Hates the Front': { type:'negative', desc:'Morale penalty when leading.' },
  'Hates Drones':    { type:'negative', desc:'Morale penalty near drones; bonus damage vs drones.' },
  'Clueless':        { type:'negative', desc:'Random delay before executing Call Cards.' },
};

// ── Mid-Run Leveling & Genetic Inheritance ───────────────────
const STAT_GROWTH_RATES = { hp:0.08, dmg:0.10, spd:0.05, atkRate:0.06, critChance:0.04, peckSpeed:-0.03, peckDmgMin:0.10, peckDmgMax:0.10 };
// Max growth multiplier caps (relative to base stat, e.g. 2.0 = up to 2× base)
const STAT_GROWTH_CAPS  = { spd:2.0, atkRate:2.0, critChance:2.5, peckSpeed:0.75 };
const XP_PER_LEVEL      = (lvl) => Math.floor(50 * Math.pow(1.4, lvl - 1));
const MAX_BIRD_LEVEL    = 10;
const SCALABLE_STATS    = ['hp', 'dmg', 'spd', 'atkRate', 'critChance', 'peckSpeed', 'peckDmgMin', 'peckDmgMax'];

// ════════════════════════════════════════════════
// FORMATION OFFSETS  (relative to FLOCK_X, FLOCK_Y)
// ════════════════════════════════════════════════

const FORMATION_SLOT_NAMES = {
  flying_v:      ['Leader','Inner-L','Inner-R','Outer-L','Outer-R','Tail-L','Tail-C','Tail-R'],
  spread_line:   ['Far-L','Mid-L','L','Center-L','Center-R','R','Mid-R','Far-R'],
  tight_cluster: ['Core','Inner-L','Inner-R','Inner-C','Outer-L','Outer-CL','Outer-C','Outer-CR','Outer-R'],
  echelon:       ['Lead','Diag-1','Diag-2','Diag-3','Diag-4','Diag-5','Diag-6','Diag-7'],
  loose_swarm:   ['Pos-1','Pos-2','Pos-3','Pos-4','Pos-5','Pos-6','Pos-7','Pos-8'],
};

function getFormationOffsets(formation, count) {
  const n = Math.min(count, 8);
  switch (formation) {
    case 'flying_v': {
      const slots = [
        [  0, -78],
        [-50, -36], [ 50, -36],
        [-100,  6], [100,  6],
        [-150, 48], [  0, 48], [150, 48],
      ];
      return slots.slice(0, n);
    }
    case 'spread_line': {
      const spacing = 72;
      const startX  = -((n - 1) * spacing) / 2;
      return Array.from({ length: n }, (_, i) => [startX + i * spacing, 0]);
    }
    case 'tight_cluster': {
      const slots = [
        [0, 0],
        [-24, -20], [24, -20], [0, -32],
        [-52, -8], [-38, 28], [0, 38], [38, 28], [52, -8],
      ];
      return slots.slice(0, n);
    }
    case 'echelon': {
      return Array.from({ length: n }, (_, i) => [-80 + i * 22, -60 + i * 18]);
    }
    case 'loose_swarm':
    default: {
      return Array.from({ length: n }, (_, i) => {
        const angle = i * 2.399963;
        const r  = 30 + (i % 3) * 28 + Math.floor(i / 3) * 10;
        const jx = Math.sin(i * 137.508) * 15;
        const jy = Math.cos(i * 137.508 * 1.3) * 15;
        return [Math.cos(angle) * r + jx, Math.sin(angle) * r + jy];
      });
    }
  }
}

const FORMATION_DESCS = {
  flying_v:      'Classic wedge. Trailing birds get slipstream stamina recovery, passive HP regen, formation armor (up to 18% at deep rear), and +12% speed. Leader tires faster and takes full exposure. Weak to flanking.',
  spread_line:   '360° targeting coverage. Buff: +15% attack rate (open arcs). No armor, no slipstream. Birds spread too thin to shelter each other. Vulnerable to focused fire but handles multi-directional threats well.',
  tight_cluster: 'Maximum aura stacking from Anchors. All birds share flat 10% damage reduction. Buff: +10% damage dealt (pack aggression). Devastating AoE vulnerability — a single well-placed burst hits everyone.',
  echelon:       'Staggered diagonal. Partial slipstream with better lateral coverage than the V. Buff: +15% crit chance (flanking angle). Sheltered flank gets 8% armor. Exposed flank gets none — direction of threat matters.',
  loose_swarm:   'No fixed positions. Buff: 22% chance to dodge single-target projectiles (fluid evasion). High individual evasion — very hard to AoE effectively. No slipstream, no armor. Calls execute less predictably because bird positions are fluid.',
};

const FORMATION_LABELS = {
  flying_v:      'FLYING V',
  spread_line:   'SPREAD LINE',
  tight_cluster: 'TIGHT CLUSTER',
  echelon:       'ECHELON',
  loose_swarm:   'LOOSE SWARM',
};

const FORMATION_BUFFS = {
  flying_v:      { spdMult: 1.12,  atkRateMult: 1.0,  dmgMult: 1.0,  critBonus: 0.00, dodgeChance: 0.00 },
  spread_line:   { spdMult: 1.0,   atkRateMult: 1.15, dmgMult: 1.0,  critBonus: 0.00, dodgeChance: 0.00 },
  tight_cluster: { spdMult: 1.0,   atkRateMult: 1.0,  dmgMult: 1.10, critBonus: 0.00, dodgeChance: 0.00 },
  echelon:       { spdMult: 1.0,   atkRateMult: 1.0,  dmgMult: 1.0,  critBonus: 0.15, dodgeChance: 0.00 },
  loose_swarm:   { spdMult: 1.0,   atkRateMult: 1.0,  dmgMult: 1.0,  critBonus: 0.00, dodgeChance: 0.22 },
};

function getFormationArmor(formation, slotIdx, cohesion) {
  switch (formation) {
    case 'flying_v': {
      if (slotIdx === 0) return 1.0;
      const base = slotIdx >= 5 ? 0.18 : slotIdx >= 3 ? 0.12 : 0.06;
      return 1 - base * cohesion;
    }
    case 'tight_cluster':
      return 1 - 0.10 * cohesion;
    case 'echelon':
      return slotIdx % 2 === 1 ? (1 - 0.08 * cohesion) : 1.0;
    default:
      return 1.0;
  }
}

// ════════════════════════════════════════════════
// BOSS DATA
// ════════════════════════════════════════════════

const BOSS_POOL = {
  a: { name:'CANOPY SWEEPER', hp:700, color:'#aa3030', desc:'AoE sweeps. Switch formation to survive.' },
  b: { name:'NEST MOTHER',    hp:900, color:'#a07020', desc:'Spawns waves. Kill adds to expose it.' },
  c: { name:'PHASE WALKER',   hp:600, color:'#4050aa', desc:'Shielded/exposed phases. Attack only when exposed.' },
  d: { name:'HIGH PERCH',     hp:750, color:'#308050', desc:'Leader sniper. Rotate before shots connect.' },
};

const MINI_BOSS_POOL = {
  turret:  { name:'TURRET OVERLORD', hp:280, color:'#c07030', desc:'Armored turret, spread shot.', pattern:'spread' },
  sparrow: { name:'SPARROW ALPHA',   hp:260, color:'#e08040', desc:'Fast, charges at leader.', pattern:'charge' },
  flak:    { name:'FLAK CAPTAIN',    hp:320, color:'#8060a0', desc:'AoE burst pattern.', pattern:'burst' },
};

// ════════════════════════════════════════════════
// SPAWN SCHEDULES
// ════════════════════════════════════════════════

// legacy spawn schedule functions removed in favor of scripted waves

// ════════════════════════════════════════════════
// SAVE / LOAD  (localStorage)
// ════════════════════════════════════════════════

const SAVE_KEY = 'af_save_v7';

const STARTER_BIRDS = [
  { id:'s0', name:'Rex',      species:'danger_sparrow',   traits:['Reckless'],        xp:0, runsSurvived:0, growthModifiers:{} },
  { id:'s1', name:'Blaze',    species:'danger_sparrow',   traits:['Vengeful'],        xp:0, runsSurvived:0, growthModifiers:{} },
  { id:'s2', name:'Pidge',    species:'feathered_loiter', traits:[],                  xp:0, runsSurvived:0, growthModifiers:{} },
  { id:'s3', name:'Coo',      species:'feathered_loiter', traits:[],                  xp:0, runsSurvived:0, growthModifiers:{} },
  { id:'s4', name:'Mortimer', species:'goth_chicken',     traits:['Cautious'],        xp:0, runsSurvived:0, growthModifiers:{} },
  { id:'s5', name:'Gerald',   species:'angry_honker',     traits:['Enduring'],        xp:0, runsSurvived:0, growthModifiers:{} },
  { id:'s6', name:'Archie',   species:'wise_old_bird',    traits:['Protective'],      xp:0, runsSurvived:0, growthModifiers:{} },
  { id:'s7', name:'Sandy',    species:'beach_screamer',   traits:[],                  xp:0, runsSurvived:0, growthModifiers:{} },
];

function defaultProfile() {
  return {
    commanderXp:          0,
    seed:                 150,
    plumes:               0,
    personalBests:        {},
    hallOfFeathers:       [],
    nestPool:             [],
    nestRefreshCount:     0,
    eggLegacy:            { statBonus:0, poolSize:4, traitQuality:0 },
    geneticBuffs:         [],
    roster:               JSON.parse(JSON.stringify(STARTER_BIRDS)),
    activeRoster:         ['s0','s1','s2','s3','s4','s5','s6','s7'],
    positionAssignments:  {},
    selectedFormation:    'flying_v',
    runCount:             0,
    infiniteMode:         false,
    hardcoreMode:         false,
    callCards:            [],
  };
}

let profile = defaultProfile();

function saveProfile() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(profile)); } catch(e) { /* offline */ }
}

function abandonTerritory() {
  ['af_save_v7', 'af_save_v6', 'af_save_v5', 'af_save_v4', 'af_save_v3'].forEach(k => {
    try { localStorage.removeItem(k); } catch(e) { /* offline */ }
  });
  profile = defaultProfile();
  saveProfile();
  location.reload();
}

function loadProfile() {
  // One-time migration: v3 (scrap → seed) → v4
  try {
    const legacyRaw = localStorage.getItem('af_save_v3');
    if (legacyRaw) {
      const old = JSON.parse(legacyRaw);
      old.seed = old.scrap ?? 150;
      delete old.scrap;
      localStorage.setItem('af_save_v4', JSON.stringify(old));
      localStorage.removeItem('af_save_v3');
    }
  } catch(e) { /* ignore migration errors */ }
  // One-time migration: v4 → v5 (add geneticBuffs, growthModifiers)
  try {
    const v4Raw = localStorage.getItem('af_save_v4');
    if (v4Raw) {
      const old = JSON.parse(v4Raw);
      if (!old.geneticBuffs) old.geneticBuffs = [];
      if (old.roster) old.roster.forEach(b => { if (!b.growthModifiers) b.growthModifiers = {}; });
      localStorage.setItem('af_save_v5', JSON.stringify(old));
      localStorage.removeItem('af_save_v4');
    }
  } catch(e) { /* ignore migration errors */ }
  // One-time migration: v5 → v6 (add hardcoreMode)
  try {
    const v5Raw = localStorage.getItem('af_save_v5');
    if (v5Raw) {
      const old = JSON.parse(v5Raw);
      if (old.hardcoreMode === undefined) old.hardcoreMode = false;
      localStorage.setItem('af_save_v6', JSON.stringify(old));
      localStorage.removeItem('af_save_v5');
    }
  } catch(e) { /* ignore migration errors */ }
  // One-time migration: v6 → v7 (add callCards)
  try {
    const v6Raw = localStorage.getItem('af_save_v6');
    if (v6Raw) {
      const old = JSON.parse(v6Raw);
      if (!Array.isArray(old.callCards)) old.callCards = [];
      localStorage.setItem(SAVE_KEY, JSON.stringify(old));
      localStorage.removeItem('af_save_v6');
    }
  } catch(e) { /* ignore migration errors */ }
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const loaded = JSON.parse(raw);
      if (!loaded.geneticBuffs) loaded.geneticBuffs = [];
      if (loaded.roster) loaded.roster.forEach(b => { if (!b.growthModifiers) b.growthModifiers = {}; });
      if (loaded.hardcoreMode === undefined) loaded.hardcoreMode = false;
      if (!Array.isArray(loaded.callCards)) loaded.callCards = [];
      profile = Object.assign(defaultProfile(), loaded);
    }
  } catch(e) { profile = defaultProfile(); }
}

// ════════════════════════════════════════════════
// GAME STATE
// ════════════════════════════════════════════════

let state = {};

// ════════════════════════════════════════════════
// RUN LOG (audit / QA export)
// ════════════════════════════════════════════════

const RUN_LOG_KEY = 'af_run_logs';
const MAX_RUN_LOGS = 20;

class RunLog {
  constructor() {
    this.entries = [];
    this.runMeta = null;
  }

  begin(meta) {
    this.entries = [];
    this.runMeta = Object.assign({ startedAt: Date.now() }, meta);
    this.push('run_start', meta);
  }

  push(type, detail = {}) {
    try {
      const t = typeof state.runTime === 'number' ? Math.round(state.runTime * 1000) / 1000 : 0;
      this.entries.push({ t, type, ...detail });
    } catch (e) { /* no-op */ }
  }

  snapshot() {
    return { meta: this.runMeta, events: [...this.entries] };
  }

  flush() {
    try {
      if (state.birds) {
        this.push('run_end', {
          score: state.score,
          kills: state.kills,
          morale: Math.round(state.morale),
          success: state.runSuccess,
          survivors: state.birds.filter(b => b.alive).map(b => b.id),
        });
      }
      const record = this.snapshot();
      persistRunLog(record);
      return record;
    } catch (e) { return null; }
  }

  exportToFile() {
    if (!this.runMeta) return;
    try {
      if (state.screen === 'battle' && typeof state.runTime === 'number') {
        const wc = typeof waveController !== 'undefined' ? waveController : null;
        this.push('run_exported', {
          runTime: state.runTime,
          score: state.score,
          kills: state.kills,
          bossTriggered: state.bossTriggered,
          bossActive: state.bossActive,
          scriptDone: wc ? wc.scriptDone : false,
          pendingCmdType: wc && wc.pendingCmd ? wc.pendingCmd.type : null,
          pendingCmdGroupId: wc && wc.pendingCmd ? wc.pendingCmd.groupId : null,
          enemyCount: state.enemies ? state.enemies.filter(e => e.alive).length : 0,
          flockAliveCount: state.birds ? state.birds.filter(b => b.alive).length : 0,
          stage: state.stage,
          exportedAt: Date.now(),
        });
      }
      const record = this.snapshot();
      const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'assault-flock-run-' + new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').replace(' ', '-') + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { /* no-op */ }
  }
}

const runLog = new RunLog();

function persistRunLog(record) {
  try {
    const existing = JSON.parse(localStorage.getItem(RUN_LOG_KEY) || '[]');
    existing.push(record);
    while (existing.length > MAX_RUN_LOGS) existing.shift();
    localStorage.setItem(RUN_LOG_KEY, JSON.stringify(existing));
  } catch (e) { /* storage full or unavailable */ }
}

// ════════════════════════════════════════════════
// MCP DEBUG BRIDGE (WebSocket)
// ════════════════════════════════════════════════
//
// Optional bridge used by the Assault Flock MCP server.
// If the MCP server is not running, connection failures are ignored.
let mcpDebugSocket = null;
let mcpDebugTimer  = 0;
let mcpDebugIntervalId = null;

function initMcpDebugSocket() {
  if (typeof WebSocket === 'undefined') return;
  // Already connected or connecting
  if (mcpDebugSocket && mcpDebugSocket.readyState === 1 /* OPEN */) return;
  try {
    const sock = new WebSocket('ws://localhost:8089');
    mcpDebugSocket = sock;

    sock.onclose = () => {
      mcpDebugSocket = null;
    };

    sock.onerror = () => {
      // Ignore errors; never surface them to the player.
    };

    sock.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'command') {
          const ok = handleMcpCommand(msg);
          if (msg.requestId) {
            sock.send(JSON.stringify({
              type: 'command_ack',
              requestId: msg.requestId,
              success: !!ok,
            }));
          }
        }
      } catch (e) {
        // Ignore malformed messages.
      }
    };
  } catch (e) {
    mcpDebugSocket = null;
  }
}

function startMcpDebugPump() {
  if (typeof window === 'undefined') return;
  if (mcpDebugIntervalId != null) return;
  // Use a fixed timestep (~0.5s) so pumpMcpDebug's internal timer still works.
  mcpDebugIntervalId = window.setInterval(() => {
    try {
      pumpMcpDebug(0.5);
    } catch (e) {
      // Never let debug transport failures affect gameplay.
    }
  }, 500);
}

function handleMcpCommand(cmd) {
  const action = cmd.action;
  if (!action) return false;
  let handled = false;

  if (action === 'spawn_enemy' && cmd.enemyType) {
    spawnEnemy(String(cmd.enemyType), {});
    handled = true;
  } else if (action === 'trigger_boss') {
    if (!state.bossTriggered && !state.bossActive) {
      state.bossTriggered = true;
      spawnBoss();
      state.bossActive = true;
      handled = true;
    }
  } else if (action === 'set_speed' && typeof cmd.multiplier === 'number') {
    state.bgScrollSpeed = 55 * cmd.multiplier;
    handled = true;
  } else if (action === 'set_formation' && typeof cmd.formation === 'string') {
    triggerFormationChange(cmd.formation);
    handled = true;
  } else if (action === 'navigate' && typeof cmd.screen === 'string') {
    if (cmd.screen === 'hub' || cmd.screen === 'level-select') {
      showScreen(cmd.screen);
      if (cmd.screen === 'hub') buildHubUI();
      handled = true;
    }
  } else if (action === 'select_tab' && typeof cmd.tab === 'string') {
    const tabBtn = document.querySelector(`.hub-tab[data-tab="${cmd.tab}"]`);
    if (tabBtn) {
      tabBtn.dispatchEvent(new MouseEvent('click', { bubbles:true }));
      handled = true;
    }
  } else if (action === 'select_formation' && typeof cmd.formation === 'string') {
    const btn = document.querySelector(`.formation-btn[data-formation="${cmd.formation}"]`);
    if (btn) {
      btn.dispatchEvent(new MouseEvent('click', { bubbles:true }));
      handled = true;
    }
  } else if (action === 'set_difficulty' && typeof cmd.difficulty === 'string') {
    const btn = document.querySelector(`.difficulty-btn[data-difficulty="${cmd.difficulty}"]`);
    if (btn && !btn.classList.contains('locked')) {
      btn.dispatchEvent(new MouseEvent('click', { bubbles:true }));
      handled = true;
    }
  } else if (action === 'launch_run') {
    startRun();
    handled = true;
  } else if (action === 'retry_run') {
    retryRun();
    handled = true;
  } else if (action === 'return_to_hub') {
    showScreen('hub');
    buildHubUI();
    handled = true;
  } else if (action === 'recruit_bird' && typeof cmd.recruitId === 'string') {
    const recruit = profile.nestPool.find(r => r.id === cmd.recruitId);
    if (!recruit) return false;
    const cost = recruit.cost;
    const full = profile.roster.length >= 12;
    if (full || profile.seed < cost) return false;
    profile.seed -= cost;
    const newBird = {
      id: recruit.id,
      name: recruit.name,
      species: recruit.species,
      traits: recruit.traits || [],
      xp: 0,
      runsSurvived: 0,
      cost: recruit.cost,
      growthModifiers: recruit.growthModifiers || {},
      statMult: recruit.statMult || 1,
      variance: recruit.variance || null,
    };
    profile.roster.push(newBird);
    profile.activeRoster.push(newBird.id);
    profile.nestPool = profile.nestPool.filter(r => r.id !== recruit.id);
    if (DEBUG_RECRUIT_VARIANCE && newBird.variance) {
      console.log('recruit_variance', { birdId: newBird.id, species: newBird.species, variance: newBird.variance });
    }
    saveProfile();
    buildNestTab();
    buildRosterList();
    buildFormationTab();
    buildCurrencyDisplay();
    handled = true;
  } else if (action === 'release_bird' && typeof cmd.birdId === 'string') {
    releaseBird(cmd.birdId);
    handled = true;
  } else if (action === 'refresh_nest') {
    refreshNestPool(false);
    handled = true;
  } else if (action === 'set_call_card' && typeof cmd.slot === 'number') {
    const i = cmd.slot;
    if (i < 0 || i >= getCardSlotCount()) return false;
    if (typeof cmd.condition === 'string') {
      const condEl = document.getElementById(`card-cond-${i}`);
      if (condEl) condEl.value = cmd.condition;
    }
    if (typeof cmd.condition2 === 'string') {
      const cond2El = document.getElementById(`card-cond2-${i}`);
      if (cond2El) cond2El.value = cmd.condition2;
    }
    if (typeof cmd.condOp === 'string') {
      const opEl = document.getElementById(`card-condop-${i}`);
      if (opEl) opEl.value = cmd.condOp;
    }
    if (typeof cmd.action_name === 'string') {
      const actEl = document.getElementById(`card-act-${i}`);
      if (actEl) actEl.value = cmd.action_name;
    }
    handled = true;
  } else if (action === 'assign_position' &&
             typeof cmd.formation === 'string' &&
             typeof cmd.slotIndex === 'number' &&
             typeof cmd.birdId === 'string') {
    const key = `${cmd.formation}_${cmd.slotIndex}`;
    profile.positionAssignments[key] = cmd.birdId;
    saveProfile();
    buildFormationTab();
    handled = true;
  } else if (action === 'toggle_infinite') {
    profile.infiniteMode = !profile.infiniteMode;
    saveProfile();
    handled = true;
  } else if (action === 'abandon_territory') {
    abandonTerritory();
    handled = true;
  }

  return handled;
}

function pumpMcpDebug(dt) {
  if (!mcpDebugSocket || mcpDebugSocket.readyState !== 1 /* OPEN */) return;
  mcpDebugTimer += dt;
  if (mcpDebugTimer < 0.5) return;
  mcpDebugTimer = 0;

  // Build a lightweight profile/menu snapshot for non-battle screens so tools
  // can configure the flock and campaign from MCP.
  const profileSummary = {
    commanderXp:      profile.commanderXp,
    seed:             profile.seed,
    plumes:           profile.plumes,
    hardcoreMode:     profile.hardcoreMode,
    infiniteMode:     profile.infiniteMode,
    runCount:         profile.runCount || 0,
    selectedFormation: profile.selectedFormation,
    activeRoster:     profile.activeRoster,
    roster:           profile.roster.map(b => ({
      id:      b.id,
      name:    b.name,
      species: b.species,
      traits:  b.traits || [],
      cost:    b.cost || 0,
    })),
    nestPool:         profile.nestPool.map(r => ({
      id:      r.id,
      name:    r.name,
      species: r.species,
      cost:    r.cost,
      traits:  r.traits || [],
    })),
    geneticBuffs:     profile.geneticBuffs || [],
    availableFormations: Object.keys(FORMATION_SLOT_NAMES).filter(f => isFormationUnlocked(f)),
  };

  const menuState = {
    difficulty:      typeof selectedDifficulty === 'string' ? selectedDifficulty : state.currentDifficulty,
    infiniteMode:    profile.infiniteMode || state.infiniteMode,
    hardcoreMode:    profile.hardcoreMode,
  };

  try {
    const activeGroups = {};
    if (typeof waveController !== 'undefined' && waveController.activeGroups) {
      waveController.activeGroups.forEach((val, key) => {
        activeGroups[key] = val.ids ? val.ids.size : 0;
      });
    }
    const payload = {
      type: 'state',
      data: {
        screen: state.screen,
        runTime: state.runTime,
        score: state.score,
        kills: state.kills,
        morale: state.morale,
        formation: state.formation,
        stance: state.stance,
        stage: state.stage,
        currentLevel: state.currentLevel,
        currentDifficulty: state.currentDifficulty,
        bossTriggered: state.bossTriggered,
        bossKilled: state.bossKilled,
        profile: profileSummary,
        menu: menuState,
        birds: state.birds,
        enemies: state.enemies,
        hazards: state.hazards,
        projectiles: state.projectiles,
        boss: state.boss,
        wave: typeof waveController !== 'undefined' ? {
          scriptDone: waveController.scriptDone,
          scriptDoneTime: waveController.scriptDoneTime,
          waitTimer: waveController.waitTimer,
          pendingCmd: waveController.pendingCmd ? {
            type: waveController.pendingCmd.type,
            groupId: waveController.pendingCmd.groupId,
            count: waveController.pendingCmd.count,
          } : null,
          activeGroups,
        } : {},
        recentEvents: runLog.entries.slice(-10),
      },
    };
    mcpDebugSocket.send(JSON.stringify(payload));
  } catch (e) {
    // Never let debug transport failures affect gameplay.
  }
}


function buildRunFlock() {
  return profile.activeRoster.slice(0, 12).map((id, i) => {
    const profileBird = profile.roster.find(b => b.id === id);
    if (!profileBird) return null;
    const sp      = SPECIES[profileBird.species];
    const sMult   = profileBird.statMult || 1;
    const v       = profileBird.variance || {};
    const vm      = (key) => (v[key] != null ? v[key] : 1);
    const baseStats = {
      hp:         sp.hp         * sMult * vm('hpMult'),
      dmg:        sp.dmg        * sMult * vm('dmgMult'),
      spd:        sp.spd        * vm('spdMult'),
      atkRate:    sp.atkRate    * vm('atkRateMult'),
      critChance: Math.min(0.6, Math.max(0, sp.critChance * vm('critChanceMult'))),
    };
    if (sp.peckSpeed != null) {
      baseStats.peckSpeed   = sp.peckSpeed   * vm('peckSpeedMult');
      baseStats.peckDmgMin  = (sp.peckDmgMin ?? sp.dmg * 0.7) * sMult * vm('peckDmgMinMult');
      baseStats.peckDmgMax  = (sp.peckDmgMax ?? sp.dmg * 1.3) * sMult * vm('peckDmgMaxMult');
    }
    return {
      id, name: profileBird.name, species: profileBird.species,
      traits:          profileBird.traits || [],
      hp:              baseStats.hp, maxHp: baseStats.hp,
      stamina:         100,
      x: FLOCK_X + (i - 3.5) * 20, y: FLOCK_Y,
      targetX: FLOCK_X, targetY: FLOCK_Y,
      formationSlot:   i,
      alive:           true,
      atkCooldown:     i * 0.25,
      peckCooldown:    i * 0.25,
      healCooldown:    0,
      flashTimer:      0,
      peckAnimTimer:   0,
      slipstreamHot:   0,
      deathTime:       null,
      debuffApplied:   false,
      subflocked:      false,
      subflockTimer:   0,
      updraftTimer:    0,
      meleeState:      'idle',
      meleeTarget:     null,
      chargeDir:       { x: 0, y: -1 },
      chargeEndX:      0,
      chargeEndY:      0,
      chargeHit:       [],
      knockbackRecovery: 0,
      // Mid-run leveling
      xp:              0,
      level:           1,
      baseStats,
      growthModifiers: profileBird.growthModifiers || {},
      liveSp:          null,
    };
  }).filter(Boolean);
}

// Prunes state.birds to only the birds actually assigned to a formation slot,
// then injects Clueless Borb entities for every slot assigned to 'borb'.
// Must be called after initState() and after the position-assignment loop.
function finalizeFlockForFormation(formation) {
  const slotNames = FORMATION_SLOT_NAMES[formation] || [];

  // Build the set of real bird IDs that are effectively assigned to a slot
  // (explicit positionAssignments take priority; activeRoster[i] is the fallback default)
  const assignedBirdIds = new Set(
    slotNames.map((_, i) => {
      const key = `${formation}_${i}`;
      return profile.positionAssignments[key] || profile.activeRoster[i] || '';
    }).filter(id => id && id !== 'borb')
  );

  // Remove any roster bird that has no formation slot — they should not enter battle
  state.birds = state.birds.filter(b => assignedBirdIds.has(b.id));

  // Inject borbs for slots explicitly assigned to 'borb'
  injectBorbsForFormation(formation);
}

// Injects a Clueless Borb combat entity for every position slot assigned to 'borb'.
// Called after initState() so state.birds already contains real roster birds.
function injectBorbsForFormation(formation) {
  const slotNames = FORMATION_SLOT_NAMES[formation] || [];
  slotNames.forEach((_, i) => {
    const key = `${formation}_${i}`;
    if (profile.positionAssignments[key] !== 'borb') return;
    const sp        = SPECIES['clueless_borb'];
    const baseStats = { hp: sp.hp, dmg: sp.dmg, spd: sp.spd, atkRate: sp.atkRate, critChance: sp.critChance };
    state.birds.push({
      id:            'borb_' + i,
      name:          'Borb',
      species:       'clueless_borb',
      traits:        ['Clueless'],
      hp:            sp.hp, maxHp: sp.hp,
      stamina:       100,
      x: FLOCK_X + (i - 3.5) * 20, y: FLOCK_Y,
      targetX: FLOCK_X, targetY: FLOCK_Y,
      formationSlot: i, alive: true,
      atkCooldown:   i * 0.25, healCooldown: 0,
      flashTimer:    0, peckAnimTimer: 0, slipstreamHot: 0,
      deathTime:     null, debuffApplied: false,
      subflocked:    false, subflockTimer: 0,
      updraftTimer:  0, meleeState: 'idle',
      meleeTarget:   null, chargeDir: { x: 0, y: -1 },
      chargeEndX:    0, chargeEndY: 0, chargeHit: [],
      knockbackRecovery: 0,
      xp: 0, level: 1, baseStats,
      growthModifiers: {}, liveSp: null, isBorb: true,
    });
  });
}

function initState(keepCards, keepFormation) {
  const savedCards = keepCards ? state.callCards : null;
  const diff       = (keepFormation && state.currentDifficulty) || 'normal';
  const formation  = (keepFormation && state.formation)         || profile.selectedFormation;

  state = {
    screen:            'hub',
    birds:             buildRunFlock(),
    enemies:           [],
    projectiles:       [],
    hazards:           [],
    callCards:         savedCards || [],
    formation,
    stance:            'normal',
    morale:            75,
    moraleCollapseTimer: 0,
    moraleCollapse:    false,
    score:             0,
    kills:             0,
    runTime:           0,
    bgOffset:          0,
    bgScrollSpeed:     55,
    simTimer:          0,
    cardFlash:         [0, 0, 0, 0],
    cardCooldowns:     [0, 0, 0, 0],
    focusTarget:       null,
    isReorganizing:    false,
    reorgTimer:        0,
    enemyId:           0,
    projId:            0,
    lostBirds:         [],
    runSuccess:        false,
    bossKilled:        false,
    bossActive:        false,
    bossTriggered:     false,
    boss:              null,
    miniBoss:          null,
    subflock:          [],
    crosswindX:        0,
    crosswindTimer:    0,
    totalSlipstreamHealing: 0,
    floatTexts:        [],
    peckSparks:        [],
    projHitSparks:     [],
    muzzleFlashes:     [],
    currentLevel:      1,
    currentDifficulty: diff,
    diffMult:          diff === 'brutal' ? 1.5 : diff === 'hard' ? 1.2 : 1.0,
    stage:             1,
    infiniteLoop:      0,
    infiniteMode:      profile.infiniteMode || false,
    bossForStage:      {},
    camera: { zoom:1.0, panX:0, panY:0, followId:null },
    heartbeatLastT:    0,
    damageSnapshotLastT: 0,
  };
}

// ════════════════════════════════════════════════
// ENEMY CREATION
// ════════════════════════════════════════════════

function spawnEnemy(type, extra) {
  const x  = extra?.x ?? (60 + Math.random() * (W - 120));
  const id = ++state.enemyId;
  const dm = state.diffMult;
  let enemy = null;

  if (type === 'drone') {
    enemy = {
      id, type:'drone',
      hp:48*dm, maxHp:48*dm, x, y:-30,
      vx:(Math.random()-0.5)*1.2, vy:1.4,
      alive:true, atkCooldown:0.8+Math.random(),
      flashTimer:0, state:'idle',
    };

  } else if (type === 'turret') {
    enemy = {
      id, type:'turret',
      hp:130*dm, maxHp:130*dm, x, y:-25,
      vx:0, vy:0.35,
      alive:true, atkCooldown:2.0+Math.random()*1.5,
      flashTimer:0, state:'idle',
    };

  } else if (type === 'sparrow') {
    enemy = {
      id, type:'sparrow',
      hp:85*dm, maxHp:85*dm, x, y:-30,
      vx:(Math.random()-0.5)*1.0, vy:0.9,
      alive:true, atkCooldown:1.5+Math.random(),
      flashTimer:0, state:'idle',
    };

  } else if (type === 'flak') {
    enemy = {
      id, type:'flak',
      hp:110*dm, maxHp:110*dm, x, y:-35,
      vx:(Math.random()-0.5)*0.5, vy:0.25,
      alive:true, atkCooldown:3.5+Math.random()*3.0,
      chargeTimer:0, chargeRadius:0,
      flashTimer:0, state:'idle',
    };

  } else if (type === 'sniper') {
    enemy = {
      id, type:'sniper',
      hp:95*dm, maxHp:95*dm, x, y:-25,
      vx:0, vy:0.3,
      alive:true, atkCooldown:3.0,
      chargeTimer:0, targetBirdId:null,
      flashTimer:0, state:'idle',
    };
  }

  if (!enemy) return null;

  if (extra) {
    if (extra.pathFn) {
      enemy.pathFn = extra.pathFn;
      enemy.pathTime = 0;
      enemy.spawnX = extra.x != null ? extra.x : enemy.x;
      enemy.spawnY = extra.y != null ? extra.y : enemy.y;
    }
    Object.assign(enemy, extra);
  }

  state.enemies.push(enemy);
  return enemy;
}

function spawnHazard(type) {
  runLog.push('hazard_spawn', { hazardType: type });
  if (type === 'hazard_glare') {
    state.hazards.push({ type:'glare_zone', x:0, y:-80, w:W, h:80, vy:40, duration:3.5, timer:0, alive:true });
  } else if (type === 'hazard_turbine') {
    const x = 100 + Math.random() * (W - 200);
    state.hazards.push({ type:'turbine_blade', x, y:-60, r:45, angle:0, vy:30, alive:true });
  } else if (type === 'hazard_updraft') {
    const x = 100 + Math.random() * (W - 200);
    state.hazards.push({ type:'updraft', x, y:0, w:50, duration:6.0, timer:0, alive:true });
  } else if (type === 'hazard_crosswind') {
    state.crosswindX    = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.6);
    state.crosswindTimer = 3.5;
  }
}

// ════════════════════════════════════════════════
// BOSS CREATION
// ════════════════════════════════════════════════

function spawnBoss() {
  if (state.boss?.alive) return;
  const types = ['a','b','c','d'];
  const type  = state.bossForStage?.[state.stage] || types[Math.floor(Math.random() * types.length)];
  const data  = BOSS_POOL[type];
  const dm    = state.diffMult;
  state.boss = {
    type, name:data.name, color:data.color,
    hp:data.hp*dm, maxHp:data.hp*dm,
    x:W/2, y:-80,
    vx:0.8, vy:1.0,
    entering:true,
    phase:0, phaseTimer:0,
    state:'idle',
    atkCooldown:2.5,
    sweepRadius:0, sweepExpanding:false,  // Boss A
    addTimer:6.0,                          // Boss B
    shieldTimer:5.0,                       // Boss C
    chargeTimer:0, laserTargetId:null,     // Boss D
    flashTimer:0,
    alive:true,
    debuffed:false, debuffTimer:0,
    // Melee defense
    parryTimer:0, parryCooldown:0, parryActive:false,
    meleeDmgThisTick:0,
    sweepMeleeCooldown:0, sweepMeleeCharging:false, sweepMeleeTimer:0, sweepMeleeRadius:0,
  };
  state.bossActive   = true;
  state.bossTriggered = true;
  runLog.push('boss_spawn', { bossType: type, bossName: data.name, hp: state.boss.hp });
}

function spawnMiniBoss(type) {
  const key = type in MINI_BOSS_POOL ? type : 'turret';
  const data = MINI_BOSS_POOL[key];
  const dm = state.diffMult;
  const x = 80 + Math.random() * (W - 160);
  state.miniBoss = {
    type: key,
    name: data.name,
    color: data.color,
    pattern: data.pattern || 'spread',
    hp: data.hp * dm,
    maxHp: data.hp * dm,
    x, y: 20,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 0.55,
    alive: true,
    spawnTime: typeof state.runTime === 'number' ? state.runTime : 0,
    atkCooldown: 2.0,
    phase: 0,
    phaseTimer: 0,
    flashTimer: 0,
    chargeTimer: 0,
    debuffed: false,
    debuffTimer: 0,
    parryTimer: 0, parryCooldown: 0, parryActive: false,
    meleeDmgThisTick: 0,
    sweepMeleeCooldown: 0, sweepMeleeCharging: false, sweepMeleeTimer: 0, sweepMeleeRadius: 0,
  };
  runLog.push('miniboss_spawn', { miniType: key, hp: state.miniBoss.hp });
}

// ════════════════════════════════════════════════
// UTILITY
// ════════════════════════════════════════════════

function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx*dx + dy*dy);
}

function fireProj(fromX, fromY, toX, toY, dmg, owner, color, debuffing, rangedType, ownerBird) {
  const d    = dist(fromX, fromY, toX, toY) || 1;
  const baseSpd = rangedType === 'rapid' ? 6.5 : rangedType === 'sniper' ? 4.0 : owner === 'bird' ? 5.5 : 3.8;
  const cx   = state.crosswindTimer > 0 ? state.crosswindX * 0.5 : 0;
  const trail = (rangedType === 'sniper' || rangedType === 'rapid' || rangedType === null) ? [] : null;
  const baseR = rangedType === 'rapid' ? 2 : rangedType === 'sniper' ? 5 : PROJ_R;
  const lvl   = ownerBird?.level || 1;
  if (owner === 'bird') {
    const aimAngle = Math.atan2(toY - fromY, toX - fromX);
    (state.muzzleFlashes || (state.muzzleFlashes = [])).push({
      x: fromX, y: fromY, aimAngle, color: color || '#a0e060',
      timer: 0.08, maxTimer: 0.08,
    });
  }
  state.projectiles.push({
    id: ++state.projId,
    x: fromX, y: fromY,
    vx: (toX - fromX) / d * baseSpd + cx,
    vy: (toY - fromY) / d * baseSpd,
    dmg, owner, color, alive:true,
    debuffing: !!debuffing,
    rangedType: rangedType || null,
    trail,
    r: baseR * (1 + 0.06 * (lvl - 1)),
    ownerBird: ownerBird || null,
  });
}

function spawnFloatText(x, y, text, color, fontSize) {
  state.floatTexts.push({
    x, y,
    text,
    color: color || '#ffe060',
    timer: 1.2,
    maxTimer: 1.2,
    fontSize: fontSize || 11,
  });
}

function spawnPeckSparks(x, y, color) {
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 60;
    state.peckSparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.2,
      color: color || '#e0e0a0',
    });
  }
}

function spawnProjHitSparks(x, y, color) {
  const n = 3 + Math.floor(Math.random() * 2);
  const arr = state.projHitSparks || (state.projHitSparks = []);
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 28 + Math.random() * 40;
    arr.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.18,
      color: color || '#e0e0a0',
    });
  }
}

// ════════════════════════════════════════════════
// WAVE CONTROLLER
// ════════════════════════════════════════════════

class WaveController {
  constructor() {
    this.levelScripts = {};
    this.current = null;
    this.ctx = null;
    this.waitTimer = 0;
    this.activeGroups = new Map();
    this.scriptDone = false;
    this.scriptDoneTime = 0;
    this.pendingCmd = null;
  }

  registerLevel(key, scriptFn) {
    this.levelScripts[key] = scriptFn;
  }

  startLevel(level, difficulty) {
    const key = `${level}:${difficulty}`;
    const scriptFn =
      this.levelScripts[key] ||
      this.levelScripts[`${level}:normal`] ||
      null;
    if (!scriptFn) {
      this.current = null;
      this.ctx = null;
      this.waitTimer = 0;
      this.activeGroups.clear();
      this.scriptDone = false;
      this.scriptDoneTime = 0;
      this.pendingCmd = null;
      return;
    }
    this.ctx = this.buildContext(level, difficulty);
    this.current = scriptFn(this.ctx);
    this.waitTimer = 0;
    this.activeGroups.clear();
    this.scriptDone = false;
    this.scriptDoneTime = 0;
    this.pendingCmd = null;
  }

  buildContext(level, difficulty) {
    return {
      level,
      difficulty,
      spawnGroup: (groupId, spawnFn) => {
        const ids = [];
        spawnFn((type, extra = {}) => {
          const enemy = spawnEnemy(type, extra);
          if (enemy && enemy.id != null) ids.push(enemy.id);
        });
        this.activeGroups.set(groupId, { ids: new Set(ids) });
        runLog.push('wave_spawn', { groupId, count: ids.length });
      },
      isGroupCleared: (groupId) => {
        const g = this.activeGroups.get(groupId);
        if (!g || !g.ids || g.ids.size === 0) return true;
        // Sync group membership with actual enemy state in case any deaths were missed
        for (const id of Array.from(g.ids)) {
          const enemy = state.enemies.find(e => e.id === id);
          if (!enemy || !enemy.alive) {
            g.ids.delete(id);
          }
        }
        return g.ids.size === 0;
      },
      enemiesAlive: () => state.enemies.filter(e => e.alive).length,
      waitSeconds: (seconds) => ({ type: 'wait', seconds }),
      waitUntilGroupCleared: (groupId) => ({ type: 'waitGroup', groupId }),
      waitUntilEnemiesBelow: (count) => ({ type: 'waitEnemies', count }),
      triggerBoss: () => ({ type: 'boss' }),
      triggerMiniBoss: (type) => ({ type: 'miniBoss', miniType: type }),
      waitUntilMiniBossDead: () => ({ type: 'waitMiniBoss' }),
      spawnHazard: (type) => { spawnHazard(type); },
      text: (msg, color = '#ffffff') => ({ type: 'floatText', msg, color }),
    };
  }

  markEnemyDead(enemyId) {
    if (!enemyId) return;
    for (const group of this.activeGroups.values()) {
      group.ids.delete(enemyId);
    }
  }

  tick(dt, runTime) {
    if (!this.current) return;

    if (this.waitTimer > 0) {
      this.waitTimer -= dt;
      if (this.waitTimer > 0) return;
      this.waitTimer = 0;
    }

    // Re-check pending condition wait before advancing the generator
    if (this.pendingCmd) {
      const cmd = this.pendingCmd;
      let conditionMet = false;
      if (cmd.type === 'waitGroup') {
        conditionMet = this.ctx.isGroupCleared(cmd.groupId);
      } else if (cmd.type === 'waitEnemies') {
        conditionMet = this.ctx.enemiesAlive() <= cmd.count;
      } else if (cmd.type === 'waitMiniBoss') {
        conditionMet = !state.miniBoss?.alive;
      }
      if (!conditionMet) return;
      if (cmd.type === 'waitGroup') runLog.push('wave_cleared', { groupId: cmd.groupId });
      this.pendingCmd = null;
      // Advance past the yield that produced this command
      const step = this.current.next();
      if (step.done) {
        this.scriptDone = true;
        this.scriptDoneTime = typeof runTime === 'number' ? runTime : 0;
        runLog.push('script_done', { stage: state.stage });
      }
      return;
    }

    let step = this.current.next();
    while (!step.done) {
      const cmd = step.value;
      if (!cmd) {
        step = this.current.next();
        continue;
      }

      if (cmd.type === 'wait') {
        this.waitTimer = cmd.seconds;
        return;
      }
      if (cmd.type === 'waitGroup') {
        if (!this.ctx.isGroupCleared(cmd.groupId)) {
          this.pendingCmd = cmd;
          return;
        }
      } else if (cmd.type === 'waitEnemies') {
        if (this.ctx.enemiesAlive() > cmd.count) {
          this.pendingCmd = cmd;
          return;
        }
      } else if (cmd.type === 'boss') {
        spawnBoss();
      } else if (cmd.type === 'miniBoss') {
        spawnMiniBoss(cmd.miniType || 'turret');
      } else if (cmd.type === 'waitMiniBoss') {
        if (state.miniBoss?.alive) {
          this.pendingCmd = cmd;
          return;
        }
      } else if (cmd.type === 'hazard') {
        spawnHazard(cmd.hazardType || 'hazard_glare');
      } else if (cmd.type === 'floatText') {
        spawnFloatText(W / 2, H / 2, cmd.msg, cmd.color);
      }

      step = this.current.next();
    }

    if (step.done) {
      this.scriptDone = true;
      this.scriptDoneTime = typeof runTime === 'number' ? runTime : 0;
      runLog.push('script_done', { stage: state.stage });
    }
  }
}

const waveController = new WaveController();

// ════════════════════════════════════════════════
// WAVE SCRIPTS
// ════════════════════════════════════════════════

function* level1NormalScript(ctx) {
  // Phase 1: Drone Introduction (0:00 - ~0:45)
  yield ctx.text('DRONE SWARMS INCOMING', '#c0ff80');
  yield ctx.waitSeconds(3);
  for (let wave = 0; wave < 4; wave++) {
    const groupId = `l1_drones_${wave}`;
    ctx.spawnGroup(groupId, (spawn) => {
      const count = 3 + wave * 2;
      for (let i = 0; i < count; i++) spawn('drone', {});
    });
    yield ctx.waitSeconds(10);
  }

  // Phase 2: Sparrow Skirmish (~0:45 - ~1:25)
  yield ctx.text('SPARROW SKIRMISH', '#8aaa50');
  yield ctx.waitSeconds(2);
  ctx.spawnHazard('hazard_crosswind');
  for (let w = 0; w < 3; w++) {
    const g = `l1_sparrows_${w}`;
    ctx.spawnGroup(g, (spawn) => {
      for (let i = 0; i < 4 + w; i++) spawn('sparrow', {});
    });
    yield ctx.waitSeconds(12);
  }

  // Phase 3: Mixed Assault (~1:25 - ~2:15)
  yield ctx.text('MIXED ASSAULT', '#c0c0ff');
  yield ctx.waitSeconds(2);
  const mix1 = 'l1_mix1';
  ctx.spawnGroup(mix1, (spawn) => {
    for (let i = 0; i < 4; i++) spawn('sparrow', {});
    for (let i = 0; i < 6; i++) spawn('drone', {});
  });
  yield ctx.waitUntilGroupCleared(mix1);
  yield ctx.waitSeconds(6);
  const mix2 = 'l1_mix2';
  ctx.spawnGroup(mix2, (spawn) => {
    for (let i = 0; i < 3; i++) spawn('sparrow', {});
    for (let i = 0; i < 6; i++) spawn('drone', {});
  });
  yield ctx.waitUntilGroupCleared(mix2);

  // Phase 4: Turret Corridor (~2:15 - ~3:00)
  yield ctx.text('TURRET NESTS AHEAD', '#ffbf40');
  yield ctx.waitSeconds(2);
  const turretGroup = 'l1_turrets_main';
  ctx.spawnGroup(turretGroup, (spawn) => {
    for (let col = 0; col < 4; col++) spawn('turret', {});
  });
  yield ctx.waitUntilGroupCleared(turretGroup);

  // Phase 5: Sniper Nest (~3:00)
  yield ctx.text('SNIPER NEST', '#408050');
  yield ctx.waitSeconds(2);
  const sniperGroup = 'l1_snipers';
  ctx.spawnGroup(sniperGroup, (spawn) => {
    spawn('sniper', {}); spawn('sniper', {});
    spawn('turret', {}); spawn('turret', {});
  });
  yield ctx.waitUntilGroupCleared(sniperGroup);

  // First Mini-Boss at ~3:00+
  yield ctx.text('TURRET OVERLORD', '#c07030');
  yield ctx.waitSeconds(1.5);
  yield ctx.triggerMiniBoss('turret');
  yield ctx.waitUntilMiniBossDead();

  // Phase 6: Escalation (~3:30 - ~4:00)
  yield ctx.text('ESCALATION', '#c0a030');
  yield ctx.waitSeconds(2);
  ctx.spawnHazard('hazard_crosswind');
  const esc1 = 'l1_esc1';
  ctx.spawnGroup(esc1, (spawn) => {
    for (let i = 0; i < 4; i++) spawn('drone', {});
    for (let i = 0; i < 2; i++) spawn('sparrow', {});
    spawn('flak', {});
  });
  yield ctx.waitSeconds(8);
  const esc2 = 'l1_esc2';
  ctx.spawnGroup(esc2, (spawn) => {
    for (let i = 0; i < 3; i++) spawn('sparrow', {});
    spawn('flak', {}); spawn('turret', {});
  });
  yield ctx.waitUntilGroupCleared(esc2);

  // Second Mini-Boss (~4:00)
  yield ctx.text('SPARROW ALPHA', '#e08040');
  yield ctx.waitSeconds(1.5);
  yield ctx.triggerMiniBoss('sparrow');
  yield ctx.waitUntilMiniBossDead();

  // Phase 8: Pre-boss gauntlet (~4:15 - ~4:30)
  yield ctx.text('FINAL PUSH', '#ff8080');
  yield ctx.waitSeconds(2);
  const gauntlet = 'l1_gauntlet';
  ctx.spawnGroup(gauntlet, (spawn) => {
    for (let i = 0; i < 4; i++) spawn('drone', {});
    for (let i = 0; i < 3; i++) spawn('sparrow', {});
    spawn('turret', {}); spawn('flak', {});
  });
  yield ctx.waitUntilEnemiesBelow(4);
  yield ctx.waitSeconds(2);
  yield ctx.text('BOSS APPROACHING', '#ff8080');
  yield ctx.waitSeconds(1.5);
  yield ctx.triggerBoss();
}

function* level2NormalScript(ctx) {
  // Phase 1: Canopy intro — drones + sparrows (~0:00 - ~1:00)
  yield ctx.text('THE CANOPY', '#8aaa50');
  yield ctx.waitSeconds(3);
  for (let wave = 0; wave < 4; wave++) {
    const groupId = `l2_intro_${wave}`;
    ctx.spawnGroup(groupId, (spawn) => {
      for (let i = 0; i < 2 + wave; i++) spawn('drone', {});
      for (let i = 0; i < 2 + wave; i++) spawn('sparrow', {});
    });
    yield ctx.waitSeconds(12);
  }

  // Phase 2: Sparrow formations + glare (~1:00 - ~1:45)
  yield ctx.text('SPARROW FORMATIONS', '#8aaa50');
  yield ctx.waitSeconds(2);
  for (let w = 0; w < 3; w++) {
    ctx.spawnHazard('hazard_glare');
    const g = `l2_sparrows_${w}`;
    ctx.spawnGroup(g, (spawn) => {
      for (let i = 0; i < 4 + w; i++) spawn('sparrow', {});
    });
    yield ctx.waitSeconds(12);
  }

  // Phase 3: Turret corridor (~1:45 - ~2:30)
  yield ctx.text('TURRET NESTS', '#ffbf40');
  yield ctx.waitSeconds(2);
  const turretGroup = 'l2_turrets';
  ctx.spawnGroup(turretGroup, (spawn) => {
    for (let col = 0; col < 5; col++) spawn('turret', {});
  });
  yield ctx.waitUntilGroupCleared(turretGroup);

  // Phase 4: Flak + turrets (~2:30 - ~3:00)
  yield ctx.text('FLAK AND TURRETS', '#c0a030');
  yield ctx.waitSeconds(2);
  const flakGroup = 'l2_flak';
  ctx.spawnGroup(flakGroup, (spawn) => {
    spawn('flak', {}); spawn('flak', {});
    spawn('turret', {}); spawn('turret', {});
  });
  yield ctx.waitUntilGroupCleared(flakGroup);

  // First Mini-Boss at ~3:00
  yield ctx.text('FLAK CAPTAIN', '#8060a0');
  yield ctx.waitSeconds(1.5);
  yield ctx.triggerMiniBoss('flak');
  yield ctx.waitUntilMiniBossDead();

  // Phase 5: Drone walls + turbines (~3:15 - ~3:55)
  yield ctx.text('DRONE WALL', '#40c0b0');
  yield ctx.waitSeconds(2);
  ctx.spawnHazard('hazard_turbine');
  const wall1 = 'l2_wall1';
  ctx.spawnGroup(wall1, (spawn) => {
    for (let i = 0; i < 8; i++) spawn('drone', {});
  });
  yield ctx.waitSeconds(10);
  ctx.spawnHazard('hazard_turbine');
  const wall2 = 'l2_wall2';
  ctx.spawnGroup(wall2, (spawn) => {
    for (let i = 0; i < 6; i++) spawn('drone', {});
    spawn('turret', {}); spawn('turret', {});
  });
  yield ctx.waitUntilGroupCleared(wall2);

  // Phase 6: Sniper cover (~3:55 - ~4:15)
  yield ctx.text('SNIPER COVER', '#308050');
  yield ctx.waitSeconds(2);
  const nest = 'l2_nest';
  ctx.spawnGroup(nest, (spawn) => {
    spawn('sniper', {}); spawn('sniper', {});
    spawn('flak', {}); spawn('turret', {});
  });
  yield ctx.waitUntilGroupCleared(nest);

  // Second Mini-Boss (~4:15)
  yield ctx.text('TURRET OVERLORD', '#c07030');
  yield ctx.waitSeconds(1.5);
  yield ctx.triggerMiniBoss('turret');
  yield ctx.waitUntilMiniBossDead();

  // Phase 7: Assault + updraft (~4:30 - ~5:00)
  yield ctx.text('ASSAULT', '#ff8040');
  yield ctx.waitSeconds(2);
  ctx.spawnHazard('hazard_updraft');
  const assault = 'l2_assault';
  ctx.spawnGroup(assault, (spawn) => {
    for (let i = 0; i < 4; i++) spawn('sparrow', {});
    for (let i = 0; i < 4; i++) spawn('drone', {});
    spawn('flak', {}); spawn('flak', {});
  });
  yield ctx.waitUntilEnemiesBelow(3);
  yield ctx.waitSeconds(2);
  yield ctx.text('BOSS APPROACHING', '#ff8080');
  yield ctx.waitSeconds(1.5);
  yield ctx.triggerBoss();
}

function* level3NormalScript(ctx) {
  // Phase 1: Roost intro — mixed waves (~0:00 - ~1:10)
  yield ctx.text('THE ROOST', '#aa3080');
  yield ctx.waitSeconds(3);
  for (let w = 0; w < 4; w++) {
    const g = `l3_mix_${w}`;
    ctx.spawnGroup(g, (spawn) => {
      for (let i = 0; i < 3 + w; i++) spawn('drone', {});
      for (let i = 0; i < 3 + w; i++) spawn('sparrow', {});
    });
    yield ctx.waitSeconds(14);
  }

  // Phase 2: Sniper + sparrow pincer (~1:10 - ~2:00)
  yield ctx.text('PINCER', '#408050');
  yield ctx.waitSeconds(2);
  const pincer = 'l3_pincer';
  ctx.spawnGroup(pincer, (spawn) => {
    spawn('sniper', {}); spawn('sniper', {});
    for (let i = 0; i < 5; i++) spawn('sparrow', {});
  });
  yield ctx.waitUntilGroupCleared(pincer);
  yield ctx.waitSeconds(6);
  const pincer2 = 'l3_pincer2';
  ctx.spawnGroup(pincer2, (spawn) => {
    spawn('sniper', {}); spawn('turret', {});
    for (let i = 0; i < 4; i++) spawn('sparrow', {});
  });
  yield ctx.waitUntilGroupCleared(pincer2);

  // First Mini-Boss at ~2:30+
  yield ctx.text('SPARROW ALPHA', '#e08040');
  yield ctx.waitSeconds(1.5);
  yield ctx.triggerMiniBoss('sparrow');
  yield ctx.waitUntilMiniBossDead();

  // Phase 3: Full spectrum + hazards (~3:00 - ~3:50)
  yield ctx.text('FULL SPECTRUM', '#c0a030');
  yield ctx.waitSeconds(2);
  ctx.spawnHazard('hazard_glare');
  ctx.spawnHazard('hazard_crosswind');
  const full1 = 'l3_full1';
  ctx.spawnGroup(full1, (spawn) => {
    for (let i = 0; i < 4; i++) spawn('drone', {});
    spawn('turret', {}); spawn('flak', {}); spawn('sparrow', {});
  });
  yield ctx.waitSeconds(10);
  const full2 = 'l3_full2';
  ctx.spawnGroup(full2, (spawn) => {
    for (let i = 0; i < 3; i++) spawn('drone', {});
    spawn('sniper', {}); spawn('turret', {}); spawn('flak', {});
  });
  yield ctx.waitUntilGroupCleared(full2);

  // Phase 4: Elite combat (~3:50 - ~4:20)
  yield ctx.text('ELITE COMBAT', '#ff6060');
  yield ctx.waitSeconds(2);
  const elite = 'l3_elite';
  ctx.spawnGroup(elite, (spawn) => {
    spawn('turret', {}); spawn('turret', {});
    spawn('flak', {}); spawn('flak', {});
    spawn('sniper', {}); spawn('sniper', {});
  });
  yield ctx.waitUntilGroupCleared(elite);

  // Second Mini-Boss (~4:20)
  yield ctx.text('FLAK CAPTAIN', '#8060a0');
  yield ctx.waitSeconds(1.5);
  yield ctx.triggerMiniBoss('flak');
  yield ctx.waitUntilMiniBossDead();

  // Phase 5: Finale gauntlet (~4:35 - ~5:00)
  yield ctx.text('FINALE', '#ff4040');
  yield ctx.waitSeconds(2);
  const finale = 'l3_finale';
  ctx.spawnGroup(finale, (spawn) => {
    for (let i = 0; i < 4; i++) spawn('drone', {});
    for (let i = 0; i < 3; i++) spawn('sparrow', {});
    spawn('turret', {}); spawn('flak', {}); spawn('sniper', {});
  });
  yield ctx.waitUntilEnemiesBelow(4);
  yield ctx.waitSeconds(2);
  yield ctx.text('BOSS APPROACHING', '#ff8080');
  yield ctx.waitSeconds(1.5);
  yield ctx.triggerBoss();
}

function fireProjAngled(fromX, fromY, toX, toY, angleOffsetRad, dmg, owner, color, debuffing, rangedType, ownerBird) {
  const d   = dist(fromX, fromY, toX, toY) || 1;
  const baseAngle = Math.atan2(toY - fromY, toX - fromX);
  const a   = baseAngle + angleOffsetRad;
  const baseSpd = rangedType === 'rapid' ? 6.5 : rangedType === 'sniper' ? 4.0 : owner === 'bird' ? 5.5 : 3.8;
  const cx  = state.crosswindTimer > 0 ? state.crosswindX * 0.5 : 0;
  const baseR = rangedType === 'rapid' ? 2 : rangedType === 'sniper' ? 5 : PROJ_R;
  const lvl   = ownerBird?.level || 1;
  if (owner === 'bird') {
    (state.muzzleFlashes || (state.muzzleFlashes = [])).push({
      x: fromX, y: fromY, aimAngle: a, color: color || '#a0e060',
      timer: 0.08, maxTimer: 0.08,
    });
  }
  state.projectiles.push({
    id: ++state.projId,
    x: fromX, y: fromY,
    vx: Math.cos(a) * baseSpd + cx,
    vy: Math.sin(a) * baseSpd,
    dmg, owner, color, alive:true,
    debuffing: !!debuffing,
    rangedType: rangedType || null,
    trail: null,
    r: baseR * (1 + 0.06 * (lvl - 1)),
    ownerBird: ownerBird || null,
  });
}

function hexToRgb(hex) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

// ════════════════════════════════════════════════
// FORMATION
// ════════════════════════════════════════════════

function updateFormationTargets() {
  const alive   = state.birds.filter(b => b.alive && !b.subflocked);
  const offsets = getFormationOffsets(state.formation, alive.length);
  alive
    .sort((a, b) => a.formationSlot - b.formationSlot)
    .forEach((bird, i) => {
      const off = offsets[i] || [0, 0];
      bird.targetX = FLOCK_X + off[0];
      bird.targetY = FLOCK_Y + off[1];
    });
}

function triggerFormationChange(newFormation) {
  const from = state.formation;
  state.formation     = newFormation;
  state.isReorganizing = true;
  state.reorgTimer    = 1.8;
  runLog.push('formation_change', { from, to: newFormation });
  updateFormationTargets();
  const el = document.getElementById('hud-formation');
  if (el) el.textContent = FORMATION_LABELS[newFormation] || newFormation.toUpperCase();
}

function rotateLeader() {
  const alive = state.birds.filter(b => b.alive && !b.subflocked);
  if (alive.length < 2) return;
  const leader  = alive.find(b => b.formationSlot === 0);
  if (!leader) return;
  const maxSlot = Math.max(...alive.map(b => b.formationSlot));
  leader.formationSlot = maxSlot + 1;
  alive.sort((a, b) => a.formationSlot - b.formationSlot).forEach((b, i) => { b.formationSlot = i; });
  updateFormationTargets();
}

// ════════════════════════════════════════════════
// CALL CARD SYSTEM
// ════════════════════════════════════════════════

function getCardSlotCount() {
  return profile.commanderXp >= UNLOCK.CARD_SLOT_4 ? 4 : 3;
}

function readCallCards() {
  const t2 = profile.commanderXp >= UNLOCK.TIER2_CARDS;
  const t3 = profile.commanderXp >= UNLOCK.TIER3_CARDS;
  const n  = getCardSlotCount();
  state.callCards = [];
  for (let i = 0; i < n; i++) {
    const typeEl = document.querySelector(`#card-type-${i}`);
    const ctype  = typeEl ? typeEl.value : 'if_then';
    if (ctype === 'for_each' && t3) {
      state.callCards.push({
        tier:3, type:'for_each',
        subset:    document.querySelector(`#card-subset-${i}`)?.value || 'none',
        condition: document.querySelector(`#card-cond-${i}`)?.value   || 'none',
        action:    document.querySelector(`#card-act-${i}`)?.value    || 'none',
      });
    } else if (ctype === 'while' && t3) {
      state.callCards.push({
        tier:3, type:'while',
        condition: document.querySelector(`#card-cond-${i}`)?.value || 'none',
        action:    document.querySelector(`#card-act-${i}`)?.value  || 'none',
      });
    } else if (t2) {
      state.callCards.push({
        tier:2, type:'if_then',
        condition:  document.querySelector(`#card-cond-${i}`)?.value    || 'none',
        condOp:     document.querySelector(`#card-condop-${i}`)?.value  || 'and',
        condition2: document.querySelector(`#card-cond2-${i}`)?.value   || 'none',
        action:     document.querySelector(`#card-act-${i}`)?.value     || 'none',
      });
    } else {
      state.callCards.push({
        tier:1, type:'if_then',
        condition: document.querySelector(`#card-cond-${i}`)?.value || 'none',
        action:    document.querySelector(`#card-act-${i}`)?.value  || 'none',
      });
    }
  }
}

function persistCallCardsToProfile() {
  profile.callCards = (state.callCards || []).map(c => {
    if (!c) return null;
    const out = { tier: c.tier, condition: c.condition, action: c.action };
    if (c.type) out.type = c.type;
    if (c.condOp) out.condOp = c.condOp;
    if (c.condition2) out.condition2 = c.condition2;
    if (c.subset) out.subset = c.subset;
    return out;
  });
  saveProfile();
}

function persistCallCardsFromDOM() {
  readCallCards();
  persistCallCardsToProfile();
}

function checkCondition(cond) {
  const alive  = state.birds.filter(b => b.alive);
  const totHp  = alive.reduce((s, b) => s + b.hp, 0);
  const maxHp  = alive.reduce((s, b) => s + b.maxHp, 0);
  const hpPct  = maxHp > 0 ? totHp / maxHp : 0;
  const avgSt  = alive.length ? alive.reduce((s, b) => s + b.stamina, 0) / alive.length : 0;
  const anchor = state.birds.find(b => b.species === 'angry_honker');
  switch (cond) {
    case 'flock_hp_70':     return hpPct < 0.70;
    case 'flock_hp_50':     return hpPct < 0.50;
    case 'flock_hp_30':     return hpPct < 0.30;
    case 'enemy_drone':     return state.enemies.some(e => e.alive && e.type === 'drone');
    case 'enemy_sparrow':   return state.enemies.some(e => e.alive && e.type === 'sparrow');
    case 'enemy_turret':    return state.enemies.some(e => e.alive && e.type === 'turret');
    case 'enemy_flak':      return state.enemies.some(e => e.alive && e.type === 'flak');
    case 'enemy_sniper':    return state.enemies.some(e => e.alive && e.type === 'sniper');
    case 'birds_6':         return alive.length < 6;
    case 'birds_4':         return alive.length < 4;
    case 'stamina_50':      return avgSt < 50;
    case 'stamina_30':      return avgSt < 30;
    case 'enemy_count_3':   return state.enemies.filter(e => e.alive).length >= 3;
    case 'enemy_count_5':   return state.enemies.filter(e => e.alive).length >= 5;
    case 'incoming_aoe':    return state.enemies.some(e => e.alive && e.type === 'flak' && e.state === 'charging');
    case 'anchor_dead':     return !anchor || !anchor.alive;
    case 'boss_exposed':    return !!(state.boss?.alive && state.boss.state === 'exposed');
    case 'boss_active':     return !!(state.bossActive && state.boss?.alive);
    case 'formation_v':     return state.formation === 'flying_v';
    case 'formation_swarm': return state.formation === 'loose_swarm';
    case 'morale_30':       return state.morale < 30;
    case 'morale_50':       return state.morale < 50;
    case 'always':          return true;
    default:                return false;
  }
}

function checkBirdCondition(bird, cond) {
  switch (cond) {
    case 'stamina_30':  return bird.stamina < 30;
    case 'stamina_50':  return bird.stamina < 50;
    case 'flock_hp_30': return bird.hp / bird.maxHp < 0.30;
    case 'flock_hp_50': return bird.hp / bird.maxHp < 0.50;
    case 'boss_exposed': return !!(state.boss?.alive && state.boss.state === 'exposed');
    default:            return checkCondition(cond);
  }
}

function getSubset(key) {
  const alive = state.birds.filter(b => b.alive);
  switch (key) {
    case 'strikers':    return alive.filter(b => SPECIES[b.species].role === 'Striker');
    case 'screens':     return alive.filter(b => SPECIES[b.species].role === 'Screen');
    case 'anchors':     return alive.filter(b => SPECIES[b.species].role === 'Anchor');
    case 'specialists': return alive.filter(b => ['Specialist','Medic'].includes(SPECIES[b.species].role));
    case 'hp_below_30': return alive.filter(b => b.hp / b.maxHp < 0.30);
    default:            return alive;
  }
}

function applyAction(act) {
  switch (act) {
    case 'flying_v':          if (state.formation !== 'flying_v')      triggerFormationChange('flying_v');      break;
    case 'loose_swarm':       if (state.formation !== 'loose_swarm')   triggerFormationChange('loose_swarm');   break;
    case 'spread_line':       if (state.formation !== 'spread_line')   triggerFormationChange('spread_line');   break;
    case 'tight_cluster':     if (state.formation !== 'tight_cluster') triggerFormationChange('tight_cluster'); break;
    case 'echelon':           if (state.formation !== 'echelon')       triggerFormationChange('echelon');       break;
    case 'aggressive':        if (state.stance !== 'aggressive') { runLog.push('stance_change', { from: state.stance, to: 'aggressive' }); state.stance = 'aggressive'; } break;
    case 'evasive':           if (state.stance !== 'evasive') { runLog.push('stance_change', { from: state.stance, to: 'evasive' }); state.stance = 'evasive'; } break;
    case 'rally':             if (state.stance !== 'rally') { runLog.push('stance_change', { from: state.stance, to: 'rally' }); state.stance = 'rally'; } break;
    case 'normal_stance':     if (state.stance !== 'normal') { runLog.push('stance_change', { from: state.stance, to: 'normal' }); state.stance = 'normal'; } break;
    case 'rotate_leader':     rotateLeader();               break;
    case 'focus_fire': {
      const targets = state.enemies.filter(e => e.alive);
      if (targets.length) state.focusTarget = targets.reduce((best, e) =>
        dist(e.x, e.y, FLOCK_X, FLOCK_Y) < dist(best.x, best.y, FLOCK_X, FLOCK_Y) ? e : best);
      break;
    }
    case 'priority_strikers': {
      const sparrows = state.enemies.filter(e => e.alive && e.type === 'sparrow');
      if (sparrows.length) state.focusTarget = sparrows.reduce((best, e) =>
        dist(e.x, e.y, FLOCK_X, FLOCK_Y) < dist(best.x, best.y, FLOCK_X, FLOCK_Y) ? e : best);
      break;
    }
    case 'priority_role_screen': {
      const drones = state.enemies.filter(e => e.alive && e.type === 'drone');
      if (drones.length) state.focusTarget = drones.reduce((best, e) =>
        dist(e.x, e.y, FLOCK_X, FLOCK_Y) < dist(best.x, best.y, FLOCK_X, FLOCK_Y) ? e : best);
      break;
    }
    case 'trigger_screech': {
      const wobs = state.birds.filter(b => b.alive && b.species === 'wise_old_bird');
      state.enemies.forEach(e => {
        if (!e.alive) return;
        for (const wb of wobs) {
          if (dist(wb.x, wb.y, e.x, e.y) < 150) { e.debuffed = true; e.debuffTimer = 6; }
        }
      });
      break;
    }
    case 'detach_subflock': {
      const cands = state.birds.filter(b => b.alive && !b.subflocked)
        .sort((a, b) => SPECIES[b.species].aggression - SPECIES[a.species].aggression);
      cands.slice(0, 2).forEach(b => {
        b.subflocked = true; b.subflockTimer = 8;
        if (!state.subflock.includes(b.id)) state.subflock.push(b.id);
      });
      break;
    }
    case 'retreat_to_rear':
      rotateLeader();
      break;
    case 'surge_forward': {
      const alive = state.birds.filter(b => b.alive && !b.subflocked);
      alive.sort((a, b) => (b.hp / b.maxHp) - (a.hp / a.maxHp));
      alive.forEach((b, i) => { b.formationSlot = i; });
      updateFormationTargets();
      break;
    }
    case 'all_dive_attack': {
      const targets = state.enemies.filter(e => e.alive);
      if (targets.length) {
        const tgt = targets.reduce((best, e) =>
          dist(e.x, e.y, FLOCK_X, FLOCK_Y) < dist(best.x, best.y, FLOCK_X, FLOCK_Y) ? e : best);
        state.birds.filter(b => b.alive).forEach(b => {
          const sp = SPECIES[b.species];
          fireProj(b.x, b.y, tgt.x, tgt.y, sp.dmg * 1.8, 'bird', '#f0e060');
        });
      }
      break;
    }
  }
}

function applyBirdAction(bird, act) {
  switch (act) {
    case 'retreat_to_rear': {
      const alive = state.birds.filter(b => b.alive && !b.subflocked);
      if (bird.formationSlot === 0 && alive.length > 1) rotateLeader();
      break;
    }
    case 'surge_forward': {
      const alive = state.birds.filter(b => b.alive && !b.subflocked);
      if (bird.formationSlot !== 0) {
        alive.forEach(b => { if (b !== bird) b.formationSlot++; });
        bird.formationSlot = 0;
        alive.sort((a, b) => a.formationSlot - b.formationSlot).forEach((b, i) => { b.formationSlot = i; });
        updateFormationTargets();
      }
      break;
    }
    case 'all_dive_attack': {
      const targets = state.enemies.filter(e => e.alive);
      if (targets.length && bird.atkCooldown <= 0) {
        const tgt = targets.reduce((best, e) =>
          dist(bird.x, bird.y, e.x, e.y) < dist(bird.x, bird.y, best.x, best.y) ? e : best);
        const sp = SPECIES[bird.species];
        fireProj(bird.x, bird.y, tgt.x, tgt.y, sp.dmg * 2.0, 'bird', '#f0e060');
        bird.atkCooldown = 1.0 / sp.atkRate;
        if (bird.traits.includes('Clueless')) bird.atkCooldown += Math.random() * 0.6;
      }
      break;
    }
  }
}

function evaluateCallCards() {
  if (state.moraleCollapse && Math.random() < 0.30) return; // collapse: 30% ignore chance
  for (let i = 0; i < state.callCards.length; i++) {
    if (state.cardCooldowns[i] > 0) continue;
    const card = state.callCards[i];
    if (!card || card.condition === 'none' || card.action === 'none') continue;

    if (card.type === 'for_each') {
      if (card.subset === 'none') continue;
      const subset  = getSubset(card.subset);
      const matched = subset.filter(b => checkBirdCondition(b, card.condition));
      if (matched.length > 0) {
        runLog.push('card_fire', { slotIndex: i, condition: card.condition, action: card.action });
        matched.forEach(b => applyBirdAction(b, card.action));
        state.cardFlash[i]     = 0.7;
        state.cardCooldowns[i] = CARD_COOLDOWN;
        state.morale = Math.min(100, state.morale + 2);
        continue; // FOR EACH doesn't block lower-priority cards
      }
    } else {
      let condMet = checkCondition(card.condition);
      if (card.tier === 2 && card.condition2 && card.condition2 !== 'none') {
        const c2 = checkCondition(card.condition2);
        condMet   = card.condOp === 'or' ? (condMet || c2) : (condMet && c2);
      }
      if (condMet) {
        runLog.push('card_fire', { slotIndex: i, condition: card.condition, action: card.action });
        applyAction(card.action);
        state.cardFlash[i]     = 0.7;
        state.cardCooldowns[i] = card.type === 'while' ? CARD_COOLDOWN * 0.5 : CARD_COOLDOWN;
        state.morale = Math.min(100, state.morale + 2);
        break; // IF/THEN and WHILE stop at first match
      }
    }
  }
}

// ════════════════════════════════════════════════
// MORALE
// ════════════════════════════════════════════════

function updateMorale(dt) {
  state.morale = Math.max(0, state.morale - 0.5 * dt);
  if (state.stance === 'rally') state.morale = Math.min(100, state.morale + 5 * dt);
  if (state.morale < 30) {
    state.moraleCollapseTimer += dt;
    if (state.moraleCollapseTimer >= 3.0 && !state.moraleCollapse) {
      state.moraleCollapse = true;
      runLog.push('morale_collapse', { morale: Math.round(state.morale) });
    }
  } else {
    state.moraleCollapseTimer = 0;
    state.moraleCollapse      = false;
  }
}

// ════════════════════════════════════════════════
// SYNERGIES
// ════════════════════════════════════════════════

function evaluateSynergies() {
  const alive = state.birds.filter(b => b.alive);
  const wobs  = alive.filter(b => b.species === 'wise_old_bird');
  const dss   = alive.filter(b => b.species === 'danger_sparrow');
  const ah    = alive.filter(b => b.species === 'angry_honker');
  const bs    = alive.find(b => b.species === 'beach_screamer');

  // WOB adjacent to DS: DS marks next attack as debuffing
  wobs.forEach(wb => {
    dss.forEach(ds => {
      if (Math.abs(wb.formationSlot - ds.formationSlot) <= 2 && dist(wb.x, wb.y, ds.x, ds.y) < 120) {
        ds.debuffApplied = true;
      }
    });
  });

  // BS adjacent to AH: Honker gets bonus regen
  if (bs) {
    ah.forEach(h => {
      if (dist(bs.x, bs.y, h.x, h.y) < 110) {
        h.hp = Math.min(h.maxHp, h.hp + 1.2 * (1 / 60));
      }
    });
  }
}

// ════════════════════════════════════════════════
// MID-RUN LEVELING & GENETIC INHERITANCE
// ════════════════════════════════════════════════

function computeBirdStats(bird) {
  const base = bird.baseStats;
  const mods = bird.growthModifiers || {};
  const liveSp = { ...SPECIES[bird.species] };
  const lvl = bird.level;

  SCALABLE_STATS.forEach(stat => {
    if (base[stat] == null) return; // e.g. peck stats only on melee birds
    const effectiveRate = STAT_GROWTH_RATES[stat] * (1 + (mods[stat] || 0));
    const growthMult    = Math.min(STAT_GROWTH_CAPS[stat] || 999, Math.pow(1 + effectiveRate, lvl - 1));
    liveSp[stat]        = base[stat] * growthMult;
  });

  // Scale maxHp and clamp current HP proportionally
  const prevMaxHp = bird.maxHp;
  bird.maxHp      = liveSp.hp;
  if (prevMaxHp > 0 && bird.maxHp !== prevMaxHp) {
    bird.hp = Math.min(bird.maxHp, bird.hp * (bird.maxHp / prevMaxHp));
  }

  bird.liveSp = liveSp;

  if (lvl === 1 || lvl === MAX_BIRD_LEVEL) {
    console.log(`[Level ${lvl}] ${bird.name} (${bird.species}): dmg=${liveSp.dmg.toFixed(1)}, spd=${liveSp.spd.toFixed(2)}, atkRate=${liveSp.atkRate.toFixed(2)}, crit=${(liveSp.critChance*100).toFixed(1)}%`);
  }
}

function computePeckCooldown(bird, sp) {
  const base  = sp.peckSpeed != null ? sp.peckSpeed : 1.5;
  const jitter = (Math.random() - 0.5) * 0.15;
  return Math.max(0.8, base + jitter);
}

function rollPeckDamage(bird, sp) {
  const min = sp.peckDmgMin != null ? sp.peckDmgMin : sp.dmg * 0.7;
  const max = sp.peckDmgMax != null ? sp.peckDmgMax : sp.dmg * 1.3;
  return min + Math.random() * (max - min);
}

function awardBirdXP(bird, amount) {
  if (!bird || !bird.alive || bird.level >= MAX_BIRD_LEVEL || amount <= 0) return;
  bird.xp += amount;
  const threshold = XP_PER_LEVEL(bird.level);
  if (bird.xp >= threshold) {
    bird.xp -= threshold;
    bird.level++;
    runLog.push('bird_level_up', { birdId: bird.id, newLevel: bird.level });
    computeBirdStats(bird);
    bird.hp = Math.min(bird.maxHp, bird.hp + bird.maxHp * 0.60);
    spawnFloatText(bird.x, bird.y - 28, 'LEVEL UP!', '#ffd700', 15);
    bird.flashTimer = Math.max(bird.flashTimer, 0.35);
  }
}

function processGeneticInheritance(bird, weight) {
  if (!bird.baseStats) return;
  const w = Math.max(0, Math.min(2.5, weight || 0)); // allow some amplification but keep sane
  const base = bird.baseStats;
  const mods = bird.growthModifiers || {};
  const sp   = SPECIES[bird.species];

  // Determine dominant stat: highest inherited modifier, or highest relative gain from leveling
  let dominantStat = null;
  let bestScore    = -1;

  SCALABLE_STATS.forEach(stat => {
    // Prefer whichever stat the bird had the biggest growth modifier on;
    // fall back to relative gain from leveling for unmodified birds
    const modScore   = mods[stat] || 0;
    const levelScore = base[stat] > 0 ? ((bird.liveSp?.[stat] || base[stat]) - base[stat]) / base[stat] : 0;
    const score      = modScore > 0 ? modScore : levelScore;
    if (score > bestScore) { bestScore = score; dominantStat = stat; }
  });

  // Skip inheritance if the bird contributed nothing meaningful
  if (!dominantStat || (bird.level <= 1 && bestScore <= 0) || w <= 0) return;

  const existing = profile.geneticBuffs.find(b => b.species === bird.species && b.stat === dominantStat);
  if (existing) {
    const growthMult = 1 + 0.20 * w;
    existing.modifier = Math.min(0.50, existing.modifier * growthMult);
  } else {
    const baseMod = 0.05 * w;
    if (baseMod > 0) {
      profile.geneticBuffs.push({ species: bird.species, stat: dominantStat, modifier: Math.min(0.50, baseMod) });
    }
  }
  saveProfile();
}

// ════════════════════════════════════════════════
// UPDATE — BIRDS
// ════════════════════════════════════════════════

function killBird(b) {
  if (!b.alive) return;
  runLog.push('bird_death', { birdId: b.id, name: b.name, species: b.species });
  b.hp = 0; b.alive = false; b.deathTime = state.runTime;
  state.lostBirds.push({ id:b.id, name:b.name, species:b.species, time:state.runTime });
  state.morale = Math.max(0, state.morale - (b.species === 'angry_honker' ? 25 : 15));
}

function checkKamikazeTrigger(bird) {
  if (bird.species !== 'danger_sparrow') return;
  if (bird.meleeState === 'kamikaze') return;
  if (bird.hp > 0 && bird.hp / bird.maxHp < 0.10) {
    bird.meleeState    = 'kamikaze';
    bird.kamikazeTrail = [];
    spawnFloatText(bird.x, bird.y - 28, 'Kamikaze!', '#ff2020', 14);
  }
}

function kamikazeExplode(bird) {
  const KAZE_RADIUS = 65;
  const sp = bird.liveSp || SPECIES[bird.species];
  const targets = [
    ...(state.boss?.alive ? [state.boss] : []),
    ...state.enemies.filter(e => e.alive),
  ].filter(e => dist(bird.x, bird.y, e.x, e.y) < KAZE_RADIUS);
  targets.forEach(e => {
    e.hp -= sp.dmg * 2.5; e.flashTimer = 0.3;
    if (e.hp <= 0) {
      if (e === state.boss) {
        e.alive = false; state.bossKilled = true;
        state.kills++; state.score += 1000; state.morale = Math.min(100, state.morale + 30);
        runLog.push('boss_kill', { bossType: state.boss.type, killerBirdId: bird.id });
      } else {
        e.alive = false; state.kills++; state.score += 100; state.morale = Math.min(100, state.morale + 4);
        waveController.markEnemyDead(e.id);
        runLog.push('enemy_kill', { enemyType: e.type, killedBy: bird.id, score: 100 });
      }
    }
  });
  runLog.push('bird_kamikaze', { birdId: bird.id, targetsHit: targets.length });
  spawnFloatText(bird.x, bird.y, 'BOOM', '#ff4400', 18);
  killBird(bird);
}

function removeBird(id) {
  profile.roster        = profile.roster.filter(b => b.id !== id);
  profile.activeRoster  = profile.activeRoster.filter(rid => rid !== id);
  Object.keys(profile.positionAssignments).forEach(key => {
    if (profile.positionAssignments[key] === id) delete profile.positionAssignments[key];
  });
}

function releaseBird(id) {
  const bird = profile.roster.find(b => b.id === id);
  if (!bird) return;
  const sellValue = Math.floor((bird.cost || 0) * 0.8);
  profile.seed += sellValue;
  removeBird(id);
  saveProfile();
  buildRosterList();
  buildFormationTab();
  buildCurrencyDisplay();
}

function updateBirds(dt) {
  const atkMult = state.stance === 'aggressive' ? 1.4 : state.stance === 'evasive' ? 0.6 : state.stance === 'rally' ? 0.2 : 1.0;
  const spdMult = state.stance === 'evasive' ? 1.05 : 1.0;
  const jitter  = (state.stance === 'evasive' || state.formation === 'loose_swarm') ? 8 : 0;

  state.birds.filter(b => b.alive).forEach(bird => {
    const slotIdx   = bird.formationSlot;
    const isLeader  = slotIdx === 0;
    const sp        = bird.liveSp || SPECIES[bird.species];
    const formBuff  = FORMATION_BUFFS[state.formation] || FORMATION_BUFFS.flying_v;

    // Sub-flock timer
    if (bird.subflocked) {
      bird.subflockTimer -= dt;
      if (bird.subflockTimer <= 0 || state.enemies.filter(e => e.alive).length === 0) {
        bird.subflocked = false;
        state.subflock  = state.subflock.filter(id => id !== bird.id);
      }
    }

    // Stamina drain
    let drain = 2.2 * dt;
    if (state.formation === 'flying_v' || state.formation === 'echelon') {
      drain = isLeader ? 5.0 * dt : (slotIdx < 3 ? 2.5 : 1.2) * dt;
    }
    if (bird.traits.includes('Enduring'))    drain *= 0.70;
    if (bird.traits.includes('Steady Wing') && isLeader) drain *= 0.75;
    if (bird.traits.includes('Hates the Front') && isLeader) {
      drain *= 1.2;
      state.morale = Math.max(0, state.morale - 0.4 * dt);
    }
    bird.stamina = Math.max(0, bird.stamina - drain);

    // Slipstream stamina recovery
    const inSlip = (state.formation === 'flying_v' || state.formation === 'echelon') && !isLeader && !bird.subflocked;
    if (inSlip) bird.stamina = Math.min(100, bird.stamina + 0.6 * dt);

    // Updraft
    if (bird.updraftTimer > 0) {
      bird.stamina = Math.min(100, bird.stamina + 3.0 * dt);
      bird.updraftTimer -= dt;
    }

    // Slipstream HoT
    bird.slipstreamHot = 0;
    if (inSlip && bird.hp < bird.maxHp && bird.stamina > 20) {
      const leader       = state.birds.find(b => b.alive && b.formationSlot === 0);
      const leaderQuality = leader ? (leader.stamina / 100) * (leader.hp / leader.maxHp) : 0.5;
      const depthRate    = slotIdx >= 5 ? 1.0 : slotIdx >= 3 ? 0.65 : 0.35;
      const beachNearby  = state.birds.some(b => b.alive && b !== bird && b.species === 'beach_screamer' && Math.abs(b.formationSlot - slotIdx) <= 1);
      const hotRate      = sp.hp * 0.004 * depthRate * leaderQuality * (beachNearby ? 1.5 : 1.0);
      const heal         = hotRate * dt;
      bird.hp = Math.min(bird.maxHp, bird.hp + heal);
      bird.slipstreamHot = hotRate;
      state.totalSlipstreamHealing += heal;
    }

    // Beach Screamer burst heal
    if (bird.species === 'beach_screamer') {
      bird.healCooldown -= dt;
      if (bird.healCooldown <= 0) {
        bird.healCooldown = 2.8;
        const healed = state.birds.filter(b => b.alive && b !== bird && dist(b.x, b.y, bird.x, bird.y) < 90);
        healed.forEach(b => { b.hp = Math.min(b.maxHp, b.hp + 9); });
        if (healed.length > 0) runLog.push('bird_heal', { birdId: bird.id, amount: 9 * healed.length, source: 'beach_screamer_burst' });
      }
    }

    // ── Movement ─────────────────────────────────────────
    if (sp.combatClass === 'melee' && bird.meleeState !== 'idle') {
      // Melee override movement
      const moveSpd = sp.peelSpd * (0.5 + bird.stamina / 200) * dt * 60;

      if (bird.meleeState === 'kamikaze') {
        // Death Charge — Striker flies at max speed into nearest enemy and explodes
        bird.kamikazeTrail = bird.kamikazeTrail || [];
        bird.kamikazeTrail.push({ x: bird.x, y: bird.y, t: 0.4 });
        bird.kamikazeTrail = bird.kamikazeTrail.filter(p => { p.t -= dt; return p.t > 0; });

        const kazeTargets = [
          ...(state.boss?.alive ? [state.boss] : []),
          ...state.enemies.filter(e => e.alive),
        ].sort((a, b) => dist(bird.x, bird.y, a.x, a.y) - dist(bird.x, bird.y, b.x, b.y));

        if (!kazeTargets.length) { killBird(bird); }
        else {
          const kTgt = kazeTargets[0];
          const dK   = dist(bird.x, bird.y, kTgt.x, kTgt.y);
          const spdK = sp.peelSpd * 2.0 * dt * 60;
          bird.x += (kTgt.x - bird.x) / dK * Math.min(dK, spdK);
          bird.y += (kTgt.y - bird.y) / dK * Math.min(dK, spdK);
          if (dK < 22 || bird.x < -40 || bird.x > W + 40 || bird.y < -40 || bird.y > H + 40) {
            kamikazeExplode(bird);
          }
        }

      } else if (bird.meleeState === 'charging') {
        // Angry Honker straight-line charge
        bird.x += bird.chargeDir.x * sp.peelSpd * dt * 60;
        bird.y += bird.chargeDir.y * sp.peelSpd * dt * 60;

        // Hit enemies along charge path
        const allTargets = [
          ...(state.boss?.alive && state.boss.state !== 'shielded' ? [state.boss] : []),
          ...(state.miniBoss?.alive ? [state.miniBoss] : []),
          ...state.enemies.filter(e => e.alive),
        ];
        const hitR = (t) => t === state.boss ? 30 : t === state.miniBoss ? 20 : ENEMY_R;
        allTargets.forEach(tgt => {
          if (bird.chargeHit.includes(tgt.id || tgt)) return;
          if (dist(bird.x, bird.y, tgt.x, tgt.y) < 28 + hitR(tgt)) {
            bird.chargeHit.push(tgt.id || tgt);
            if ((tgt === state.boss || tgt === state.miniBoss) && tgt.parryActive) {
              spawnFloatText(tgt.x, tgt.y - 25, 'PARRY!', tgt.color || '#fff', 14);
              tgt.flashTimer = 0.2;
              bird.peckCooldown += PARRY_PENALTY_COOLDOWN;
              bird.meleeState = 'returning';
              bird.flashTimer = 0.18;
              runLog.push('boss_parry', { birdId: bird.id });
              return;
            }
            let dmg = rollPeckDamage(bird, sp);
            if (state.stance === 'aggressive')                                   dmg *= 1.30;
            if (bird.traits.includes('Vengeful') && state.lostBirds.length > 0) dmg *= 1.20;
            if (bird.traits.includes('Reckless'))                                dmg *= 1.10;
            if (bird.traits.includes('Cautious') && state.stance === 'aggressive') dmg *= 0.85;
            dmg *= formBuff.dmgMult;
            const isCrit = Math.random() < Math.min(1, sp.critChance + formBuff.critBonus);
            if (isCrit) { dmg *= 2; spawnFloatText(bird.x, bird.y - 18, 'Cra Caw!'); state.morale = Math.min(100, state.morale + 2); runLog.push('bird_crit', { birdId: bird.id, target: tgt === state.boss ? 'boss' : tgt === state.miniBoss ? 'miniboss' : (tgt.type || 'enemy'), dmg: Math.round(dmg * 10) / 10 }); }
            if (tgt === state.boss) {
              if (tgt.debuffed) dmg *= 1.12;
              const chargeBossCap = tgt.maxHp * 0.15;
              if (dmg > chargeBossCap) dmg = chargeBossCap;
              const budget = tgt.maxHp * BOSS_MELEE_DMG_BUDGET * dt;
              const remaining = budget - tgt.meleeDmgThisTick;
              if (remaining <= 0) { spawnFloatText(tgt.x, tgt.y - 18, 'RESIST', '#888', 10); dmg = 0; }
              else if (dmg > remaining) { dmg = Math.max(1, remaining); spawnFloatText(tgt.x, tgt.y - 18, 'RESIST', '#888', 10); }
              tgt.meleeDmgThisTick += dmg;
              tgt.hp -= dmg; tgt.flashTimer = 0.18;
              state.score += 50;
              awardBirdXP(bird, dmg * 0.3);
              if (tgt.hp <= 0) { tgt.alive = false; state.bossKilled = true; state.kills++; state.score += 1000; state.morale = Math.min(100, state.morale + 30); runLog.push('boss_kill', { bossType: tgt.type, killerBirdId: bird.id }); }
            } else if (tgt === state.miniBoss) {
              const chargeMiniCap = tgt.maxHp * 0.18;
              if (dmg > chargeMiniCap) dmg = chargeMiniCap;
              const budget = tgt.maxHp * MINI_BOSS_MELEE_DMG_BUDGET * dt;
              const remaining = budget - tgt.meleeDmgThisTick;
              if (remaining <= 0) { spawnFloatText(tgt.x, tgt.y - 18, 'RESIST', '#888', 10); dmg = 0; }
              else if (dmg > remaining) { dmg = Math.max(1, remaining); spawnFloatText(tgt.x, tgt.y - 18, 'RESIST', '#888', 10); }
              tgt.meleeDmgThisTick += dmg;
              tgt.hp -= dmg; tgt.flashTimer = 0.18;
              awardBirdXP(bird, dmg * 0.25);
              if (tgt.hp <= 0) { tgt.alive = false; state.kills++; state.score += 300; state.morale = Math.min(100, state.morale + 15); runLog.push('miniboss_kill', { miniType: tgt.type }); }
            } else {
              const finalDmg = dmg * (tgt.debuffed ? 1.10 : 1.0);
              tgt.hp -= finalDmg; tgt.flashTimer = 0.18;
              awardBirdXP(bird, finalDmg * 0.2);
              if (tgt.hp <= 0) { tgt.alive = false; state.kills++; state.score += 100; state.morale = Math.min(100, state.morale + 4); waveController.markEnemyDead(tgt.id); runLog.push('enemy_kill', { enemyType: tgt.type, killedBy: bird.id, score: 100 }); }
            }
            bird.flashTimer = 0.18;
          }
        });

        // Reached end of charge line or left screen
        const dEnd = dist(bird.x, bird.y, bird.chargeEndX, bird.chargeEndY);
        if (dEnd < 20 || bird.x < -40 || bird.x > W + 40 || bird.y < -40 || bird.y > H + 40) {
          bird.meleeState   = 'returning';
          bird.chargeHit    = [];
          bird.peckCooldown = computePeckCooldown(bird, sp) * PECK_CHARGE_MULT;
        }

      } else if (bird.meleeState === 'peeling') {
        // Single-target peel (DS, GC)
        const tgt = bird.meleeTarget;
        if (!tgt || !tgt.alive) {
          bird.meleeState = 'returning';
        } else {
          const dTgt = dist(bird.x, bird.y, tgt.x, tgt.y);
          const hitR  = (tgt === state.boss ? 30 : tgt === state.miniBoss ? 20 : ENEMY_R) + 22;
          if (dTgt <= hitR) {
            if ((tgt === state.boss || tgt === state.miniBoss) && tgt.parryActive) {
              spawnFloatText(tgt.x, tgt.y - 25, 'PARRY!', tgt.color || '#fff', 14);
              tgt.flashTimer = 0.2;
              bird.peckCooldown += PARRY_PENALTY_COOLDOWN;
              bird.meleeState = 'returning';
              bird.flashTimer = 0.18;
              runLog.push('boss_parry', { birdId: bird.id });
            } else if (bird.peckCooldown <= 0) {
            // Land strike (only when peck timer has elapsed — WoW-style interval)
            let dmg = rollPeckDamage(bird, sp);
            if (state.stance === 'aggressive')                                    dmg *= 1.30;
            // Goth Chicken opportunist bonuses only apply on non-boss targets
            const isBossUnit = (tgt === state.boss || tgt === state.miniBoss);
            if (bird.species === 'goth_chicken' && !isBossUnit && tgt.hp < tgt.maxHp * 0.5) dmg *= 1.40;
            if (bird.species === 'goth_chicken' && !isBossUnit && tgt.debuffed)            dmg *= 1.35;
            if (bird.traits.includes('Vengeful') && state.lostBirds.length > 0) dmg *= 1.20;
            if (bird.traits.includes('Reckless'))                                dmg *= 1.10;
            if (bird.traits.includes('Hates Drones') && tgt.type === 'drone')   dmg *= 1.30;
            if (bird.traits.includes('Cautious') && state.stance === 'aggressive') dmg *= 0.85;
            dmg *= formBuff.dmgMult;
            const isCrit = Math.random() < Math.min(1, sp.critChance + formBuff.critBonus);
            if (isCrit) {
              dmg *= 2;
              spawnFloatText(bird.x, bird.y - 18, 'Cra Caw!');
              state.morale = Math.min(100, state.morale + 2);
              runLog.push('bird_crit', { birdId: bird.id, target: tgt === state.boss ? 'boss' : tgt === state.miniBoss ? 'miniboss' : (tgt.type || 'enemy'), dmg: Math.round(dmg * 10) / 10 });
              if (bird.species === 'danger_sparrow') {
                const heal = sp.dmg * 0.4;
                if (Math.random() < 0.55) {
                  // Flock heal AoE
                  state.birds.filter(b => b.alive).forEach(b => {
                    b.hp = Math.min(b.maxHp, b.hp + heal * 0.6);
                    spawnFloatText(b.x, b.y - 18, '+Heal', '#40ffa0', 11);
                  });
                } else {
                  bird.hp = Math.min(bird.maxHp, bird.hp + heal);
                }
              }
            }
            if (tgt === state.boss) {
              if (tgt.debuffed) dmg *= 1.12;
              // Hard cap: a single melee hit cannot remove too much of boss max HP
              const baseBossCap = tgt.maxHp * 0.18;
              const bossCap     = bird.species === 'goth_chicken' ? tgt.maxHp * 0.12 : baseBossCap;
              if (dmg > bossCap) dmg = bossCap;
              const budget = tgt.maxHp * BOSS_MELEE_DMG_BUDGET * dt;
              const remaining = budget - tgt.meleeDmgThisTick;
              if (remaining <= 0) { spawnFloatText(tgt.x, tgt.y - 18, 'RESIST', '#888', 10); dmg = 0; }
              else if (dmg > remaining) { dmg = Math.max(1, remaining); spawnFloatText(tgt.x, tgt.y - 18, 'RESIST', '#888', 10); }
              tgt.meleeDmgThisTick += dmg;
              tgt.hp -= dmg; tgt.flashTimer = 0.18;
              state.score += 50;
              awardBirdXP(bird, dmg * 0.3);
              if (tgt.hp <= 0) { tgt.alive = false; state.bossKilled = true; state.kills++; state.score += 1000; state.morale = Math.min(100, state.morale + 30); runLog.push('boss_kill', { bossType: tgt.type, killerBirdId: bird.id }); }
            } else if (tgt === state.miniBoss) {
              const baseMiniCap = tgt.maxHp * 0.22;
              const miniCap     = bird.species === 'goth_chicken' ? tgt.maxHp * 0.16 : baseMiniCap;
              if (dmg > miniCap) dmg = miniCap;
              const budget = tgt.maxHp * MINI_BOSS_MELEE_DMG_BUDGET * dt;
              const remaining = budget - tgt.meleeDmgThisTick;
              if (remaining <= 0) { spawnFloatText(tgt.x, tgt.y - 18, 'RESIST', '#888', 10); dmg = 0; }
              else if (dmg > remaining) { dmg = Math.max(1, remaining); spawnFloatText(tgt.x, tgt.y - 18, 'RESIST', '#888', 10); }
              tgt.meleeDmgThisTick += dmg;
              tgt.hp -= dmg; tgt.flashTimer = 0.18;
              awardBirdXP(bird, dmg * 0.25);
              if (tgt.hp <= 0) { tgt.alive = false; state.kills++; state.score += 300; state.morale = Math.min(100, state.morale + 15); runLog.push('miniboss_kill', { miniType: tgt.type }); }
            } else {
              const finalDmg = dmg * (tgt.debuffed ? 1.10 : 1.0);
              tgt.hp -= finalDmg; tgt.flashTimer = 0.18;
              awardBirdXP(bird, finalDmg * 0.2);
              if (tgt.hp <= 0) { tgt.alive = false; state.kills++; state.score += 100; state.morale = Math.min(100, state.morale + 4); waveController.markEnemyDead(tgt.id); runLog.push('enemy_kill', { enemyType: tgt.type, killedBy: bird.id, score: 100 }); }
            }
            bird.flashTimer   = 0.18;
            bird.peckAnimTimer = 0.15;
            spawnPeckSparks(tgt.x, tgt.y, sp.color);
            bird.peckCooldown = computePeckCooldown(bird, sp);
            if (tgt === state.boss) bird.peckCooldown *= PECK_BOSS_MULT;
            else if (tgt === state.miniBoss) bird.peckCooldown *= PECK_MINIBOSS_MULT;
            if (bird.traits.includes('Clueless')) bird.peckCooldown += Math.random() * 0.6;
            if (bird.meleeTarget && bird.meleeTarget.alive) {
              // Target survived the hit — keep peeling
            } else {
              // Target is dead — check Goth Chicken chain charge
              if (bird.species === 'goth_chicken' &&
                  bird.x >= -40 && bird.x <= W + 40 &&
                  bird.y >= -40 && bird.y <= H + 40) {
                bird.chainCount = (bird.chainCount || 0) + 1;
                const baseChainChance = 0.15 + (sp.spd * 0.18);
                const chainPool = [
                    ...(state.boss?.alive && state.boss.state !== 'shielded' ? [state.boss] : []),
                    ...(state.miniBoss?.alive ? [state.miniBoss] : []),
                    ...state.enemies.filter(e => e.alive),
                  ].sort((a, b) =>
                    dist(bird.x, bird.y, a.x, a.y) - dist(bird.x, bird.y, b.x, b.y));
                const primary = chainPool[0] || null;
                const bossPrimary = primary && (primary === state.boss || primary === state.miniBoss);
                const chainChance = bossPrimary ? baseChainChance * 0.5 : baseChainChance;
                if (bird.chainCount <= 3 && Math.random() < chainChance) {
                  if (chainPool.length) {
                    bird.meleeTarget = primary;
                    bird.meleeState  = 'peeling';
                    spawnFloatText(bird.x, bird.y - 28, 'Chain!', '#cc44ff', 14);
                  } else {
                    bird.chainCount  = 0;
                    bird.meleeTarget = null;
                    bird.meleeState  = 'returning';
                    bird.peckCooldown = Math.max(bird.peckCooldown, 1.0);
                  }
                } else {
                  bird.chainCount  = 0;
                  bird.meleeTarget = null;
                  bird.meleeState  = 'returning';
                  bird.peckCooldown = Math.max(bird.peckCooldown, 1.0);
                }
              } else {
                bird.chainCount  = 0;
                bird.meleeTarget = null;
                bird.meleeState  = 'returning';
                bird.peckCooldown = Math.max(bird.peckCooldown, 1.0);
              }
            }
            }
          } else {
            bird.x += (tgt.x - bird.x) / dTgt * Math.min(dTgt, moveSpd);
            bird.y += (tgt.y - bird.y) / dTgt * Math.min(dTgt, moveSpd);
          }
        }

      } else if (bird.meleeState === 'returning') {
        if (bird.peckCooldown <= 0 && bird.knockbackRecovery <= 0 && !state.isReorganizing && state.stance !== 'rally') {
          const reEngageCandidates = [
            ...(state.boss?.alive && state.boss.state !== 'shielded' ? [state.boss] : []),
            ...(state.miniBoss?.alive ? [state.miniBoss] : []),
            ...state.enemies.filter(e => e.alive),
          ];
          const reEngageRange = (e) => (e === state.boss || e === state.miniBoss)
            ? Math.max(sp.range * MELEE_RANGE_MULT, 250) : sp.range * MELEE_RANGE_MULT;
          const reEngagePool = reEngageCandidates.filter(e => dist(bird.x, bird.y, e.x, e.y) < reEngageRange(e));
          if (reEngagePool.length) {
            bird.meleeTarget = reEngagePool.reduce((best, e) =>
              dist(bird.x, bird.y, e.x, e.y) < dist(bird.x, bird.y, best.x, best.y) ? e : best);
            bird.meleeState = 'peeling';
          }
        }
        if (bird.meleeState === 'returning') {
          const dSlot = dist(bird.x, bird.y, bird.targetX, bird.targetY);
          const retSpd = sp.spd * spdMult * (0.4 + bird.stamina / 160) * dt * 60;
          if (dSlot < 20) {
            bird.meleeState = 'idle';
          } else {
            bird.x += (bird.targetX - bird.x) / dSlot * Math.min(dSlot, retSpd);
            bird.y += (bird.targetY - bird.y) / dSlot * Math.min(dSlot, retSpd);
          }
        }
      }

    } else {
      // Standard formation / subflocked movement
      let tx, ty;
      if (bird.subflocked) {
        const tgt = state.enemies.filter(e => e.alive).reduce((best, e) =>
          dist(bird.x, bird.y, e.x, e.y) < dist(bird.x, bird.y, best.x, best.y) ? e : best,
          state.enemies.find(e => e.alive));
        tx = tgt ? tgt.x : bird.x;
        ty = tgt ? tgt.y : bird.y;
      } else {
        tx = bird.targetX + (Math.random() - 0.5) * jitter;
        ty = bird.targetY + (Math.random() - 0.5) * jitter;
      }
      const d   = dist(bird.x, bird.y, tx, ty);
      const spd = sp.spd * spdMult * (0.4 + bird.stamina / 160) * dt * 60 * (inSlip ? formBuff.spdMult : 1);
      if (d > 2) {
        bird.x += (tx - bird.x) / d * Math.min(d, spd);
        bird.y += (ty - bird.y) / d * Math.min(d, spd);
      }
    }

    // ── Auto-attack / attack trigger ─────────────────────
    bird.atkCooldown -= dt;
    if (sp.combatClass === 'melee') {
      bird.peckCooldown -= dt;
      if (bird.knockbackRecovery > 0) bird.knockbackRecovery -= dt;
      // Melee: trigger peel/charge when idle and cooldown ready
      if (bird.meleeState === 'idle' && bird.peckCooldown <= 0 && bird.knockbackRecovery <= 0 && !state.isReorganizing && state.stance !== 'rally') {
        const allT = [
          ...(state.boss?.alive && state.boss.state !== 'shielded' ? [state.boss] : []),
          ...(state.miniBoss?.alive ? [state.miniBoss] : []),
          ...state.enemies.filter(e => e.alive),
        ];
        const meleeRange = (e) => (e === state.boss || e === state.miniBoss)
          ? Math.max(sp.range * MELEE_RANGE_MULT, 250) : sp.range * MELEE_RANGE_MULT;
        const inRange = allT.filter(e => dist(bird.x, bird.y, e.x, e.y) < meleeRange(e));
        if (inRange.length) {
          const nearest = inRange.reduce((best, e) =>
            dist(bird.x, bird.y, e.x, e.y) < dist(bird.x, bird.y, best.x, best.y) ? e : best);
          if (bird.species === 'angry_honker') {
            // Charge attack
            const dx = nearest.x - bird.x, dy = nearest.y - bird.y;
            const dN = Math.sqrt(dx*dx + dy*dy) || 1;
            bird.chargeDir  = { x: dx / dN, y: dy / dN };
            bird.chargeEndX = bird.x + bird.chargeDir.x * 280;
            bird.chargeEndY = bird.y + bird.chargeDir.y * 280;
            bird.chargeHit  = [];
            bird.meleeState = 'charging';
          } else {
            // Peel attack
            bird.meleeTarget = nearest;
            bird.meleeState  = 'peeling';
          }
        } else {
          bird.peckCooldown = 0.3;
        }
      }
    } else {
      // Ranged attack
      if (bird.atkCooldown <= 0 && !state.isReorganizing && state.stance !== 'rally') {
        let target = null;
        let rangePenalty = 1.0;

        const baseEngageRange = Math.max(sp.range, 160);
        const bossEngageRange = Math.max(sp.range, 260);
        const maxEngageRange  = baseEngageRange * 2;

        const distTo = (e) => dist(bird.x, bird.y, e.x, e.y);

        if (state.focusTarget && state.focusTarget.alive) {
          const dF = distTo(state.focusTarget);
          const allowRange = Math.max(sp.range * 2, 300);
          if (dF <= allowRange) {
            target = state.focusTarget;
            if (!(target === state.boss || target === state.miniBoss)) {
              if (dF > baseEngageRange) {
                const t = Math.min(1, (dF - baseEngageRange) / (allowRange - baseEngageRange || 1));
                rangePenalty = 1 - 0.5 * t;
              }
            }
          }
        }

        if (!target) {
          const allT = [
            ...(state.boss?.alive && state.boss.state !== 'shielded' ? [state.boss] : []),
            ...(state.miniBoss?.alive ? [state.miniBoss] : []),
            ...state.enemies.filter(e => e.alive),
          ];
          const candidates = allT.filter(e => {
            const r = (e === state.boss && state.bossActive) || e === state.miniBoss
              ? bossEngageRange
              : maxEngageRange;
            return distTo(e) < r;
          });
          if (candidates.length) {
            target = candidates.reduce((best, e) =>
              distTo(e) < distTo(best) ? e : best);
            const dT = distTo(target);
            const baseR = (target === state.boss && state.bossActive) || target === state.miniBoss
              ? bossEngageRange
              : baseEngageRange;
            if (dT > baseR) {
              const farR = (target === state.boss && state.bossActive) || target === state.miniBoss
                ? bossEngageRange
                : maxEngageRange;
              const t = Math.min(1, (dT - baseR) / (farR - baseR || 1));
              rangePenalty = 1 - 0.5 * t;
            }
          }
        }

        if (target) {
          let dmg = sp.dmg * rangePenalty;
          if (state.stance === 'aggressive')                                    dmg *= 1.30;
          if (bird.traits.includes('Vengeful') && state.lostBirds.length > 0)  dmg *= 1.20;
          if (bird.traits.includes('Reckless'))                                 dmg *= 1.10;
          if (bird.traits.includes('Hates Drones') && target.type === 'drone') dmg *= 1.30;
          if (bird.traits.includes('Cautious') && state.stance === 'aggressive') dmg *= 0.85;
          dmg *= formBuff.dmgMult;

          let projColor   = sp.rangedType === 'rapid'  ? '#c8ff60'
                          : sp.rangedType === 'sniper' ? '#c0e8ff'
                          : sp.rangedType === 'triple' ? sp.color
                          : '#a0e060';
          let isDebuffing = false;
          if (bird.debuffApplied && bird.species === 'danger_sparrow') {
            isDebuffing        = true;
            bird.debuffApplied = false;
            projColor          = '#50a0cc';
            dmg *= 1.15;
          }

          if (sp.rangedType === 'triple') {
            // Beach Screamer: 3 fanned shots, each rolls for crit independently
            [-0.21, 0, 0.21].forEach(angleOff => {
              let shotDmg = dmg;
              const isCrit = Math.random() < Math.min(1, sp.critChance + formBuff.critBonus);
              if (isCrit) { shotDmg *= 2; spawnFloatText(bird.x, bird.y - 18, 'Cra Caw!'); state.morale = Math.min(100, state.morale + 2); runLog.push('bird_crit', { birdId: bird.id, target: target === state.boss ? 'boss' : target === state.miniBoss ? 'miniboss' : (target.type || 'enemy'), dmg: Math.round(shotDmg * 10) / 10 }); }
              fireProjAngled(bird.x, bird.y, target.x, target.y, angleOff, shotDmg, 'bird', projColor, isDebuffing, sp.rangedType, bird);
            });
          } else {
            const isCrit = Math.random() < Math.min(1, sp.critChance + formBuff.critBonus);
            if (isCrit) { dmg *= 2; spawnFloatText(bird.x, bird.y - 18, 'Cra Caw!'); state.morale = Math.min(100, state.morale + 2); runLog.push('bird_crit', { birdId: bird.id, target: target === state.boss ? 'boss' : target === state.miniBoss ? 'miniboss' : (target.type || 'enemy'), dmg: Math.round(dmg * 10) / 10 }); }
            fireProj(bird.x, bird.y, target.x, target.y, dmg, 'bird', projColor, isDebuffing, sp.rangedType, bird);
          }

          bird.flashTimer  = 0.12;
          bird.atkCooldown = ((1.0 / (sp.atkRate * atkMult)) + Math.random() * 0.25) / formBuff.atkRateMult;
          if (bird.traits.includes('Clueless')) bird.atkCooldown += Math.random() * 0.6;
        } else {
          bird.atkCooldown = 0.4 / formBuff.atkRateMult;
        }
      }
    }

    bird.flashTimer = Math.max(0, bird.flashTimer - dt);
    bird.peckAnimTimer = Math.max(0, (bird.peckAnimTimer || 0) - dt);
  });

  if (state.focusTarget && !state.focusTarget.alive) state.focusTarget = null;
}

// ════════════════════════════════════════════════
// UPDATE — ENEMIES
// ════════════════════════════════════════════════

function updateEnemies(dt) {
  const alive = state.birds.filter(b => b.alive);
  const meleeSlots = new Map();
  const canAcceptMelee = (bird) => {
    if (!bird) return false;
    const c = meleeSlots.get(bird.id) || 0;
    return c < 2;
  };
  const claimMeleeSlot = (bird) => {
    if (!bird) return;
    meleeSlots.set(bird.id, (meleeSlots.get(bird.id) || 0) + 1);
  };

  state.enemies.forEach(e => {
    if (!e.alive) return;
    if (e.debuffed) { e.debuffTimer -= dt; if (e.debuffTimer <= 0) { e.debuffed = false; e.debuffTimer = 0; } }

    if (e.pathFn) {
      e.pathTime = (e.pathTime || 0) + dt;
      const baseX = e.spawnX != null ? e.spawnX : e.x;
      const baseY = e.spawnY != null ? e.spawnY : e.y;
      const pos = e.pathFn(e.pathTime, baseX, baseY);
      if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        e.x = pos.x;
        e.y = pos.y;
      }
    }

    if (e.type === 'turret') {
      e.y += e.vy * dt * 60;
      e.atkCooldown -= dt;
      if (e.atkCooldown <= 0 && alive.length > 0) {
        const target = alive[Math.floor(Math.random() * alive.length)];
        fireProj(e.x, e.y, target.x, target.y, 14, 'enemy', '#cc3030');
        e.atkCooldown = 2.2 + Math.random() * 1.5;
        e.state = 'cooldown';
      } else if (e.atkCooldown < 0.5) { e.state = 'charging'; } else { e.state = 'idle'; }

    } else if (e.type === 'drone') {
      if (alive.length > 0) {
        let target = null;
        let bestD  = Infinity;
        alive.forEach(b => {
          const d = dist(e.x, e.y, b.x, b.y);
          if (canAcceptMelee(b)) {
            if (d < bestD) { bestD = d; target = b; }
          }
        });
        if (!target) {
          target = alive.reduce((best, b) =>
            dist(e.x, e.y, b.x, b.y) < dist(e.x, e.y, best.x, best.y) ? b : best);
          bestD = dist(e.x, e.y, target.x, target.y);
        } else {
          claimMeleeSlot(target);
        }
        const d   = bestD;
        const spd = 1.8 * dt * 60;
        const minDistDrone = BIRD_R + ENEMY_R;
        if (d > minDistDrone) {
          e.x += (target.x - e.x) / d * spd;
          e.y += (target.y - e.y) / d * spd;
        } else if (d > 2) {
          e.x -= (target.x - e.x) / d * spd * 0.5;
          e.y -= (target.y - e.y) / d * spd * 0.5;
        }
        e.atkCooldown -= dt;
        if (e.atkCooldown <= 0 && d < 75) {
          fireProj(e.x, e.y, target.x, target.y, 9, 'enemy', '#cc7030');
          e.atkCooldown = 1.1 + Math.random() * 0.8;
          e.state = 'charging';
        } else if (e.atkCooldown <= 0) { e.atkCooldown = 0.25; e.state = 'idle'; }
        // Hates Drones morale penalty
        state.birds.filter(b => b.alive && b.traits.includes('Hates Drones') && dist(b.x, b.y, e.x, e.y) < 90)
          .forEach(() => { state.morale = Math.max(0, state.morale - 0.3 * dt); });
      } else { e.y += 1.4 * dt * 60; }

    } else if (e.type === 'sparrow') {
      let target = null;
      let bestD  = Infinity;
      alive.forEach(b => {
        const d = dist(e.x, e.y, b.x, b.y);
        if (canAcceptMelee(b)) {
          if (d < bestD) { bestD = d; target = b; }
        }
      });
      if (!target && alive.length) {
        target = alive.reduce((best, b) =>
          dist(e.x, e.y, b.x, b.y) < dist(e.x, e.y, best.x, best.y) ? b : best);
        bestD = dist(e.x, e.y, target.x, target.y);
      } else if (target) {
        claimMeleeSlot(target);
      }

      if (target) {
        const d   = bestD;
        const spd = 1.5 * dt * 60;
        const minDistSparrow = BIRD_R + ENEMY_R;
        if (d > minDistSparrow) {
          e.x += (target.x - e.x) / d * spd;
          e.y += (target.y - e.y) / d * spd;
        } else if (d > 2) {
          e.x -= (target.x - e.x) / d * spd * 0.5;
          e.y -= (target.y - e.y) / d * spd * 0.5;
        }
        e.atkCooldown -= dt;
        if (e.atkCooldown <= 0 && d < 90) {
          fireProj(e.x, e.y, target.x, target.y, 18, 'enemy', '#cc3070');
          e.atkCooldown = 1.7 + Math.random() * 0.8;
          e.state = 'charging';
        } else if (e.atkCooldown <= 0) { e.atkCooldown = 0.3; e.state = 'idle'; }
      } else { e.y += 0.9 * dt * 60; }

    } else if (e.type === 'flak') {
      e.x += e.vx * dt * 60;
      e.y += e.vy * dt * 60;
      if (e.x < 40 || e.x > W - 40) e.vx *= -1;

      if (e.state === 'idle') {
        e.atkCooldown -= dt;
        if (e.atkCooldown <= 0) { e.state = 'charging'; e.chargeTimer = 2.0; e.chargeRadius = 0; }
      } else if (e.state === 'charging') {
        e.chargeTimer  -= dt;
        e.chargeRadius  = Math.min(130, e.chargeRadius + 75 * dt);
        if (e.chargeTimer <= 0) {
          // AoE burst
          state.birds.filter(b => b.alive).forEach(b => {
            if (dist(b.x, b.y, e.x, e.y) < e.chargeRadius) {
              let dmg = 35;
              if (state.formation === 'tight_cluster') dmg *= 1.5;
              if (state.stance === 'evasive')          dmg *= 0.78;
              b.hp -= dmg; b.flashTimer = 0.25;
              if (b.hp <= 0) killBird(b); else checkKamikazeTrigger(b);
            }
          });
          e.state = 'cooldown';
          e.chargeRadius  = 0;
          e.atkCooldown   = 4.0 + Math.random() * 3.0;
        }
      } else if (e.state === 'cooldown') {
        e.atkCooldown -= dt;
        if (e.atkCooldown <= 0) e.state = 'idle';
      }

    } else if (e.type === 'sniper') {
      e.y += e.vy * dt * 60;
      if (e.state === 'idle') {
        e.atkCooldown -= dt;
        if (e.atkCooldown <= 0 && alive.length > 0) {
          const leader = alive.find(b => b.formationSlot === 0) || alive[0];
          e.state = 'charging'; e.chargeTimer = 1.5; e.targetBirdId = leader.id;
        }
      } else if (e.state === 'charging') {
        e.chargeTimer -= dt;
        if (e.chargeTimer <= 0) {
          const target = state.birds.find(b => b.id === e.targetBirdId && b.alive);
          if (target) {
            let dmg = 45;
            if (state.stance === 'evasive') dmg *= 0.78;
            target.hp -= dmg; target.flashTimer = 0.25;
            if (target.hp <= 0) killBird(target); else checkKamikazeTrigger(target);
          }
          e.state = 'cooldown'; e.atkCooldown = 3.5 + Math.random() * 1.5; e.targetBirdId = null;
        }
      } else if (e.state === 'cooldown') {
        e.atkCooldown -= dt;
        if (e.atkCooldown <= 0) e.state = 'idle';
      }
    }

    e.flashTimer = Math.max(0, (e.flashTimer || 0) - dt);
    if (e.y > H + 80) {
      e.alive = false;
      if (typeof waveController !== 'undefined' && waveController && typeof waveController.markEnemyDead === 'function') {
        waveController.markEnemyDead(e.id);
      }
    }
  });

  // Inter-enemy separation to reduce overlapping / stacking, especially for drones and sparrows
  const sepRadius = ENEMY_R * 2.4;
  for (let i = 0; i < state.enemies.length; i++) {
    const a = state.enemies[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < state.enemies.length; j++) {
      const b = state.enemies[j];
      if (!b.alive) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d  = Math.sqrt(dx*dx + dy*dy) || 0;
      if (d > 0 && d < sepRadius) {
        const overlap = sepRadius - d;
        const push    = (overlap / sepRadius) * 0.7;
        const nx      = dx / d;
        const ny      = dy / d;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }

  state.enemies = state.enemies.filter(e => e.alive);
}

// ════════════════════════════════════════════════
// UPDATE — BOSS
// ════════════════════════════════════════════════

function updateBoss(dt) {
  if (!state.boss?.alive) return;
  const boss  = state.boss;
  const alive = state.birds.filter(b => b.alive);
  if (!alive.length) return;

  // Entry phase — boss descends from off-screen before engaging
  if (boss.entering) {
    boss.y += boss.vy * dt * 60;
    boss.x += boss.vx * dt * 60;
    if (boss.x < 70 || boss.x > W - 70) boss.vx *= -1;
    if (boss.y >= BOSS_FIGHT_Y) {
      boss.y = BOSS_FIGHT_Y;
      boss.entering = false;
      boss.vy = 0;
    }
    return;
  }

  boss.flashTimer = Math.max(0, boss.flashTimer - dt);
  boss.x += boss.vx * dt * 60;
  if (boss.x < 70 || boss.x > W - 70) boss.vx *= -1;
  if (boss.debuffed) { boss.debuffTimer -= dt; if (boss.debuffTimer <= 0) boss.debuffed = false; }

  // Parry: periodic window that negates melee hits
  if (boss.parryActive) {
    boss.parryTimer -= dt;
    if (boss.parryTimer <= 0) { boss.parryActive = false; boss.parryTimer = 0; }
  } else {
    boss.parryCooldown -= dt;
    if (boss.parryCooldown <= 0 && Math.random() < BOSS_PARRY_CHANCE) {
      boss.parryActive = true;
      boss.parryTimer  = BOSS_PARRY_WINDOW;
      boss.parryCooldown = BOSS_PARRY_COOLDOWN;
    }
  }

  // Anti-melee sweep: when 2+ melee birds in close range, charge then sweep + knockback
  if (boss.sweepMeleeCharging) {
    boss.sweepMeleeTimer -= dt;
    if (boss.sweepMeleeTimer <= 0) {
      const meleeInRadius = alive.filter(b => {
        const sp = b.liveSp || SPECIES[b.species];
        if (!sp || sp.combatClass !== 'melee') return false;
        return dist(b.x, b.y, boss.x, boss.y) < BOSS_SWEEP_RADIUS;
      });
      meleeInRadius.forEach(b => {
        b.hp -= BOSS_SWEEP_DAMAGE;
        b.flashTimer = 0.25;
        if (b.hp <= 0) killBird(b); else checkKamikazeTrigger(b);
        const dx = b.x - boss.x, dy = b.y - boss.y;
        const d = dist(b.x, b.y, boss.x, boss.y) || 1;
        const push = BOSS_SWEEP_KNOCKBACK_DIST;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
        b.meleeState = 'returning';
        b.knockbackRecovery = KNOCKBACK_RECOVERY_TIME;
      });
      runLog.push('boss_sweep', { birdsHit: meleeInRadius.length });
      boss.sweepMeleeCharging = false;
      boss.sweepMeleeCooldown = BOSS_SWEEP_COOLDOWN;
    }
  } else {
    boss.sweepMeleeCooldown -= dt;
    const meleeInRadius = alive.filter(b => {
      const sp = b.liveSp || SPECIES[b.species];
      if (!sp || sp.combatClass !== 'melee') return false;
      return dist(b.x, b.y, boss.x, boss.y) < BOSS_SWEEP_RADIUS;
    });
    if (meleeInRadius.length >= BOSS_SWEEP_TRIGGER_COUNT && boss.sweepMeleeCooldown <= 0) {
      boss.sweepMeleeCharging = true;
      boss.sweepMeleeTimer = BOSS_SWEEP_CHARGE_UP;
    }
  }
  if (boss.sweepMeleeCharging) {
    boss.sweepMeleeRadius = (1 - boss.sweepMeleeTimer / BOSS_SWEEP_CHARGE_UP) * BOSS_SWEEP_RADIUS;
  } else {
    boss.sweepMeleeRadius = 0;
  }

  if (boss.type === 'a') {
    // Canopy Sweeper — periodic AoE sweeps
    if (boss.state === 'idle') {
      boss.atkCooldown -= dt;
      if (boss.atkCooldown <= 0) { boss.state = 'charging'; boss.chargeTimer = 1.5; boss.sweepRadius = 0; }
    } else if (boss.state === 'charging') {
      boss.chargeTimer  -= dt;
      boss.sweepRadius   = Math.min(180, boss.sweepRadius + 140 * dt);
      if (boss.chargeTimer <= 0) {
        state.birds.filter(b => b.alive).forEach(b => {
          if (dist(b.x, b.y, boss.x, boss.y) < boss.sweepRadius) {
            let dmg = 40;
            if (state.formation === 'loose_swarm') dmg *= 0.55;
            b.hp -= dmg; b.flashTimer = 0.25;
            if (b.hp <= 0) killBird(b); else checkKamikazeTrigger(b);
            const sp = b.liveSp || SPECIES[b.species];
            if (sp && sp.combatClass === 'melee') {
              const dx = b.x - boss.x, dy = b.y - boss.y;
              const d = dist(b.x, b.y, boss.x, boss.y) || 1;
              b.x += (dx / d) * BOSS_SWEEP_KNOCKBACK_DIST;
              b.y += (dy / d) * BOSS_SWEEP_KNOCKBACK_DIST;
              b.meleeState = 'returning';
              b.knockbackRecovery = KNOCKBACK_RECOVERY_TIME;
            }
          }
        });
        boss.state = 'cooldown'; boss.sweepRadius = 0; boss.atkCooldown = 5.0;
      }
    } else if (boss.state === 'cooldown') {
      boss.atkCooldown -= dt;
      if (boss.atkCooldown <= 0) { boss.state = 'idle'; boss.atkCooldown = 2.5; }
    }
    // Occasional projectile regardless
    if (boss.state !== 'charging') {
      boss.atkCooldown -= dt * 0.3;
      if (boss.atkCooldown < -0.5 && alive.length > 0) {
        fireProj(boss.x, boss.y, alive[Math.floor(Math.random()*alive.length)].x,
          alive[Math.floor(Math.random()*alive.length)].y, 22, 'enemy', '#aa3030');
        boss.atkCooldown += 2.0;
      }
    }

  } else if (boss.type === 'b') {
    // Nest Mother — spawns adds, exposed when all adds dead
    boss.addTimer -= dt;
    if (boss.addTimer <= 0) {
      boss.state = 'spawning_adds';
      for (let i = 0; i < 3; i++) spawnEnemy('drone');
      boss.addTimer = 9.0;
      state.morale  = Math.max(0, state.morale - 5);
    }
    if (state.enemies.filter(e => e.alive && e.type === 'drone').length === 0) {
      boss.state = 'exposed';
    } else if (boss.state !== 'spawning_adds') {
      boss.state = 'idle';
    }
    boss.atkCooldown -= dt;
    if (boss.atkCooldown <= 0 && alive.length > 0) {
      const t = alive[Math.floor(Math.random() * alive.length)];
      const dmg = boss.state === 'exposed' ? 10 : 20;
      fireProj(boss.x, boss.y, t.x, t.y, dmg, 'enemy', '#a07020');
      boss.atkCooldown = 1.8;
    }

  } else if (boss.type === 'c') {
    // Phase Walker — shielded / exposed phases
    boss.shieldTimer -= dt;
    if (boss.shieldTimer <= 0) {
      boss.state      = boss.state === 'shielded' ? 'exposed' : 'shielded';
      boss.shieldTimer = boss.state === 'exposed'  ? 3.5 : 5.0;
    }
    if (boss.state === 'exposed') {
      boss.atkCooldown -= dt;
      if (boss.atkCooldown <= 0 && alive.length > 0) {
        const t = alive[Math.floor(Math.random() * alive.length)];
        fireProj(boss.x, boss.y, t.x, t.y, 25, 'enemy', '#4050aa');
        boss.atkCooldown = 1.8;
      }
    }

  } else if (boss.type === 'd') {
    // High Perch — sniper attacks on leader
    if (boss.state === 'idle') {
      boss.atkCooldown -= dt;
      if (boss.atkCooldown <= 0 && alive.length > 0) {
        const leader = alive.find(b => b.formationSlot === 0) || alive[0];
        boss.state = 'charging'; boss.chargeTimer = 1.8; boss.laserTargetId = leader.id;
      }
    } else if (boss.state === 'charging') {
      boss.chargeTimer -= dt;
      if (boss.chargeTimer <= 0) {
        const target = state.birds.find(b => b.id === boss.laserTargetId && b.alive);
        if (target) {
          let dmg = 60;
          if (state.stance === 'evasive') dmg *= 0.78;
          target.hp -= dmg; target.flashTimer = 0.3;
          if (target.hp <= 0) killBird(target); else checkKamikazeTrigger(target);
        }
        boss.state = 'cooldown'; boss.atkCooldown = 4.0; boss.laserTargetId = null;
      }
    } else if (boss.state === 'cooldown') {
      boss.atkCooldown -= dt;
      if (boss.atkCooldown <= 0) { boss.state = 'idle'; boss.atkCooldown = 0; }
    }
  }
}

function updateMiniBoss(dt) {
  const mb = state.miniBoss;
  if (!mb?.alive) return;
  const alive = state.birds.filter(b => b.alive);
  if (!alive.length) return;

  if (mb.debuffed) { mb.debuffTimer -= dt; if (mb.debuffTimer <= 0) mb.debuffed = false; }
  mb.x += mb.vx * dt * 50;
  mb.y += mb.vy * dt * 50;
  if (mb.x < 80 || mb.x > W - 80) mb.vx *= -1;
  if (mb.y > H * 0.55) mb.vy = -0.2;
  if (mb.y < 80) mb.vy = 0.35;
  mb.flashTimer = Math.max(0, mb.flashTimer - dt);

  // Mini-boss parry (lighter)
  if (mb.parryActive) {
    mb.parryTimer -= dt;
    if (mb.parryTimer <= 0) { mb.parryActive = false; mb.parryTimer = 0; }
  } else {
    mb.parryCooldown -= dt;
    if (mb.parryCooldown <= 0 && Math.random() < MINI_BOSS_PARRY_CHANCE) {
      mb.parryActive = true;
      mb.parryTimer  = MINI_BOSS_PARRY_WINDOW;
      mb.parryCooldown = MINI_BOSS_PARRY_COOLDOWN;
    }
  }

  // Mini-boss anti-melee sweep (lighter)
  if (mb.sweepMeleeCharging) {
    mb.sweepMeleeTimer -= dt;
    if (mb.sweepMeleeTimer <= 0) {
      const meleeInRadius = alive.filter(b => {
        const sp = b.liveSp || SPECIES[b.species];
        if (!sp || sp.combatClass !== 'melee') return false;
        return dist(b.x, b.y, mb.x, mb.y) < BOSS_SWEEP_RADIUS;
      });
      meleeInRadius.forEach(b => {
        b.hp -= BOSS_SWEEP_DAMAGE * 0.8;
        b.flashTimer = 0.25;
        if (b.hp <= 0) killBird(b); else checkKamikazeTrigger(b);
        const dx = b.x - mb.x, dy = b.y - mb.y;
        const d = dist(b.x, b.y, mb.x, mb.y) || 1;
        const push = BOSS_SWEEP_KNOCKBACK_DIST * 0.9;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
        b.meleeState = 'returning';
        b.knockbackRecovery = KNOCKBACK_RECOVERY_TIME;
      });
      mb.sweepMeleeCharging = false;
      mb.sweepMeleeCooldown = MINI_BOSS_SWEEP_COOLDOWN;
    }
  } else {
    mb.sweepMeleeCooldown -= dt;
    const meleeInRadius = alive.filter(b => {
      const sp = b.liveSp || SPECIES[b.species];
      if (!sp || sp.combatClass !== 'melee') return false;
      return dist(b.x, b.y, mb.x, mb.y) < BOSS_SWEEP_RADIUS;
    });
    if (meleeInRadius.length >= MINI_BOSS_SWEEP_TRIGGER_COUNT && mb.sweepMeleeCooldown <= 0) {
      mb.sweepMeleeCharging = true;
      mb.sweepMeleeTimer = BOSS_SWEEP_CHARGE_UP;
    }
  }
  if (mb.sweepMeleeCharging) {
    mb.sweepMeleeRadius = (1 - mb.sweepMeleeTimer / BOSS_SWEEP_CHARGE_UP) * BOSS_SWEEP_RADIUS;
  } else {
    mb.sweepMeleeRadius = 0;
  }

  mb.atkCooldown -= dt;
  const warmupOver = typeof state.runTime === 'number' && mb.spawnTime != null && (state.runTime - mb.spawnTime) >= 3;
  if (mb.atkCooldown <= 0 && warmupOver) {
    const t = alive[Math.floor(Math.random() * alive.length)];
    if (mb.pattern === 'spread') {
      for (let i = -1; i <= 1; i++) {
        const a = Math.atan2(t.y - mb.y, t.x - mb.x) + i * 0.35;
        fireProj(mb.x, mb.y, mb.x + Math.cos(a) * 200, mb.y + Math.sin(a) * 200, 18, 'enemy', mb.color);
      }
      mb.atkCooldown = 2.2;
    } else if (mb.pattern === 'burst') {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + mb.phaseTimer * 0.5;
        fireProj(mb.x, mb.y, mb.x + Math.cos(a) * 300, mb.y + Math.sin(a) * 300, 14, 'enemy', mb.color);
      }
      mb.atkCooldown = 3.0;
    } else {
      fireProj(mb.x, mb.y, t.x, t.y, 22, 'enemy', mb.color);
      mb.atkCooldown = 1.8;
    }
  }
  mb.phaseTimer += dt;
}

// ════════════════════════════════════════════════
// UPDATE — PROJECTILES
// ════════════════════════════════════════════════

function updateProjectiles(dt) {
  state.projectiles.forEach(p => {
    if (!p.alive) return;
    p.x += p.vx; p.y += p.vy;
    if (p.trail) {
      p.trail.push({ x: p.x, y: p.y });
      const maxLen = p.rangedType === 'sniper' ? 4 : p.rangedType === 'rapid' ? 6 : 4;
      if (p.trail.length > maxLen) p.trail.shift();
    }
    if (p.x < -20 || p.x > W+20 || p.y < -20 || p.y > H+20) { p.alive = false; return; }

    if (p.owner === 'bird') {
      // Hit mini-boss
      if (state.miniBoss?.alive) {
        if (dist(p.x, p.y, state.miniBoss.x, state.miniBoss.y) < 20 + PROJ_R) {
          if (p.debuffing) { state.miniBoss.debuffed = true; state.miniBoss.debuffTimer = 4; }
          let dmg = p.dmg * (state.miniBoss.debuffed ? 1.10 : 1.0);
          spawnProjHitSparks(p.x, p.y, p.color);
          state.miniBoss.hp -= dmg; state.miniBoss.flashTimer = 0.1; p.alive = false;
          state.score += 30;
          awardBirdXP(p.ownerBird, dmg * 0.25);
          if (state.miniBoss.hp <= 0) {
            state.miniBoss.alive = false;
            state.kills++; state.score += 300;
            state.morale = Math.min(100, state.morale + 15);
            runLog.push('miniboss_kill', { miniType: state.miniBoss.type });
          }
          return;
        }
      }
      // Hit boss
      if (state.boss?.alive && state.boss.state !== 'shielded') {
        if (dist(p.x, p.y, state.boss.x, state.boss.y) < 30 + PROJ_R) {
          if (p.debuffing) { state.boss.debuffed = true; state.boss.debuffTimer = 6; }
          let dmg = p.dmg;
          if (state.boss.debuffed) dmg *= 1.12;
          spawnProjHitSparks(p.x, p.y, p.color);
          state.boss.hp -= dmg; state.boss.flashTimer = 0.1; p.alive = false;
          state.score += 50;
          awardBirdXP(p.ownerBird, dmg * 0.3);
          if (state.boss.hp <= 0) {
            state.boss.alive = false; state.bossKilled = true;
            state.kills++; state.score += 1000;
            state.morale = Math.min(100, state.morale + 30);
            runLog.push('boss_kill', { bossType: state.boss.type, killerBirdId: p.ownerBird?.id ?? 'projectile' });
          }
          return;
        }
      }
      // Hit enemy
      for (const e of state.enemies) {
        if (!e.alive) continue;
        if (dist(p.x, p.y, e.x, e.y) < ENEMY_R + PROJ_R) {
          if (p.debuffing) { e.debuffed = true; e.debuffTimer = 5; }
          let dmg = p.dmg * (e.debuffed ? 1.10 : 1.0);
          spawnProjHitSparks(p.x, p.y, p.color);
          e.hp -= dmg; e.flashTimer = 0.1; p.alive = false;
          awardBirdXP(p.ownerBird, dmg * 0.2);
          if (e.hp <= 0) {
            e.alive = false; state.kills++; state.score += 100;
            state.morale = Math.min(100, state.morale + 4);
            waveController.markEnemyDead(e.id);
            runLog.push('enemy_kill', { enemyType: e.type, killedBy: p.ownerBird?.id ?? 'projectile', score: 100 });
          }
          break;
        }
      }
    } else {
      // Hit bird
      for (const b of state.birds) {
        if (!b.alive) continue;
        if (dist(p.x, p.y, b.x, b.y) < BIRD_R + PROJ_R) {
          if (state.formation === 'loose_swarm' && Math.random() < FORMATION_BUFFS.loose_swarm.dodgeChance) {
            p.alive = false;
            spawnFloatText(b.x, b.y - 18, 'DODGE!', '#8aaa50', 11);
            break;
          }
          let dmg = p.dmg;
          if (state.stance === 'evasive')    dmg *= 0.78;
          if (state.stance === 'aggressive') dmg *= 1.20;
          const cohesion = state.birds.filter(x => x.alive).length / state.birds.length;
          dmg *= getFormationArmor(state.formation, b.formationSlot, cohesion);

          // Angry Honker aura
          const nearHonkers = state.birds.filter(hk =>
            hk.alive && hk !== b && hk.species === 'angry_honker' && dist(hk.x, hk.y, b.x, b.y) < 85);
          dmg *= nearHonkers.length >= 2 ? 0.62 : nearHonkers.length === 1 ? 0.72 : 1.0;

          // Loiterer screen
          const loiterer = state.birds.find(fl =>
            fl.alive && fl !== b && fl.species === 'feathered_loiter' &&
            Math.abs(fl.formationSlot - b.formationSlot) <= 1 && dist(fl.x, fl.y, b.x, b.y) < 70);
          if (loiterer) dmg *= 0.85;

          // Protective trait bodyblock
          const protector = state.birds.find(pb =>
            pb !== b && pb.alive && pb.traits.includes('Protective') && dist(pb.x, pb.y, b.x, b.y) < 60);
          if (protector && !b.traits.includes('Protective')) dmg *= 0.85;

          spawnProjHitSparks(p.x, p.y, p.color);
          b.hp -= dmg; b.flashTimer = 0.2; p.alive = false;
          awardBirdXP(b, p.dmg * 0.1);
          if (b.hp <= 0) killBird(b); else checkKamikazeTrigger(b);
          break;
        }
      }
    }
  });
  state.projectiles = state.projectiles.filter(p => p.alive);
}

// ════════════════════════════════════════════════
// UPDATE — FLOAT TEXTS
// ════════════════════════════════════════════════

function updateFloatTexts(dt) {
  state.floatTexts.forEach(ft => { ft.timer -= dt; ft.y -= 28 * dt; });
  state.floatTexts = state.floatTexts.filter(ft => ft.timer > 0);
}

function updatePeckSparks(dt) {
  state.peckSparks = state.peckSparks || [];
  state.peckSparks.forEach(s => {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
  });
  state.peckSparks = state.peckSparks.filter(s => s.life > 0);
}

function updateProjHitSparks(dt) {
  state.projHitSparks = state.projHitSparks || [];
  state.projHitSparks.forEach(s => {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
  });
  state.projHitSparks = state.projHitSparks.filter(s => s.life > 0);
}

function updateMuzzleFlashes(dt) {
  state.muzzleFlashes = state.muzzleFlashes || [];
  state.muzzleFlashes.forEach(m => { m.timer -= dt; });
  state.muzzleFlashes = state.muzzleFlashes.filter(m => m.timer > 0);
}

// ════════════════════════════════════════════════
// UPDATE — SPAWNER
// ════════════════════════════════════════════════

function updateSpawner() {
  // legacy schedule-based spawner; retained as a fallback for now
}

// ════════════════════════════════════════════════
// UPDATE — HAZARDS
// ════════════════════════════════════════════════

function updateHazards(dt) {
  if (state.crosswindTimer > 0) state.crosswindTimer -= dt;
  state.hazards.forEach(hz => {
    if (!hz.alive) return;
    if (hz.type === 'glare_zone') {
      hz.y += hz.vy * dt; hz.timer += dt;
      if (hz.timer >= hz.duration || hz.y > H + 100) { hz.alive = false; return; }
      state.birds.filter(b => b.alive && b.x >= hz.x && b.x <= hz.x + hz.w && b.y >= hz.y && b.y <= hz.y + hz.h)
        .forEach(b => { b.atkCooldown += 0.015; }); // slight awareness penalty

    } else if (hz.type === 'turbine_blade') {
      hz.y += hz.vy * dt; hz.angle += 2.5 * dt;
      if (hz.y > H + 80) { hz.alive = false; return; }
      state.birds.filter(b => b.alive).forEach(b => {
        if (dist(b.x, b.y, hz.x, hz.y) < hz.r + BIRD_R) {
          b.hp -= 30 * dt; b.flashTimer = 0.1;
          if (b.hp <= 0) killBird(b);
          b.x += (b.x - hz.x) * 0.3; b.y += (b.y - hz.y) * 0.3;
        }
      });

    } else if (hz.type === 'updraft') {
      hz.timer += dt;
      if (hz.timer >= hz.duration) { hz.alive = false; return; }
      state.birds.filter(b => b.alive && Math.abs(b.x - hz.x) < hz.w / 2).forEach(b => {
        b.stamina = Math.min(100, b.stamina + 3.0 * dt);
        b.updraftTimer = 0.5; // brief drift out of position
      });
    }
  });
  state.hazards = state.hazards.filter(hz => hz.alive);
}

// ════════════════════════════════════════════════
// UPDATE — CAMERA
// ════════════════════════════════════════════════

function updateCamera() {
  const cam = state.camera;
  if (cam.followId !== null) {
    const bird = state.birds.find(b => b.id === cam.followId && b.alive);
    if (bird) {
      cam.panX = (W / 2 - bird.x) * (cam.zoom - 1);
      cam.panY = (H / 2 - bird.y) * (cam.zoom - 1);
    } else { cam.followId = null; }
  }
}

// ════════════════════════════════════════════════
// PATTERN HELPERS (ENEMY PROJECTILES)
// ════════════════════════════════════════════════

function getFrontLineBird() {
  const alive = state.birds.filter(b => b.alive);
  if (!alive.length) return null;
  const leader = alive.find(b => b.formationSlot === 0);
  return leader || alive[0];
}

function fireEnemyShotAngle(originX, originY, angleRad, dmg, color) {
  const travel = 900;
  const toX = originX + Math.cos(angleRad) * travel;
  const toY = originY + Math.sin(angleRad) * travel;
  fireProj(originX, originY, toX, toY, dmg, 'enemy', color || '#cc3030');
}

function circleAttack(originX, originY, opts) {
  const options = opts || {};
  const stepDeg = options.density != null ? options.density : 20;
  const baseDmg = options.damage != null ? options.damage : 16;
  const wobble  = options.wobble != null ? options.wobble : 0;
  for (let angle = 0; angle < 360; angle += stepDeg) {
    const rad = (angle + wobble) * Math.PI / 180;
    fireEnemyShotAngle(originX, originY, rad, baseDmg, options.color || '#cc3030');
  }
}

function spreadShot(originX, originY, opts) {
  const options = opts || {};
  const arcDeg  = options.arc != null ? options.arc : 45;
  const count   = options.count != null ? options.count : 5;
  const baseDmg = options.damage != null ? options.damage : 18;
  const aimed   = options.aimed !== false;

  let baseAngle;
  if (aimed) {
    const target = getFrontLineBird();
    if (target) {
      baseAngle = Math.atan2(target.y - originY, target.x - originX);
    } else {
      baseAngle = -Math.PI / 2;
    }
  } else {
    baseAngle = -Math.PI / 2;
  }

  if (count <= 1) {
    fireEnemyShotAngle(originX, originY, baseAngle, baseDmg, options.color || '#cc3030');
    return;
  }

  const arcRad = arcDeg * Math.PI / 180;
  const start  = baseAngle - arcRad / 2;
  const step   = arcRad / (count - 1);
  for (let i = 0; i < count; i++) {
    const ang = start + i * step;
    fireEnemyShotAngle(originX, originY, ang, baseDmg, options.color || '#cc3030');
  }
}

// ════════════════════════════════════════════════
// PATH HELPERS (ENEMY MOVEMENT)
// ════════════════════════════════════════════════

function makeSinePath(options) {
  const opts = options || {};
  const amplitude = opts.amplitude != null ? opts.amplitude : 80;
  const wavelength = opts.wavelength != null ? opts.wavelength : 260;
  const speed = opts.speed != null ? opts.speed : 60;
  const phase = opts.phase != null ? opts.phase : 0;
  return function pathFn(t, startX, startY) {
    const y = startY + speed * t;
    const x = startX + amplitude * Math.sin((y / wavelength) * Math.PI * 2 + phase);
    return { x, y };
  };
}

function makeBezierPath(p0, p1, p2, p3, duration) {
  const total = duration || 4.0;
  return function pathFn(t) {
    const u = Math.min(1, t / total);
    const uu = u * u;
    const uuu = uu * u;
    const tt = (1 - u);
    const ttt = tt * tt * tt;
    const x = ttt*p0.x + 3*tt*tt*u*p1.x + 3*tt*uu*p2.x + uuu*p3.x;
    const y = ttt*p0.y + 3*tt*tt*u*p1.y + 3*tt*uu*p2.y + uuu*p3.y;
    return { x, y };
  };
}

// ════════════════════════════════════════════════
// FORMATION HELPERS
// ════════════════════════════════════════════════

function spawnGridFormation(ctx, groupId, rows, cols, type, opts) {
  const options = opts || {};
  const spacingX = options.spacingX != null ? options.spacingX : 40;
  const spacingY = options.spacingY != null ? options.spacingY : 36;
  const offsetX  = options.offsetX != null ? options.offsetX : (W / 2 - ((cols - 1) * spacingX) / 2);
  const offsetY  = options.offsetY != null ? options.offsetY : -40;
  const vx       = options.vx != null ? options.vx : 0;
  const vy       = options.vy != null ? options.vy : 0.5;

  ctx.spawnGroup(groupId, (spawn) => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        spawn(type, {
          x: offsetX + c * spacingX,
          y: offsetY + r * spacingY,
          vx: vx,
          vy: vy,
          gridRow: r,
          gridCol: c,
        });
      }
    }
  });

  // Simple inter-enemy separation to reduce visual clustering/overlap
  const sepRadius = ENEMY_R * 2;
  for (let i = 0; i < state.enemies.length; i++) {
    const a = state.enemies[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < state.enemies.length; j++) {
      const b = state.enemies[j];
      if (!b.alive) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d  = Math.sqrt(dx*dx + dy*dy) || 0;
      if (d > 0 && d < sepRadius) {
        const push = (sepRadius - d) / sepRadius * 0.5;
        const nx   = dx / d;
        const ny   = dy / d;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }
}

// ════════════════════════════════════════════════
// MAIN UPDATE
// ════════════════════════════════════════════════

function update(dt) {
  state.runTime += dt;

  // Run log: heartbeat every ~20s for soft-lock proof
  if (state.screen === 'battle' && runLog.runMeta && state.runTime - state.heartbeatLastT >= 20) {
    state.heartbeatLastT = state.runTime;
    const wc = typeof waveController !== 'undefined' ? waveController : null;
    runLog.push('run_heartbeat', {
      runTime: state.runTime,
      score: state.score,
      kills: state.kills,
      bossTriggered: state.bossTriggered,
      bossActive: state.bossActive,
      scriptDone: wc ? wc.scriptDone : false,
      pendingCmdType: wc && wc.pendingCmd ? wc.pendingCmd.type : null,
      pendingCmdGroupId: wc && wc.pendingCmd ? wc.pendingCmd.groupId : null,
      enemyCount: state.enemies ? state.enemies.filter(e => e.alive).length : 0,
      flockAliveCount: state.birds ? state.birds.filter(b => b.alive).length : 0,
      stage: state.stage,
    });
  }

  // Run log: damage snapshot every ~5s
  if (state.screen === 'battle' && runLog.runMeta && state.runTime - state.damageSnapshotLastT >= 5) {
    state.damageSnapshotLastT = state.runTime;
    const alive = state.birds.filter(b => b.alive);
    const totalHp = alive.reduce((s, b) => s + b.maxHp, 0);
    const currentHp = alive.reduce((s, b) => s + b.hp, 0);
    const flockHpPct = totalHp > 0 ? (currentHp / totalHp) * 100 : 0;
    const bossHpPct = state.boss?.alive && state.boss.maxHp ? (state.boss.hp / state.boss.maxHp) * 100 : null;
    const miniBossHpPct = state.miniBoss?.alive && state.miniBoss.maxHp ? (state.miniBoss.hp / state.miniBoss.maxHp) * 100 : null;
    runLog.push('damage_snapshot', {
      flockHpPct: Math.round(flockHpPct * 10) / 10,
      bossHpPct: bossHpPct != null ? Math.round(bossHpPct * 10) / 10 : null,
      miniBossHpPct: miniBossHpPct != null ? Math.round(miniBossHpPct * 10) / 10 : null,
      enemyCount: state.enemies ? state.enemies.filter(e => e.alive).length : 0,
    });
  }

  // Scroll speed — slight acceleration near boss
  const approach      = state.bossTriggered ? 0 : Math.max(0, (state.runTime - (BOSS_TRIGGER - 10)) / 10);
  state.bgOffset      = (state.bgOffset + dt * (state.bgScrollSpeed + approach * 20)) % 60;

  state.simTimer += dt;
  if (state.simTimer >= SIM_TICK) {
    state.simTimer = 0;
    evaluateCallCards();
    evaluateSynergies();
  }

  state.birds.forEach(b => { if (b.alive) b.stamina = Math.min(100, b.stamina + 0.3 * dt); });

  if (state.isReorganizing) {
    state.reorgTimer -= dt;
    if (state.reorgTimer <= 0) state.isReorganizing = false;
  }

  state.cardFlash     = state.cardFlash.map(f => Math.max(0, f - dt));
  state.cardCooldowns = state.cardCooldowns.map(c => Math.max(0, c - dt));

  updateMorale(dt);
  updateFormationTargets();
  waveController.tick(dt, state.runTime);
  updateSpawner();
  if (state.boss?.alive) state.boss.meleeDmgThisTick = 0;
  if (state.miniBoss?.alive) state.miniBoss.meleeDmgThisTick = 0;
  updateBirds(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updateMiniBoss(dt);
  updateProjectiles(dt);
  updateHazards(dt);
  updateFloatTexts(dt);
  updatePeckSparks(dt);
  updateProjHitSparks(dt);
  updateMuzzleFlashes(dt);
  updateCamera();

  updateHUD();

  const allDead      = state.birds.every(b => !b.alive);
  const bossDefeated = state.bossTriggered && state.bossKilled;
  const scriptTimeout = waveController.scriptDone &&
                        state.runTime >= waveController.scriptDoneTime + 10;

  if (allDead || bossDefeated || scriptTimeout) {
    if (bossDefeated && state.stage < 3) {
      advanceStage();
      return;
    } else if (bossDefeated && state.stage === 3 && state.infiniteMode) {
      state.infiniteLoop++;
      state.diffMult      *= 1.25;
      runLog.push('infinite_loop', { loop: state.infiniteLoop, diffMult: state.diffMult });
      state.runTime        = 0;
      state.bossKilled     = false;
      state.bossActive     = false;
      state.bossTriggered  = false;
      state.boss           = null;
      state.miniBoss       = null;
      state.enemies        = [];
      state.projectiles    = [];
      state.hazards        = [];
      state.crosswindTimer = 0;
      waveController.startLevel(3, state.currentDifficulty);
      spawnFloatText(W / 2, H / 2 - 30, `LOOP ${state.infiniteLoop}`, '#ff8040');
      spawnFloatText(W / 2, H / 2 + 10, `THREAT ×${state.diffMult.toFixed(2)}`, '#ff8040');
      return;
    } else {
      if (bossDefeated || (!allDead && scriptTimeout)) {
        state.runSuccess = true;
        state.score += state.birds.filter(b => b.alive).length * 200;
        if (state.bossKilled) state.score += 500;
      }
      state.score = Math.round(state.score);
      running     = false;
      setTimeout(showDebrief, 600);
    }
  }
}

// ════════════════════════════════════════════════
// BIRD SPRITE  (bird.png tinted per species)
// ════════════════════════════════════════════════

let   birdMaskCanvas = null;
const birdSprites    = {};   // keyed by species key, value is a pre-baked offscreen canvas

function loadBirdSprite() {
  const img = new Image();
  img.src = 'bird.png';
  img.onload = () => {
    // Convert white-on-black silhouette → transparent alpha mask
    // (white pixels become opaque, black pixels become transparent)
    const tmp  = document.createElement('canvas');
    tmp.width  = img.width;
    tmp.height = img.height;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(img, 0, 0);
    const id = tctx.getImageData(0, 0, tmp.width, tmp.height);
    const d  = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
      d[i] = d[i+1] = d[i+2] = 255;
      d[i+3] = Math.round(lum);
    }
    tctx.putImageData(id, 0, 0);
    birdMaskCanvas = tmp;
    bakeBirdSprites();
  };
  img.onerror = () => { /* bird.png missing — canvas falls back to colored circle */ };
}

function bakeBirdSprites() {
  if (!birdMaskCanvas) return;
  const size = BIRD_R * 2 + 6;
  Object.entries(SPECIES).forEach(([key, sp]) => {
    const oc   = document.createElement('canvas');
    oc.width   = size;
    oc.height  = size;
    const octx = oc.getContext('2d');
    // 1) fill with species color
    octx.fillStyle = sp.color;
    octx.fillRect(0, 0, size, size);
    // 2) mask to the bird silhouette shape
    octx.globalCompositeOperation = 'destination-in';
    octx.drawImage(birdMaskCanvas, 0, 0, size, size);
    birdSprites[key] = oc;
  });
}

// ════════════════════════════════════════════════
// STAGE PROGRESSION
// ════════════════════════════════════════════════

function advanceStage() {
  const fromStage = state.stage;
  state.stage++;
  state.currentLevel   = state.stage;
  runLog.push('stage_advance', { fromStage, toStage: state.stage });
  state.runTime        = 0;
  state.bossKilled     = false;
  state.bossActive     = false;
  state.bossTriggered  = false;
  state.boss           = null;
  state.miniBoss       = null;
  state.enemies        = [];
  state.projectiles    = [];
  state.hazards        = [];
  state.crosswindTimer = 0;
  state.bgScrollSpeed  = state.stage === 2 ? 45 : 55;
  waveController.startLevel(state.currentLevel, state.currentDifficulty);
  spawnFloatText(W / 2, H / 2 - 30, `STAGE ${state.stage - 1} CLEAR`, '#50cc40');
  spawnFloatText(W / 2, H / 2 + 10, `STAGE ${state.stage} INCOMING`, '#c8e060');
  const lvlLabel = document.getElementById('hud-level-label');
  if (lvlLabel) lvlLabel.textContent = `STAGE ${state.stage} · ${state.currentDifficulty.toUpperCase()}`;
}

// ════════════════════════════════════════════════
// RENDERER
// ════════════════════════════════════════════════

let canvas, ctx;

function render() {
  const cam = state.camera;
  ctx.clearRect(0, 0, W, H);

  // Camera transform for world
  ctx.save();
  ctx.translate(W / 2 + cam.panX, H / 2 + cam.panY);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-W / 2, -H / 2);

  drawBackground();
  drawHazards();
  drawProjectiles();
  drawEnemies();
  drawMiniBoss();
  drawBoss();
  drawBirds();
  drawMuzzleFlashes();
  drawPeckSparks();
  drawProjHitSparks();
  drawFloatTexts();
  if (state.isReorganizing) drawReorgOverlay();

  ctx.restore();

  // Boss bar drawn after transform (fixed canvas position)
  if (state.bossActive && state.boss?.alive) drawBossBar();
  if (state.miniBoss?.alive) drawMiniBossBar();
}

function drawBackground() {
  state.stage === 2 ? drawBgGorge() : drawBgCanopy();
}

function drawBgCanopy() {
  ctx.fillStyle = '#0a1008';
  ctx.fillRect(0, 0, W, H);
  const gW = 90, gH = 60, offY = state.bgOffset % gH;
  for (let gx = 0; gx < W; gx += gW) {
    for (let gy = -gH + offY; gy < H + gH; gy += gH) {
      const tX = gx+4, tY = gy+4, tW = gW-8, tH = gH-8;
      ctx.fillStyle = '#0f1a0b'; ctx.fillRect(tX, tY, tW, tH);
      ctx.strokeStyle = '#182810'; ctx.lineWidth = 0.5; ctx.strokeRect(tX, tY, tW, tH);
      ctx.beginPath();
      ctx.moveTo(tX+tW/2,tY); ctx.lineTo(tX+tW/2,tY+tH);
      ctx.moveTo(tX,tY+tH/2); ctx.lineTo(tX+tW,tY+tH/2);
      ctx.stroke();
      const row = Math.floor((gy-offY+gH)/gH), col = Math.floor(gx/gW);
      if ((row*3+col)%5===0) {
        ctx.fillStyle = 'rgba(170,90,8,0.20)';
        ctx.beginPath(); ctx.arc(tX+tW/2, tY+tH/2, 6, 0, Math.PI*2); ctx.fill();
      }
    }
  }
  const vg = ctx.createRadialGradient(W/2,H/2,H*0.28,W/2,H/2,H*0.78);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.50)');
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
}

function drawBgGorge() {
  ctx.fillStyle = '#0c1218'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#181f25'; ctx.fillRect(0,0,80,H); ctx.fillRect(W-80,0,80,H);
  ctx.fillStyle = '#1a2e18';
  for (let i=0;i<6;i++) {
    ctx.fillRect(8,(i*120+state.bgOffset*0.8)%H,20+i*3,40);
    ctx.fillRect(W-36-i*3,((i+3)*110+state.bgOffset*0.8)%H,20+i*3,40);
  }
  const offY2 = state.bgOffset % 220;
  for (let i=0;i<4;i++) {
    const cx = 130+i*115;
    const cy = (-200+i*220+offY2)%(H+200)-100;
    ctx.strokeStyle='#2a3540'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(cx,cy-60); ctx.lineTo(cx,cy+60); ctx.stroke();
    for (let bl=0;bl<3;bl++) {
      const a = (state.bgOffset*0.05+bl*Math.PI*2/3)+i;
      ctx.strokeStyle='#30404c'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*42,cy+Math.sin(a)*42); ctx.stroke();
    }
  }
  for (let i=0;i<3;i++) {
    const fy = (i*260+state.bgOffset*0.4)%(H+100)-50;
    const fg = ctx.createLinearGradient(0,fy,0,fy+60);
    fg.addColorStop(0,'rgba(180,200,220,0)'); fg.addColorStop(0.5,'rgba(180,200,220,0.04)'); fg.addColorStop(1,'rgba(180,200,220,0)');
    ctx.fillStyle=fg; ctx.fillRect(0,fy,W,60);
  }
  const vg = ctx.createRadialGradient(W/2,H/2,H*0.28,W/2,H/2,H*0.78);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
}

function drawHazards() {
  state.hazards.forEach(hz => {
    if (!hz.alive) return;
    if (hz.type === 'glare_zone') {
      const g = ctx.createLinearGradient(0,hz.y,0,hz.y+hz.h);
      g.addColorStop(0,'rgba(255,200,50,0)'); g.addColorStop(0.5,'rgba(255,200,50,0.12)'); g.addColorStop(1,'rgba(255,200,50,0)');
      ctx.fillStyle=g; ctx.fillRect(hz.x,hz.y,hz.w,hz.h);
    } else if (hz.type === 'turbine_blade') {
      ctx.save(); ctx.translate(hz.x,hz.y); ctx.rotate(hz.angle);
      for (let i=0;i<3;i++) {
        const a = i*Math.PI*2/3;
        ctx.strokeStyle='rgba(80,120,150,0.75)'; ctx.lineWidth=7;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*hz.r,Math.sin(a)*hz.r); ctx.stroke();
      }
      ctx.strokeStyle='rgba(100,160,200,0.35)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(0,0,hz.r,0,Math.PI*2); ctx.stroke();
      ctx.restore();
    } else if (hz.type === 'updraft') {
      const alpha = Math.sin(hz.timer/hz.duration*Math.PI)*0.14;
      ctx.fillStyle=`rgba(100,180,255,${alpha})`; ctx.fillRect(hz.x-hz.w/2,0,hz.w,H);
      ctx.strokeStyle=`rgba(140,200,255,${alpha*2})`; ctx.lineWidth=1; ctx.setLineDash([4,8]);
      for (let i=0;i<3;i++) {
        const sy = H-(state.bgOffset*4+i*70)%H;
        ctx.beginPath(); ctx.moveTo(hz.x-12+i*12,sy); ctx.lineTo(hz.x-12+i*12,sy-25); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  });
  if (state.crosswindTimer > 0) {
    const alpha = (state.crosswindTimer/3.5)*0.06;
    ctx.fillStyle=`rgba(150,200,255,${alpha})`; ctx.fillRect(0,0,W,H);
  }
}

function drawBirds() {
  state.birds.forEach(bird => {
    if (!bird.alive) return;
    const sp       = SPECIES[bird.species];
    const isLeader = bird.formationSlot === 0;
    const inSlip   = (state.formation==='flying_v'||state.formation==='echelon') && !isLeader;

    // Slipstream trail
    if (inSlip) {
      ctx.strokeStyle='rgba(64,140,200,0.16)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(bird.x,bird.y+BIRD_R); ctx.lineTo(bird.x,bird.y+BIRD_R+16); ctx.stroke();
      if (bird.slipstreamHot > 0 && bird.hp < bird.maxHp) {
        const intensity = Math.min(1, bird.slipstreamHot/(sp.hp*0.004))*0.35;
        ctx.strokeStyle=`rgba(60,200,120,${intensity})`; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(bird.x,bird.y,BIRD_R+6,Math.PI*0.25,Math.PI*1.75); ctx.stroke();
      }
    }

    // Formation armor arc
    if (state.formation==='flying_v' && bird.formationSlot > 0) {
      const cohesion = state.birds.filter(x=>x.alive).length / state.birds.length;
      const base = bird.formationSlot>=5?0.18:bird.formationSlot>=3?0.12:0.06;
      const av   = base * cohesion;
      if (av > 0.03) {
        ctx.strokeStyle=`rgba(200,160,50,${Math.min(av*1.4,0.50)})`; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(bird.x,bird.y,BIRD_R+3,-Math.PI*0.4,Math.PI*0.4); ctx.stroke();
      }
    }

    // Subflock indicator
    if (bird.subflocked) {
      ctx.strokeStyle='rgba(255,200,50,0.55)'; ctx.lineWidth=1.5; ctx.setLineDash([3,4]);
      ctx.beginPath(); ctx.arc(bird.x,bird.y,BIRD_R+5,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Kamikaze red trail
    if (bird.meleeState === 'kamikaze' && bird.kamikazeTrail?.length) {
      bird.kamikazeTrail.forEach(p => {
        ctx.globalAlpha = (p.t / 0.4) * 0.6;
        ctx.fillStyle   = '#ff2020';
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // Red aura pulse on the bird itself
      ctx.fillStyle = 'rgba(255,32,32,0.35)';
      ctx.beginPath(); ctx.arc(bird.x, bird.y, BIRD_R + 8, 0, Math.PI * 2); ctx.fill();
    }

    // Melee state indicators
    if (sp.combatClass === 'melee') {
      if (bird.meleeState === 'charging') {
        // Honker charge trail: 3 ghost circles behind direction of travel
        for (let g = 1; g <= 3; g++) {
          const gx = bird.x - bird.chargeDir.x * g * 10;
          const gy = bird.y - bird.chargeDir.y * g * 10;
          ctx.globalAlpha = 0.28 / g;
          ctx.fillStyle = sp.color;
          ctx.beginPath(); ctx.arc(gx, gy, BIRD_R, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Charge direction indicator
        ctx.strokeStyle = `rgba(${hexToRgb(sp.color)},0.55)`; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bird.x, bird.y);
        ctx.lineTo(bird.chargeEndX, bird.chargeEndY);
        ctx.stroke();
      } else if (bird.meleeState === 'peeling' && bird.meleeTarget?.alive) {
        // Thin line from peeling bird to its target
        ctx.strokeStyle = `rgba(${hexToRgb(sp.color)},0.30)`; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(bird.x, bird.y);
        ctx.lineTo(bird.meleeTarget.x, bird.meleeTarget.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Attack flash
    if (bird.flashTimer > 0) {
      const a = (bird.flashTimer/0.12)*0.45;
      ctx.fillStyle=`rgba(160,230,80,${a})`; ctx.beginPath(); ctx.arc(bird.x,bird.y,BIRD_R+7,0,Math.PI*2); ctx.fill();
    }

    // Leader ring
    if (isLeader) {
      ctx.strokeStyle='#f0d070'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(bird.x,bird.y,BIRD_R+4,0,Math.PI*2); ctx.stroke();
    }

    // Camera follow indicator
    if (state.camera.followId === bird.id) {
      ctx.strokeStyle='rgba(200,200,255,0.55)'; ctx.lineWidth=1; ctx.setLineDash([2,3]);
      ctx.beginPath(); ctx.arc(bird.x,bird.y,BIRD_R+9,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Body — tinted bird sprite (falls back to colored circle if PNG not loaded)
    const sprite = birdSprites[bird.species];
    if (sprite) {
      const sz = BIRD_R * 2 + 6;
      ctx.drawImage(sprite, bird.x - sz / 2, bird.y - sz / 2, sz, sz);
    } else {
      const angle = (bird.meleeState === 'charging' && bird.chargeDir)
        ? Math.atan2(bird.chargeDir.y, bird.chargeDir.x) + Math.PI / 2
        : (bird.meleeState === 'peeling' && bird.meleeTarget?.alive)
          ? Math.atan2(bird.meleeTarget.y - bird.y, bird.meleeTarget.x - bird.x) + Math.PI / 2
          : 0;
      let drawX = bird.x, drawY = bird.y;
      if (bird.peckAnimTimer > 0 && bird.meleeTarget?.alive) {
        const t = bird.peckAnimTimer / 0.15;
        const lunge = t > 0.5 ? 2 * (1 - t) : 2 * t;
        const dx = bird.meleeTarget.x - bird.x, dy = bird.meleeTarget.y - bird.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        drawX += (dx / d) * lunge * 8;
        drawY += (dy / d) * lunge * 8;
      }
      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.rotate(angle);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.moveTo(0, -BIRD_R);
      ctx.lineTo(BIRD_R, BIRD_R * 0.6);
      ctx.lineTo(0, BIRD_R * 0.1);
      ctx.lineTo(-BIRD_R, BIRD_R * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }

    // HP bar
    const bW=24,bH=3,bx=bird.x-bW/2,by=bird.y+BIRD_R+4,hpF=bird.hp/bird.maxHp;
    ctx.fillStyle='#111a0a'; ctx.fillRect(bx,by,bW,bH);
    ctx.fillStyle=hpF>0.5?'#50cc40':hpF>0.25?'#d4860a':'#cc3030'; ctx.fillRect(bx,by,bW*hpF,bH);
  });
}

function drawPeckSparks() {
  (state.peckSparks || []).forEach(s => {
    const alpha = Math.max(0, s.life / 0.2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawProjHitSparks() {
  (state.projHitSparks || []).forEach(s => {
    const alpha = Math.max(0, s.life / 0.18);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawMuzzleFlashes() {
  (state.muzzleFlashes || []).forEach(m => {
    const t = m.timer / m.maxTimer;
    const alpha = t * 0.6;
    const cos = Math.cos(m.aimAngle), sin = Math.sin(m.aimAngle);
    ctx.fillStyle = m.color;
    for (let i = 0; i < 3; i++) {
      const dist = i * 4;
      const x = m.x + cos * dist, y = m.y + sin * dist;
      const r = 3 - i * 0.6;
      ctx.globalAlpha = alpha * (1 - i * 0.25);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function drawEnemies() {
  state.enemies.forEach(e => {
    if (!e.alive) return;
    if (e.debuffed) {
      ctx.fillStyle='rgba(80,160,200,0.18)'; ctx.beginPath(); ctx.arc(e.x,e.y,ENEMY_R+8,0,Math.PI*2); ctx.fill();
    }
    if (e.flashTimer > 0) {
      ctx.fillStyle=`rgba(255,255,255,${(e.flashTimer/0.1)*0.55})`; ctx.beginPath(); ctx.arc(e.x,e.y,ENEMY_R+7,0,Math.PI*2); ctx.fill();
    }

    if (e.type === 'turret') {
      const r=ENEMY_R;
      ctx.fillStyle='#4a1010'; ctx.fillRect(e.x-r,e.y-r,r*2,r*2);
      ctx.strokeStyle='#cc3030'; ctx.lineWidth=1.5; ctx.strokeRect(e.x-r,e.y-r,r*2,r*2);
      ctx.strokeStyle='#cc3030'; ctx.lineWidth=2.5; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(e.x,e.y); ctx.lineTo(e.x,e.y+r+10); ctx.stroke(); ctx.lineCap='butt';

    } else if (e.type === 'drone') {
      const r=ENEMY_R-2;
      ctx.fillStyle='#0d3535'; ctx.beginPath();
      ctx.moveTo(e.x,e.y-r); ctx.lineTo(e.x+r,e.y); ctx.lineTo(e.x,e.y+r); ctx.lineTo(e.x-r,e.y);
      ctx.closePath(); ctx.fill(); ctx.strokeStyle='#40c0b0'; ctx.lineWidth=1.5; ctx.stroke();

    } else if (e.type === 'sparrow') {
      const r=ENEMY_R;
      ctx.fillStyle='#3a1808'; ctx.beginPath();
      ctx.moveTo(e.x,e.y+r); ctx.lineTo(e.x-r,e.y-r*0.7); ctx.lineTo(e.x+r,e.y-r*0.7);
      ctx.closePath(); ctx.fill(); ctx.strokeStyle='#e07030'; ctx.lineWidth=1.5; ctx.stroke();

    } else if (e.type === 'flak') {
      ctx.fillStyle='#2a2015';
      ctx.beginPath(); ctx.ellipse(e.x,e.y-5,14,18,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#c0a030'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle='#1a1510'; ctx.fillRect(e.x-7,e.y+10,14,6);
      if (e.state==='charging'&&e.chargeRadius>0) {
        ctx.strokeStyle=`rgba(220,80,30,${0.25+e.chargeRadius/500})`; ctx.lineWidth=2; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.arc(e.x,e.y,e.chargeRadius,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      }

    } else if (e.type === 'sniper') {
      const r=ENEMY_R;
      ctx.fillStyle='#151520'; ctx.fillRect(e.x-r*0.6,e.y-r*1.5,r*1.2,r*3.0);
      ctx.strokeStyle='#308050'; ctx.lineWidth=1.5; ctx.strokeRect(e.x-r*0.6,e.y-r*1.5,r*1.2,r*3.0);
      if (e.state==='charging'&&e.targetBirdId) {
        const target = state.birds.find(b=>b.id===e.targetBirdId&&b.alive);
        if (target) {
          ctx.strokeStyle=`rgba(100,255,100,${0.3+e.chargeTimer*0.15})`; ctx.lineWidth=1; ctx.setLineDash([3,6]);
          ctx.beginPath(); ctx.moveTo(e.x,e.y); ctx.lineTo(target.x,target.y); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle='rgba(100,255,100,0.7)'; ctx.beginPath(); ctx.arc(target.x,target.y,4,0,Math.PI*2); ctx.fill();
        }
      }
    }

    // State badge
    if (e.state && e.state!=='idle'&&e.state!=='cooldown') {
      const colors={charging:'#e05020',exposed:'#20a060',shielded:'#2060e0',spawning_adds:'#c0a020'};
      ctx.fillStyle=colors[e.state]||'#808080'; ctx.fillRect(e.x+8,e.y-ENEMY_R-14,8,8);
    }

    // HP bar
    const bW=22,bH=2,bx=e.x-bW/2,by=e.y-ENEMY_R-7,hpF=e.hp/e.maxHp;
    ctx.fillStyle='#1a0a0a'; ctx.fillRect(bx,by,bW,bH);
    ctx.fillStyle='#cc3030'; ctx.fillRect(bx,by,bW*hpF,bH);
  });
}

const MINI_BOSS_R = 20;

function drawMiniBoss() {
  const mb = state.miniBoss;
  if (!mb?.alive) return;
  if (mb.sweepMeleeCharging && mb.sweepMeleeRadius > 0) {
    ctx.strokeStyle = `rgba(255,180,60,${0.2 + mb.sweepMeleeRadius / 400})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(mb.x, mb.y, mb.sweepMeleeRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (mb.flashTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(mb.flashTimer / 0.1) * 0.5})`;
    ctx.beginPath();
    ctx.arc(mb.x, mb.y, MINI_BOSS_R + 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = mb.color;
  ctx.beginPath();
  ctx.arc(mb.x, mb.y, MINI_BOSS_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(mb.name, mb.x, mb.y - MINI_BOSS_R - 6);
}

function drawMiniBossBar() {
  const mb = state.miniBoss;
  if (!mb?.alive) return;
  const barW = 120;
  const barH = 6;
  const x = W / 2 - barW / 2;
  const y = H - 52;
  ctx.fillStyle = '#1a0a0a';
  ctx.fillRect(x, y, barW, barH);
  const pct = mb.hp / mb.maxHp;
  ctx.fillStyle = mb.color;
  ctx.fillRect(x, y, barW * pct, barH);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, barW, barH);
  ctx.fillStyle = '#ddd';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(mb.name, W / 2, y - 4);
}

function drawBoss() {
  if (!state.boss?.alive) return;
  const boss = state.boss;

  // Aura
  ctx.fillStyle=`rgba(${hexToRgb(boss.color)},0.08)`;
  ctx.beginPath(); ctx.arc(boss.x,boss.y,42+Math.sin(state.runTime*3)*5,0,Math.PI*2); ctx.fill();

  // Phase effects
  if (boss.type==='c'&&boss.state==='shielded') {
    ctx.strokeStyle='rgba(64,80,170,0.75)'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.arc(boss.x,boss.y,38,0,Math.PI*2); ctx.stroke();
  }
  if (boss.state==='exposed') {
    ctx.fillStyle='rgba(60,200,100,0.18)'; ctx.beginPath(); ctx.arc(boss.x,boss.y,40,0,Math.PI*2); ctx.fill();
  }

  // Boss A sweep
  if (boss.type==='a'&&boss.state==='charging'&&boss.sweepRadius>0) {
    ctx.strokeStyle=`rgba(200,60,30,${0.18+boss.sweepRadius/600})`; ctx.lineWidth=3; ctx.setLineDash([6,6]);
    ctx.beginPath(); ctx.arc(boss.x,boss.y,boss.sweepRadius,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
  }
  // Anti-melee sweep charge-up ring (yellow/orange)
  if (boss.sweepMeleeCharging && boss.sweepMeleeRadius > 0) {
    ctx.strokeStyle = `rgba(255,180,60,${0.25 + boss.sweepMeleeRadius / 400})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.sweepMeleeRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Boss D laser
  if (boss.type==='d'&&boss.state==='charging'&&boss.laserTargetId) {
    const target = state.birds.find(b=>b.id===boss.laserTargetId&&b.alive);
    if (target) {
      const progress = 1 - boss.chargeTimer/1.8;
      ctx.strokeStyle=`rgba(80,255,120,${progress*0.65})`; ctx.lineWidth=2; ctx.setLineDash([5,8]);
      ctx.beginPath(); ctx.moveTo(boss.x,boss.y); ctx.lineTo(target.x,target.y); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  // Flash
  if (boss.flashTimer>0) {
    ctx.fillStyle=`rgba(255,255,255,${(boss.flashTimer/0.1)*0.6})`; ctx.beginPath(); ctx.arc(boss.x,boss.y,38,0,Math.PI*2); ctx.fill();
  }

  // Body
  ctx.fillStyle=boss.color; ctx.beginPath(); ctx.arc(boss.x,boss.y,30,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='#ffffff'; ctx.font='bold 8px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(boss.name.substring(0,14),boss.x,boss.y);
}

function drawBossBar() {
  const boss = state.boss;
  const barW = W - 40, barH = 12, bx = 20, by = H - 30;
  const hpF  = Math.max(0, boss.hp / boss.maxHp);
  ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(bx-2,by-18,barW+4,barH+22);
  ctx.fillStyle='#0a0a0a'; ctx.fillRect(bx,by,barW,barH);
  const barColor = boss.state==='shielded'?'#4060cc': boss.state==='exposed'?'#30c060': boss.color;
  ctx.fillStyle=barColor; ctx.fillRect(bx,by,barW*hpF,barH);
  ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.strokeRect(bx,by,barW,barH);
  ctx.fillStyle='#e8e0b0'; ctx.font='bold 9px Courier New'; ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText(boss.name+' — '+boss.state.toUpperCase().replace('_',' '),bx+4,by-9);
}

function drawProjectiles() {
  state.projectiles.forEach(p => {
    if (!p.alive) return;
    const r = p.r ?? (p.rangedType === 'rapid'  ? 2
            : p.rangedType === 'sniper' ? 5
            : PROJ_R);

    // Sniper trail (drawn from trail array updated in updateProjectiles)
    if (p.rangedType === 'sniper' && p.trail && p.trail.length) {
      p.trail.forEach((pt, i) => {
        const a = (i / p.trail.length) * 0.35;
        ctx.fillStyle = `rgba(192,232,255,${a})`;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r * 0.6, 0, Math.PI * 2); ctx.fill();
      });
    }

    // Rapid / default short trail
    if ((p.rangedType === 'rapid' || p.rangedType === null) && p.trail && p.trail.length) {
      const len = p.trail.length;
      const rgb = hexToRgb(p.color || '#a0e060');
      p.trail.forEach((pt, i) => {
        const a = (i / len) * 0.28;
        ctx.fillStyle = `rgba(${rgb},${a})`;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r * 0.5, 0, Math.PI * 2); ctx.fill();
      });
    }

    const blur = p.rangedType === 'sniper' ? 10
      : p.owner === 'bird' && p.rangedType === 'rapid' ? 4
      : p.owner === 'bird' && (p.rangedType === null || p.rangedType === 'triple') ? 6
      : p.rangedType === 'rapid' ? 3 : 5;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = blur;
    ctx.fillStyle   = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur  = 0;
  });
}

function drawFloatTexts() {
  state.floatTexts.forEach(ft => {
    const alpha = Math.min(1, ft.timer / (ft.maxTimer * 0.4)) * Math.min(1, ft.timer / ft.maxTimer * 3);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur  = ft.fontSize > 11 ? 12 : 6;
    ctx.fillStyle   = ft.color;
    ctx.font        = `bold ${ft.fontSize || 11}px Courier New`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });
}

function drawReorgOverlay() {
  ctx.fillStyle='rgba(64,130,200,0.06)'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(64,140,210,0.65)'; ctx.font='11px Courier New';
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('REFORMING...',W/2,50);
}

// ════════════════════════════════════════════════
// HUD UPDATES
// ════════════════════════════════════════════════

function updateHUD() {
  const scoreEl = document.getElementById('hud-score');
  if (scoreEl) scoreEl.textContent='SCORE: '+Math.round(state.score).toString().padStart(6,'0');

  const timerEl = document.getElementById('hud-timer');
  if (timerEl) {
    if (state.bossKilled) {
      timerEl.textContent = '✓ BOSS';
    } else if (state.bossTriggered) {
      timerEl.textContent = 'BOSS FIGHT';
    } else {
      const rem  = Math.max(0, BOSS_TRIGGER - state.runTime);
      const mins = Math.floor(rem/60);
      const secs = Math.floor(rem%60).toString().padStart(2,'0');
      timerEl.textContent = `${mins}:${secs}`;
    }
  }

  const alive  = state.birds.filter(b=>b.alive);
  const totHp  = alive.reduce((s,b)=>s+b.hp,0);
  const maxHp  = state.birds.reduce((s,b)=>s+b.maxHp,0);
  const hpPct  = maxHp>0?totHp/maxHp:0;

  const bar = document.getElementById('hud-hp-bar');
  if (bar) {
    bar.style.width=(hpPct*100).toFixed(1)+'%';
    bar.className='hud-bar hp-bar'+(hpPct<0.25?' critical':hpPct<0.5?' low':'');
  }

  const mbar = document.getElementById('hud-morale-bar');
  if (mbar) {
    mbar.style.width=state.morale+'%';
    mbar.className='hud-bar morale-bar'+(state.morale<30?' critical':state.morale<50?' low':'');
  }

  const mtext = document.getElementById('hud-morale-text');
  if (mtext) {
    mtext.textContent='MORALE '+Math.round(state.morale);
    mtext.style.color = state.moraleCollapse ? '#cc4040' : state.morale<50 ? '#d4860a' : '';
  }

  const bcEl = document.getElementById('hud-bird-count');
  if (bcEl) bcEl.textContent=`${alive.length}/${state.birds.length} BIRDS`;

  const stEl = document.getElementById('hud-stance');
  if (stEl) {
    stEl.textContent=state.stance.toUpperCase();
    stEl.style.color=state.stance==='aggressive'?'#e06030':state.stance==='evasive'?'#40c0a0':state.stance==='rally'?'#c0a020':'#607040';
  }

  const killsEl = document.getElementById('hud-kills');
  if (killsEl) killsEl.textContent=`${state.kills} KILLS`;

  const formEl = document.getElementById('hud-formation');
  if (formEl) formEl.textContent=FORMATION_LABELS[state.formation]||state.formation.toUpperCase();

  state.cardFlash.forEach((f,i)=>{
    const el=document.getElementById(`card-ind-${i}`);
    if (el) el.classList.toggle('triggered',f>0);
  });
}

// ════════════════════════════════════════════════
// GLOSSARY
// ════════════════════════════════════════════════

const GLOSSARY_TRAITS = [
  {
    name: 'Enduring',
    type: 'positive',
    effect: 'Stamina drain ×0.70 (−30%) at all times.',
    detail: 'Applied every update tick regardless of stance or position.',
  },
  {
    name: 'Steady Wing',
    type: 'positive',
    effect: 'Stamina drain ×0.75 (−25%) when occupying the Leader slot.',
    detail: 'Stacks with Enduring. Only active while this bird holds slot 0.',
  },
  {
    name: 'Vengeful',
    type: 'positive',
    effect: 'Damage ×1.20 (+20%) once any ally has died this run.',
    detail: 'Triggers permanently after the first death. Applies to charge, melee peel, and ranged attacks.',
  },
  {
    name: 'Reckless',
    type: 'positive',
    effect: 'Damage ×1.10 (+10%) at all times.',
    detail: 'Flat multiplier applied to every attack regardless of target or stance.',
  },
  {
    name: 'Protective',
    type: 'positive',
    effect: 'Allies within 60px take ×0.85 incoming damage (−15%) while this bird is alive.',
    detail: 'Does not protect other Protective birds. Area checked per hit event.',
  },
  {
    name: 'Cautious',
    type: 'negative',
    effect: 'Damage ×0.85 (−15%) while the flock is in Aggressive stance.',
    detail: 'Has no effect in Normal or Evasive stance. Applies to all attack types.',
  },
  {
    name: 'Hates the Front',
    type: 'negative',
    effect: 'When in the Leader slot: stamina drain ×1.20 (+20%) and morale −0.4 per second.',
    detail: 'Both penalties are continuous. Reassigning to a non-leader slot removes both effects.',
  },
  {
    name: 'Hates Drones',
    type: 'negative',
    effect: 'Damage ×1.30 (+30%) vs drones. Morale −0.3 per second while within 90px of any drone.',
    detail: 'The morale drain stacks per bird with this trait near each drone. The damage bonus applies in both melee and ranged attacks.',
  },
  {
    name: 'Clueless',
    type: 'negative',
    effect: 'After every attack, atkCooldown += random(0, 0.6s).',
    detail: 'Exclusive to the Clueless Borb. They fight, but erratically. They never learn.',
  },
];

function buildGlossaryTab() {
  const container = document.getElementById('glossary-traits');
  if (!container) return;
  container.innerHTML = '';
  GLOSSARY_TRAITS.forEach(entry => {
    const isPos = entry.type === 'positive';
    const badgeColor  = isPos ? '#40c0a0' : '#e06030';
    const borderColor = isPos ? '#40c0a055' : '#e0603055';
    const row = document.createElement('div');
    row.style.cssText = `display:flex;flex-direction:column;gap:4px;padding:10px 12px;border:1px solid ${borderColor};border-radius:6px;margin-bottom:8px;`;
    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:11px;font-family:'Courier New',monospace;font-weight:700;color:#e8dfc8;letter-spacing:0.08em;">${entry.name}</span>
        <span style="font-size:9px;font-family:'Courier New',monospace;color:${badgeColor};border:1px solid ${borderColor};padding:1px 5px;border-radius:3px;letter-spacing:0.05em;">${isPos ? 'POSITIVE' : 'NEGATIVE'}</span>
      </div>
      <div style="font-size:11px;font-family:'Courier New',monospace;color:#c8bfa8;">${entry.effect}</div>
      <div style="font-size:10px;font-family:'Courier New',monospace;color:#8a7f6a;font-style:italic;">${entry.detail}</div>
    `;
    container.appendChild(row);
  });
}

// ════════════════════════════════════════════════
// HUB UI
// ════════════════════════════════════════════════

let _listenersInit = false;

function buildHubUI() {
  buildCurrencyDisplay();
  buildRosterList();
  buildFormationTab();
  buildCallCardSlots();
  buildNestTab();
  buildHallTab();
  buildGlossaryTab();

  if (!_listenersInit) {
    _listenersInit = true;

    document.querySelectorAll('.hub-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.hub-tab').forEach(b=>b.classList.remove('active'));
        document.querySelectorAll('.hub-tab-panel').forEach(p=>p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-'+btn.dataset.tab)?.classList.add('active');
        // Rebuild dynamic tabs when switching to them
        if (btn.dataset.tab === 'nest') buildNestTab();
        if (btn.dataset.tab === 'hall') buildHallTab();
        if (btn.dataset.tab === 'glossary') buildGlossaryTab();
      });
    });

    document.getElementById('launch-btn')?.addEventListener('click', ()=>showScreen('level-select'));
    document.getElementById('howto-btn')?.addEventListener('click', openHowto);
    document.getElementById('howto-close-btn')?.addEventListener('click', closeHowto);
    document.getElementById('retry-btn')?.addEventListener('click', retryRun);
    document.getElementById('hub-btn')?.addEventListener('click', ()=>{ persistCallCardsToProfile(); showScreen('hub'); buildHubUI(); });
    document.getElementById('back-to-hub-btn')?.addEventListener('click', ()=>showScreen('hub'));
    document.getElementById('confirm-launch-btn')?.addEventListener('click', startRun);
    document.getElementById('refresh-pool-btn')?.addEventListener('click', ()=>refreshNestPool(false));

    document.getElementById('abandon-btn')?.addEventListener('click', () =>
      document.getElementById('abandon-modal')?.classList.remove('hidden'));
    document.getElementById('abandon-cancel-btn')?.addEventListener('click', () =>
      document.getElementById('abandon-modal')?.classList.add('hidden'));
    document.getElementById('abandon-confirm-btn')?.addEventListener('click', abandonTerritory);
  }
}

function openHowto() {
  document.getElementById('howto-overlay')?.classList.remove('hidden');
}
function closeHowto() {
  document.getElementById('howto-overlay')?.classList.add('hidden');
}

function buildCurrencyDisplay() {
  const xp  = document.getElementById('cur-xp');
  const sc  = document.getElementById('cur-seed');
  const pl  = document.getElementById('cur-plumes');
  if (xp) xp.textContent  = profile.commanderXp;
  if (sc) sc.textContent  = profile.seed;
  if (pl) pl.textContent  = profile.plumes;
}

function buildRosterList() {
  const container = document.getElementById('roster-list');
  if (!container) return;
  container.innerHTML = '';
  const rc = document.getElementById('roster-count');
  if (rc) rc.textContent = profile.activeRoster.length+' BIRDS';

  profile.activeRoster.forEach(id => {
    const bird = profile.roster.find(b=>b.id===id);
    if (!bird) return;
    const sp  = SPECIES[bird.species];
    const card= document.createElement('div');
    card.className='bird-card';
    const traitsStr = bird.traits.length?' · '+bird.traits.join(', '):'';
    const combatLabel = sp.combatClass === 'melee'
      ? (bird.species === 'angry_honker' ? 'CHARGE' : 'MELEE')
      : sp.rangedType === 'rapid'  ? 'RAPID'
      : sp.rangedType === 'sniper' ? 'SNIPER'
      : sp.rangedType === 'triple' ? 'TRIPLE'
      : 'RANGED';
    const combatColor = sp.combatClass === 'melee' ? '#e06030' : '#40c0a0';
    const sellValue = Math.floor((bird.cost || 0) * 0.8);
    const canSell   = profile.roster.length > 1;
    card.innerHTML=`
      <div class="bird-badge" style="background:${sp.color}20; border-color:${sp.color}55;"><span style="color:${sp.color};">${BIRD_ICON}</span></div>
      <div class="bird-info">
        <div class="bird-name">${bird.name}</div>
        <div class="bird-species">${sp.label}${traitsStr}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <span class="bird-role" style="color:${sp.color}; border-color:${sp.color}55;">${sp.role}</span>
        <span style="font-size:9px;font-family:'Courier New',monospace;color:${combatColor};border:1px solid ${combatColor}55;padding:1px 5px;border-radius:3px;letter-spacing:0.05em;">${combatLabel}</span>
      </div>
      <div class="bird-stats"><span>HP ${sp.hp}</span><span>DMG ${sp.dmg}</span></div>
      <button class="release-bird-btn${canSell?'':' disabled'}" data-id="${bird.id}" title="${canSell?'Release for '+sellValue+' SEED':'Cannot release last bird'}" style="font-size:9px;font-family:'Courier New',monospace;background:transparent;border:1px solid #a0603055;color:#a06030;padding:2px 6px;border-radius:3px;cursor:${canSell?'pointer':'not-allowed'};letter-spacing:0.05em;white-space:nowrap;">RELEASE ${sellValue}</button>
    `;
    if (canSell) {
      card.querySelector('.release-bird-btn')?.addEventListener('click', () => releaseBird(bird.id));
    }
    container.appendChild(card);
  });

  // ── Permanent Borb info card (always shown at the bottom) ──
  const sp = SPECIES['clueless_borb'];
  const borbCard = document.createElement('div');
  borbCard.className = 'bird-card borb-card';
  borbCard.innerHTML = `
    <div class="bird-badge" style="background:${sp.color}18; border-color:${sp.color}44;"><span style="color:${sp.color};opacity:0.65;">${BIRD_ICON}</span></div>
    <div class="bird-info">
      <div class="bird-name" style="color:${sp.color};">Clueless Borb</div>
      <div class="bird-species" style="color:${sp.color};opacity:0.65;">Filler · Trait: Clueless · HP ${sp.hp} · DMG ${sp.dmg}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
      <span class="bird-role" style="color:${sp.color};border-color:${sp.color}44;opacity:0.65;">${sp.role}</span>
      <span style="font-size:9px;font-family:'Courier New',monospace;color:${sp.color};opacity:0.45;border:1px solid ${sp.color}44;padding:1px 5px;border-radius:3px;letter-spacing:0.05em;">RAPID</span>
    </div>
    <div class="bird-stats" style="opacity:0.5;font-style:italic;">ALWAYS AVAILABLE</div>
  `;
  container.appendChild(borbCard);
}

// ── Formation tab ──
function buildFormationTab() {
  document.querySelectorAll('.formation-btn').forEach(btn => {
    btn.onclick = () => {
      const f = btn.dataset.formation;
      if (!isFormationUnlocked(f)) return;
      document.querySelectorAll('.formation-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      profile.selectedFormation = f;
      document.getElementById('formation-desc').textContent = FORMATION_DESCS[f]||'';
      buildPositionEditor(f);
      saveProfile();
    };
    const unlocked = isFormationUnlocked(btn.dataset.formation);
    btn.classList.toggle('locked', !unlocked);
    if (!unlocked) btn.title = getFormationUnlockMsg(btn.dataset.formation);
  });
  // Set active
  document.querySelectorAll('.formation-btn').forEach(b=>b.classList.remove('active'));
  const cur = document.querySelector(`.formation-btn[data-formation="${profile.selectedFormation}"]`);
  if (cur && isFormationUnlocked(profile.selectedFormation)) cur.classList.add('active');
  document.getElementById('formation-desc').textContent = FORMATION_DESCS[profile.selectedFormation]||'';
  buildPositionEditor(profile.selectedFormation);
}

function isFormationUnlocked(f) {
  const xp = profile.commanderXp;
  return f==='flying_v'||f==='loose_swarm'?true
       : f==='spread_line'  ?xp>=UNLOCK.SPREAD_LINE
       : f==='tight_cluster'?xp>=UNLOCK.TIGHT_CLUSTER
       : f==='echelon'      ?xp>=UNLOCK.ECHELON
       : true;
}

function getFormationUnlockMsg(f) {
  return f==='spread_line'  ?`Unlocks at ${UNLOCK.SPREAD_LINE} XP`
       : f==='tight_cluster'?`Unlocks at ${UNLOCK.TIGHT_CLUSTER} XP`
       : f==='echelon'      ?`Unlocks at ${UNLOCK.ECHELON} XP` : '';
}

function buildPositionEditor(formation) {
  const container = document.getElementById('position-editor');
  if (!container) return;
  container.innerHTML = '';
  const slotNames = FORMATION_SLOT_NAMES[formation] || [];

  // Snapshot current assignments for all slots up front
  const assignments = slotNames.map((_, i) => {
    const key = `${formation}_${i}`;
    return profile.positionAssignments[key] || profile.activeRoster[i] || '';
  });

  // ── Fill with Borbs button ──
  const borbSp      = SPECIES['clueless_borb'];
  const fillBtn     = document.createElement('button');
  fillBtn.className = 'add-borb-btn';
  fillBtn.title     = 'Auto-assign a Clueless Borb to every unassigned position slot.';
  fillBtn.innerHTML = `<span style="color:${borbSp.color};margin-right:6px;">${BIRD_ICON}</span> FILL EMPTY SLOTS WITH BORBS`;
  fillBtn.addEventListener('click', () => {
    slotNames.forEach((_, i) => {
      const key = `${formation}_${i}`;
      // Use the assignments snapshot — respects both explicit saves and activeRoster defaults
      if (!assignments[i]) {
        profile.positionAssignments[key] = 'borb';
      }
    });
    saveProfile();
    buildPositionEditor(formation);
  });
  container.appendChild(fillBtn);

  slotNames.forEach((name, i) => {
    const key     = `${formation}_${i}`;
    const current = assignments[i];

    // Real birds: only show birds not already assigned to another slot
    const birdOpts = profile.activeRoster.map(id => {
      const bird = profile.roster.find(b => b.id === id);
      if (!bird) return '';
      if (id !== current && assignments.some((a, j) => j !== i && a === id)) return '';
      const sp  = SPECIES[bird.species];
      const sel = id === current ? ' selected' : '';
      return `<option value="${id}"${sel}>${bird.name} (${sp.label})</option>`;
    }).join('');

    // Borb option: selectable in every slot, no uniqueness restriction
    const borbSel = current === 'borb' ? ' selected' : '';

    const row = document.createElement('div');
    row.className = 'position-row';
    row.innerHTML = `
      <span class="position-label">${name}</span>
      <select class="position-select" data-key="${key}">
        <option value="">— unassigned —</option>
        <option value="borb"${borbSel} style="color:${borbSp.color};">Borb (Clueless · free)</option>
        ${birdOpts}
      </select>
    `;
    row.querySelector('select').addEventListener('change', ev => {
      profile.positionAssignments[ev.target.dataset.key] = ev.target.value;
      saveProfile();
      buildPositionEditor(formation);
    });
    container.appendChild(row);
  });
}

// ── Call cards ──
const COND_LABELS = {
  none:'— condition —',
  flock_hp_70:'flock HP < 70%', flock_hp_50:'flock HP < 50%', flock_hp_30:'flock HP < 30%',
  enemy_drone:'drone sighted', enemy_sparrow:'rival sparrow sighted', enemy_turret:'turret sighted',
  enemy_flak:'flak balloon sighted', enemy_sniper:'sniper sighted',
  birds_6:'birds remaining < 6', birds_4:'birds remaining < 4',
  stamina_50:'avg stamina < 50%', stamina_30:'avg stamina < 30%',
  enemy_count_3:'3+ enemies on screen', enemy_count_5:'5+ enemies on screen',
  incoming_aoe:'incoming AoE detected', anchor_dead:'anchor dead',
  boss_exposed:'boss exposed', boss_active:'boss active',
  formation_v:'formation = Flying V', formation_swarm:'formation = Loose Swarm',
  morale_30:'morale < 30%', morale_50:'morale < 50%',
  always:'always',
};

const ACT_LABELS = {
  none:'— action —',
  flying_v:'→ switch to Flying V', loose_swarm:'→ switch to Loose Swarm',
  spread_line:'→ switch to Spread Line', tight_cluster:'→ switch to Tight Cluster', echelon:'→ switch to Echelon',
  aggressive:'→ aggressive stance', evasive:'→ evasive stance',
  rally:'→ rally stance (morale recovery)', normal_stance:'→ normal stance',
  focus_fire:'→ focus fire nearest', rotate_leader:'→ rotate leader',
  detach_subflock:'→ detach sub-flock (2 birds)',
  priority_strikers:'→ priority: rival sparrows',
  priority_role_screen:'→ priority: drones',
  trigger_screech:'→ trigger WOB screech debuff',
  retreat_to_rear:'→ retreat leader to rear',
  surge_forward:'→ surge healthiest to front',
  all_dive_attack:'→ all birds dive attack',
};

const SUBSET_LABELS = {
  none:'— subset —', all:'all birds', strikers:'strikers',
  screens:'screens', anchors:'anchors', specialists:'specialists', hp_below_30:'birds below 30% HP',
};

const COND_SHORT = {
  none:'OFF', flock_hp_70:'HP<70', flock_hp_50:'HP<50', flock_hp_30:'HP<30',
  enemy_drone:'DRONE', enemy_sparrow:'SPARROW', enemy_turret:'TURRET',
  enemy_flak:'FLAK', enemy_sniper:'SNIPER', birds_6:'BIRDS<6', birds_4:'BIRDS<4',
  stamina_50:'ST<50', stamina_30:'ST<30', enemy_count_3:'ENM≥3', enemy_count_5:'ENM≥5',
  incoming_aoe:'AOE!', anchor_dead:'ANC↓', boss_exposed:'BOSS!', boss_active:'BOSS',
  formation_v:'V', formation_swarm:'SWM', morale_30:'MOR<30', morale_50:'MOR<50', always:'ALW',
};

const ACT_SHORT = {
  none:'--', flying_v:'→V', loose_swarm:'→SWM', spread_line:'→LN',
  tight_cluster:'→CL', echelon:'→ECH', aggressive:'→AGG', evasive:'→EVA',
  rally:'→RLY', normal_stance:'→NRM', focus_fire:'→FOCUS', rotate_leader:'→ROT',
  detach_subflock:'→DETACH', priority_strikers:'→PRI-S', priority_role_screen:'→PRI-D',
  trigger_screech:'→SCRCH', retreat_to_rear:'→REAR', surge_forward:'→SRG', all_dive_attack:'→DIVE',
};

const VALID_COND_KEYS = Object.keys(COND_LABELS);
const VALID_ACT_KEYS = Object.keys(ACT_LABELS);
const VALID_SUBSET_KEYS = Object.keys(SUBSET_LABELS);

function buildCallCardSlots() {
  const container = document.getElementById('call-card-slots');
  if (!container) return;
  const t2   = profile.commanderXp >= UNLOCK.TIER2_CARDS;
  const t3   = profile.commanderXp >= UNLOCK.TIER3_CARDS;
  const slots = getCardSlotCount();

  const slotCountEl = document.getElementById('card-slot-count');
  if (slotCountEl) slotCountEl.textContent=`${slots} SLOTS — PRIORITY ORDER`;

  const notice = document.getElementById('card-tier-notice');
  if (notice) {
    const msgs=[];
    if (!t2) msgs.push(`Tier 2 (AND/OR) unlocks at ${UNLOCK.TIER2_CARDS} XP`);
    if (!t3) msgs.push(`Tier 3 (FOR EACH/WHILE) unlocks at ${UNLOCK.TIER3_CARDS} XP`);
    if (profile.commanderXp < UNLOCK.CARD_SLOT_4) msgs.push(`4th slot unlocks at ${UNLOCK.CARD_SLOT_4} XP`);
    notice.textContent = msgs.join('  ·  ');
  }

  const defaults=[
    {cond:'flock_hp_50',condOp:'and',cond2:'none',act:'loose_swarm',   subset:'none',type:'if_then'},
    {cond:'enemy_drone',condOp:'and',cond2:'none',act:'aggressive',    subset:'none',type:'if_then'},
    {cond:'birds_4',    condOp:'and',cond2:'none',act:'evasive',       subset:'none',type:'if_then'},
    {cond:'always',     condOp:'and',cond2:'none',act:'surge_forward', subset:'none',type:'if_then'},
  ];

  container.innerHTML='';
  for (let i=0;i<slots;i++) {
    const saved = profile.callCards?.[i];
    const baseDef = defaults[i]||defaults[3];
    const cond   = (saved && VALID_COND_KEYS.includes(saved.condition)) ? saved.condition : baseDef.cond;
    const action = (saved && VALID_ACT_KEYS.includes(saved.action))       ? saved.action   : baseDef.act;
    const condOp = (t2 && saved && (saved.condOp==='and'||saved.condOp==='or')) ? saved.condOp : 'and';
    const cond2  = (t2 && saved && VALID_COND_KEYS.includes(saved.condition2))  ? saved.condition2 : 'none';
    const type   = (t3 && saved && ['if_then','for_each','while'].includes(saved.type)) ? saved.type : 'if_then';
    const subset = (t3 && saved && VALID_SUBSET_KEYS.includes(saved.subset))    ? saved.subset : 'none';

    const div=document.createElement('div'); div.className='call-card';

    const condOpts   = buildSelectOptions(COND_LABELS,   cond);
    const cond2Opts  = buildSelectOptions(COND_LABELS,   cond2);
    const actOpts    = buildSelectOptions(ACT_LABELS,    action);
    const subsetOpts = buildSelectOptions(SUBSET_LABELS, subset);

    const typeRow    = t3?`<select class="card-type-select" id="card-type-${i}"><option value="if_then"${type==='if_then'?' selected':''}>IF / THEN</option><option value="for_each"${type==='for_each'?' selected':''}>FOR EACH</option><option value="while"${type==='while'?' selected':''}>WHILE / DO</option></select>`:'';
    const subsetRow  = t3?`<div class="card-row-subset" id="card-subset-row-${i}" style="display:${type==='for_each'?'flex':'none'};"><span class="card-keyword">EACH</span><select class="card-select" id="card-subset-${i}">${subsetOpts}</select></div>`:'';
    const t2Row      = t2?`<div class="card-row-t2"><select class="card-select card-op-select" id="card-condop-${i}"><option value="and"${condOp==='and'?' selected':''}>AND</option><option value="or"${condOp==='or'?' selected':''}>OR</option></select><select class="card-select" id="card-cond2-${i}">${cond2Opts}</select></div>`:'';

    div.innerHTML=`
      <div style="display:flex;align-items:center;gap:6px;">${'<div class="card-slot-num">'+(i+1)+'</div>'}${typeRow}</div>
      ${subsetRow}
      <div class="card-row-main">
        <span class="card-keyword" id="card-kw-${i}">${type==='while'?'WHILE':'IF'}</span>
        <select class="card-select" id="card-cond-${i}">${condOpts}</select>
        ${t2Row}
        <span class="card-keyword">THEN</span>
        <select class="card-select" id="card-act-${i}">${actOpts}</select>
      </div>
    `;
    container.appendChild(div);

    if (t3) {
      document.getElementById(`card-type-${i}`)?.addEventListener('change', ev=>{
        const subRow = document.getElementById(`card-subset-row-${i}`);
        const kw     = document.getElementById(`card-kw-${i}`);
        if (subRow) subRow.style.display = ev.target.value==='for_each'?'flex':'none';
        if (kw)     kw.textContent       = ev.target.value==='while'?'WHILE':'IF';
      });
    }
  }

  if (!buildCallCardSlots._persistBound) {
    buildCallCardSlots._persistBound = true;
    container.addEventListener('change', persistCallCardsFromDOM);
  }
}

function buildSelectOptions(labels, selected) {
  return Object.entries(labels).map(([v,l])=>`<option value="${v}"${v===selected?' selected':''}>${l}</option>`).join('');
}

function updateCardIndicators() {
  state.callCards.forEach((card,i)=>{
    const el=document.getElementById(`card-ind-${i}`);
    if (!el) return;
    const c=COND_SHORT[card.condition]||'?';
    const a=ACT_SHORT[card.action]||'?';
    let label;
    if (card.type==='for_each') {
      label=`EA[${(SUBSET_LABELS[card.subset]||'?').slice(0,4)}] ${c} ${a}`;
    } else if (card.tier===2 && card.condition2 && card.condition2!=='none') {
      label=`${c} ${card.condOp.toUpperCase()} ${COND_SHORT[card.condition2]||'?'} ${a}`;
    } else {
      label=`${c} ${a}`;
    }
    el.querySelector('.card-ind-label').textContent=label;
    if (i===3) el.style.display=getCardSlotCount()>=4?'flex':'none';
  });
}

// ════════════════════════════════════════════════
// NEST / RECRUITMENT
// ════════════════════════════════════════════════

const DEBUG_RECRUIT_VARIANCE = false; // Set true to log hidden variance on recruit (dev only)

const BIRD_NAMES=['Pip','Beak','Claw','Wing','Talon','Gust','Storm','Ember','Sage','Echo','Flint','Haze','Rust','Gale','Dusk','Wick'];

function rollVarianceMultiplier(min, max) {
  const r = (Math.random() + Math.random()) * 0.5; // triangular-ish in [0,1]
  return min + r * (max - min);
}

function rollRecruitVariance(speciesKey) {
  // Hidden per-bird stat variance; values are multipliers around 1.0
  const isMelee = SPECIES[speciesKey]?.combatClass === 'melee';
  const v = {
    hpMult:         rollVarianceMultiplier(0.90, 1.10),
    dmgMult:        rollVarianceMultiplier(0.90, 1.10),
    spdMult:        rollVarianceMultiplier(0.95, 1.05),
    atkRateMult:    rollVarianceMultiplier(0.90, 1.10),
    critChanceMult: rollVarianceMultiplier(0.90, 1.10),
  };
  if (isMelee) {
    v.peckSpeedMult     = rollVarianceMultiplier(0.92, 1.08);
    v.peckDmgMinMult    = rollVarianceMultiplier(0.90, 1.10);
    v.peckDmgMaxMult    = rollVarianceMultiplier(0.90, 1.10);
  }
  return v;
}

function generateRecruit() {
  const spKeys = Object.keys(SPECIES).filter(k => k !== 'clueless_borb');
  const sp     = spKeys[Math.floor(Math.random()*spKeys.length)];
  const name   = BIRD_NAMES[Math.floor(Math.random()*BIRD_NAMES.length)]+'-'+Math.floor(Math.random()*90+10);
  const traitKeys = Object.keys(TRAITS);
  // eggLegacy.traitQuality raises trait roll chance from 70% toward 95%
  const traitChance = Math.min(0.95, 0.70 + (profile.eggLegacy.traitQuality || 0) * 0.25);
  const traits = Math.random() < traitChance ? [traitKeys[Math.floor(Math.random()*traitKeys.length)]] : [];
  const baseCost = ({danger_sparrow:35,angry_honker:40,wise_old_bird:35,goth_chicken:30,beach_screamer:25,feathered_loiter:20})[sp]||25;
  const tBonus   = traits.some(t=>TRAITS[t]?.type==='positive')?10:0;
  // eggLegacy.statBonus applies a flat multiplier to base recruit stats (reflected in cost as a premium)
  const statMult = 1 + (profile.eggLegacy.statBonus || 0);
  const costMult = statMult > 1 ? Math.round((statMult - 1) * baseCost * 0.5) : 0;
  // Attach any species-specific genetic growth modifiers
  const relevantBuffs    = (profile.geneticBuffs || []).filter(b => b.species === sp);
  const growthModifiers  = Object.fromEntries(relevantBuffs.map(b => [b.stat, b.modifier]));
  const variance         = rollRecruitVariance(sp);
  return {
    id: 'r'+Date.now()+Math.floor(Math.random()*9999),
    name, species:sp, traits,
    xp:0, runsSurvived:0,
    cost: baseCost + tBonus + costMult,
    statMult,
    growthModifiers,
    variance,
  };
}

function refreshNestPool(force) {
  const cost = 20 + (profile.nestRefreshCount||0)*15;
  if (!force) {
    if (profile.seed < cost) return;
    profile.seed -= cost;
    profile.nestRefreshCount = (profile.nestRefreshCount||0)+1;
  }
  const n = Math.min(6, Math.floor(4+(profile.eggLegacy.poolSize||0)));
  profile.nestPool = Array.from({length:n},generateRecruit);
  saveProfile();
  buildNestTab();
  buildCurrencyDisplay();
}

function buildNestTab() {
  const container = document.getElementById('nest-pool');
  if (!container) return;
  container.innerHTML='';
  if (profile.nestPool.length===0) { refreshNestPool(true); return; }

  const refreshCost = 20+(profile.nestRefreshCount||0)*15;
  const rc = document.getElementById('refresh-cost');
  if (rc) rc.textContent=`(${refreshCost} SEED)`;
  const nr = document.getElementById('nest-roster-count');
  if (nr) nr.textContent=profile.roster.length;

  profile.nestPool.forEach(recruit=>{
    const sp  = SPECIES[recruit.species];
    const card= document.createElement('div'); card.className='nest-recruit-card';
    const traitsHtml = recruit.traits.map(t=>{
      const ti=TRAITS[t];
      return `<span class="trait-pill ${ti?.type||''}">${t}</span>`;
    }).join('');
    const canAfford = profile.seed>=recruit.cost;
    const full      = profile.roster.length>=12;
    card.innerHTML=`
      <div class="recruit-header">
        <div class="bird-badge" style="background:${sp.color}20;border-color:${sp.color}55;"><span style="color:${sp.color};">${BIRD_ICON}</span></div>
        <div class="recruit-info"><div class="bird-name">${recruit.name}</div><div class="bird-species">${sp.label}</div></div>
        <span class="bird-role" style="color:${sp.color};border-color:${sp.color}55;">${sp.role}</span>
      </div>
      <div class="recruit-traits">${traitsHtml||'<span class="no-traits">No traits</span>'}</div>
      <div class="recruit-stats">
        <span>HP ${recruit.statMult>1?Math.round(sp.hp*recruit.statMult):sp.hp}${recruit.statMult>1?'<span style="color:#6ec87a;font-size:9px;">+</span>':''}</span>
        <span>DMG ${recruit.statMult>1?Math.round(sp.dmg*recruit.statMult):sp.dmg}${recruit.statMult>1?'<span style="color:#6ec87a;font-size:9px;">+</span>':''}</span>
        <span>SPD ${sp.spd}</span>
        ${Object.keys(recruit.growthModifiers||{}).length?`<span style="color:#c8a84a;font-size:9px;" title="Genetic growth buffs inherited from fallen bloodline">⬆ GENETIC</span>`:''}
      </div>
      <div class="recruit-footer">
        <span class="recruit-cost">${recruit.cost} SEED</span>
        <button class="recruit-btn ${canAfford&&!full?'':'disabled'}" data-id="${recruit.id}">
          ${full?'ROSTER FULL':canAfford?'RECRUIT':'NEED SEED'}
        </button>
      </div>
    `;
    card.querySelector('.recruit-btn')?.addEventListener('click',()=>{
      if (!canAfford||full) return;
      profile.seed -= recruit.cost;
      const newBird = {
        id: recruit.id, name: recruit.name, species: recruit.species,
        traits: recruit.traits, xp: 0, runsSurvived: 0, cost: recruit.cost,
        growthModifiers: recruit.growthModifiers || {},
        statMult: recruit.statMult || 1,
        variance: recruit.variance || null,
      };
      profile.roster.push(newBird);
      profile.activeRoster.push(newBird.id);
      profile.nestPool = profile.nestPool.filter(r=>r.id!==recruit.id);
      profile.nestPool.push(generateRecruit());
      if (DEBUG_RECRUIT_VARIANCE && newBird.variance) {
        console.log('recruit_variance', { birdId: newBird.id, species: newBird.species, variance: newBird.variance });
      }
      saveProfile();
      buildNestTab(); buildRosterList(); buildFormationTab(); buildCurrencyDisplay();
    });
    container.appendChild(card);
  });

  // Pity system: if roster is empty and seed < cheapest recruit, offer a free Feathered Loiterer
  const FL_RECRUIT_COST = 20;
  if (profile.seed < FL_RECRUIT_COST && profile.roster.length === 0) {
    const pitySp = SPECIES['feathered_loiter'];
    const pityCard = document.createElement('div');
    pityCard.className = 'nest-recruit-card pity-card';
    pityCard.innerHTML = `
      <div class="recruit-header">
        <div class="bird-badge" style="background:${pitySp.color}20;border-color:${pitySp.color}55;"><span style="color:${pitySp.color};">${BIRD_ICON}</span></div>
        <div class="recruit-info"><div class="bird-name">Stray</div><div class="bird-species">${pitySp.label}</div></div>
        <span class="bird-role" style="color:${pitySp.color};border-color:${pitySp.color}55;">${pitySp.role}</span>
      </div>
      <div class="recruit-traits"><span class="no-traits">No traits — wandered in from nowhere</span></div>
      <div class="recruit-stats"><span>HP ${pitySp.hp}</span><span>DMG ${pitySp.dmg}</span><span>SPD ${pitySp.spd}</span></div>
      <div class="recruit-footer">
        <span class="recruit-cost pity-cost" title="A bedraggled bird who wandered in. Free to deploy, easy to replace.">FREE</span>
        <button class="recruit-btn pity-recruit-btn">ACCEPT</button>
      </div>
    `;
    pityCard.querySelector('.pity-recruit-btn')?.addEventListener('click', () => {
      const pityBird = { id:'pity_'+Date.now(), name:'Stray', species:'feathered_loiter', traits:[], xp:0, runsSurvived:0, cost:0 };
      profile.roster.push(pityBird);
      profile.activeRoster.push(pityBird.id);
      saveProfile();
      buildNestTab(); buildRosterList(); buildFormationTab(); buildCurrencyDisplay();
    });
    container.appendChild(pityCard);
  }
}

// ════════════════════════════════════════════════
// HALL OF FEATHERS
// ════════════════════════════════════════════════

function buildHallTab() {
  const container = document.getElementById('hall-list');
  if (!container) return;
  container.innerHTML='';
  if (profile.hallOfFeathers.length===0) {
    container.innerHTML='<p class="hall-empty">No birds have fallen yet. The hall awaits.</p>';
    return;
  }
  profile.hallOfFeathers.slice().reverse().forEach(entry=>{
    const sp  = SPECIES[entry.species]||{label:entry.species,color:'#888',init:'?'};
    const mins= Math.floor(entry.deathTime/60);
    const secs= Math.floor(entry.deathTime%60).toString().padStart(2,'0');
    const row = document.createElement('div'); row.className='hall-entry';
    row.innerHTML=`
      <div class="bird-badge small" style="background:${sp.color}20;border-color:${sp.color}55;"><span style="color:${sp.color};">${BIRD_ICON}</span></div>
      <div class="hall-info">
        <div class="hall-name">${entry.name} <span style="color:${sp.color};">(${sp.label})</span></div>
        <div class="hall-detail">Fell at ${mins}:${secs} · Run ${entry.runNum||'?'}</div>
      </div>
      <div class="hall-role" style="color:${sp.color};">${entry.role||''}</div>
    `;
    container.appendChild(row);
  });
}

// ════════════════════════════════════════════════
// LEVEL SELECT
// ════════════════════════════════════════════════

let selectedDifficulty = 'normal';

function showHardcoreModal() {
  const overlay = document.createElement('div');
  overlay.className = 'hardcore-modal-overlay';
  overlay.innerHTML = `
    <div class="hardcore-modal">
      <h2>ENABLE HARDCORE MODE?</h2>
      <p>Dead birds will be <strong>permanently removed</strong> from your roster. Genetic inheritance is always active, but will be significantly stronger in Hardcore. You can disable this at any time — but dead birds won't come back.</p>
      <div class="hardcore-modal-buttons">
        <button id="hardcore-confirm">ENABLE</button>
        <button id="hardcore-cancel">CANCEL</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('hardcore-confirm').onclick = () => {
    profile.hardcoreMode = true;
    saveProfile();
    const cb = document.getElementById('hardcore-mode-toggle');
    if (cb) cb.checked = true;
    overlay.remove();
  };
  document.getElementById('hardcore-cancel').onclick = () => {
    overlay.remove();
  };
}

function buildLevelSelect() {
  const container = document.getElementById('level-select-inner');
  if (!container) return;

  const hardUnlocked   = (profile.personalBests['campaign_normal']||0) > 0;
  const brutalUnlocked = (profile.personalBests['campaign_hard']||0)   > 0;

  const bests = ['normal','hard','brutal'].map(d=>{
    const v = profile.personalBests[`campaign_${d}`]||0;
    return v>0?`${d[0].toUpperCase()}: ${v.toLocaleString()}`:null;
  }).filter(Boolean);
  const bestStr = bests.length ? 'BEST: '+bests.join('  ') : 'No clears yet';

  container.innerHTML = `
    <div class="level-tile selected campaign-tile">
      <div class="level-tile-header">
        <span class="level-num">THE CAMPAIGN</span>
        <span class="level-name">3-BOSS RUN</span>
      </div>
      <p class="level-desc">Stage 1: The Solar Canopy → Stage 2: Turbine Gorge → Stage 3: The Final Gauntlet. Each stage ends with a boss. Survive all three to complete a campaign run.</p>
      <div class="difficulty-row" data-level="1" id="campaign-diff-row">
        <button class="difficulty-btn active" data-difficulty="normal">NORMAL</button>
        <button class="difficulty-btn ${hardUnlocked?'':'locked'}" data-difficulty="hard">HARD</button>
        <button class="difficulty-btn ${brutalUnlocked?'':'locked'}" data-difficulty="brutal">BRUTAL</button>
      </div>
      <div class="level-best">${bestStr}</div>
      <label class="inf-toggle">
        <input type="checkbox" id="inf-mode-toggle" ${profile.infiniteMode?'checked':''}>
        INFINITE MODE <span class="inf-hint">(Loop Stage 3 after Boss 3. Threat scales ×1.25 per loop.)</span>
      </label>
      <label class="inf-toggle hardcore-toggle">
        <input type="checkbox" id="hardcore-mode-toggle" ${profile.hardcoreMode?'checked':''}>
        HARDCORE MODE <span class="inf-hint">(Permadeath. Dead birds are gone forever. Genetic inheritance is always on, and amplified in Hardcore.)</span>
      </label>
    </div>
  `;

  // Difficulty buttons
  container.querySelectorAll('.difficulty-btn').forEach(btn=>{
    btn.onclick=()=>{
      if (btn.classList.contains('locked')) return;
      container.querySelectorAll('.difficulty-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.dataset.difficulty;
    };
  });

  // Infinite mode toggle
  document.getElementById('inf-mode-toggle')?.addEventListener('change', ev=>{
    profile.infiniteMode = ev.target.checked;
    saveProfile();
  });

  // Hardcore mode toggle with confirmation modal
  document.getElementById('hardcore-mode-toggle')?.addEventListener('change', ev=>{
    if (ev.target.checked) {
      ev.target.checked = false;
      showHardcoreModal();
    } else {
      profile.hardcoreMode = false;
      saveProfile();
    }
  });

  selectedDifficulty = 'normal';
}

// ════════════════════════════════════════════════
// SCREEN MANAGEMENT
// ════════════════════════════════════════════════

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(`screen-${name}`)?.classList.add('active');
  state.screen = name;
  if (name==='level-select') buildLevelSelect();
  if (name==='hub') buildCurrencyDisplay();
}

// ════════════════════════════════════════════════
// CAMERA INPUT
// ════════════════════════════════════════════════

function initCameraControls() {
  const c = document.getElementById('game-canvas');
  if (!c) return;

  c.addEventListener('wheel', ev=>{
    ev.preventDefault();
    const delta = ev.deltaY > 0 ? -0.12 : 0.12;
    state.camera.zoom = Math.max(0.6, Math.min(1.8, state.camera.zoom+delta));
  }, {passive:false});

  let dragging=false, dragStart=null, panStart=null;
  c.addEventListener('mousedown', ev=>{
    const rect=c.getBoundingClientRect();
    const mx=ev.clientX-rect.left, my=ev.clientY-rect.top;
    const cam=state.camera;
    // World coords
    const wx=(mx-W/2-cam.panX)/cam.zoom+W/2;
    const wy=(my-H/2-cam.panY)/cam.zoom+H/2;
    const clicked=state.birds?.find(b=>b.alive&&dist(wx,wy,b.x,b.y)<BIRD_R+6);
    if (clicked) { cam.followId=cam.followId===clicked.id?null:clicked.id; return; }
    dragging=true; dragStart={x:mx,y:my}; panStart={x:cam.panX,y:cam.panY};
  });
  c.addEventListener('mousemove', ev=>{
    if (!dragging||!dragStart) return;
    const rect=c.getBoundingClientRect();
    const mx=ev.clientX-rect.left, my=ev.clientY-rect.top;
    state.camera.followId=null;
    state.camera.panX=panStart.x+(mx-dragStart.x);
    state.camera.panY=panStart.y+(my-dragStart.y);
  });
  c.addEventListener('mouseup',  ()=>{ dragging=false; dragStart=null; });
  c.addEventListener('mouseleave',()=>{ dragging=false; dragStart=null; });

  document.addEventListener('keydown', ev=>{
    if (state.screen!=='battle') return;
    if (ev.ctrlKey && ev.shiftKey && (ev.key==='E' || ev.key==='e')) {
      runLog.exportToFile();
      return;
    }
    const cam=state.camera;
    switch(ev.key) {
      case '+': case '=': cam.zoom=Math.min(1.8,cam.zoom+0.15); break;
      case '-': case '_': cam.zoom=Math.max(0.6,cam.zoom-0.15); break;
      case 'ArrowLeft':  cam.followId=null; cam.panX+=24; break;
      case 'ArrowRight': cam.followId=null; cam.panX-=24; break;
      case 'ArrowUp':    cam.followId=null; cam.panY+=24; break;
      case 'ArrowDown':  cam.followId=null; cam.panY-=24; break;
      case 'Escape':     cam.zoom=1; cam.panX=0; cam.panY=0; cam.followId=null; break;
    }
  });
}

// ════════════════════════════════════════════════
// RUN MANAGEMENT
// ════════════════════════════════════════════════

let animId=null, lastTS=0, running=false;

function gameLoop(ts) {
  if (!running) return;
  const dt = Math.min((ts-lastTS)/1000, 0.05);
  lastTS = ts;
  try {
    update(dt);
    render();
  } catch (e) {
    // Prevent unforeseen runtime errors from permanently freezing the game loop.
    console.error('[Assault Flock] Uncaught error in gameLoop:', e);
  }
  if (running) {
    animId = requestAnimationFrame(gameLoop);
  }
}

function launchBattle() {
  running=false;
  if (animId) cancelAnimationFrame(animId);
  updateFormationTargets();
  readCallCards();
  persistCallCardsToProfile();
  updateCardIndicators();
  // Show/hide 4th indicator
  const ind3=document.getElementById('card-ind-3');
  if (ind3) ind3.style.display=getCardSlotCount()>=4?'flex':'none';
  const lvlLabel=document.getElementById('hud-level-label');
  if (lvlLabel) lvlLabel.textContent=`STAGE ${state.stage||1} · ${state.currentDifficulty.toUpperCase()}`;
  showScreen('battle');
  lastTS=performance.now(); running=true;
  animId=requestAnimationFrame(gameLoop);
}

function startRun() {
  const activeFormation = document.querySelector('.formation-btn.active')?.dataset.formation || profile.selectedFormation;
  const formation       = isFormationUnlocked(activeFormation) ? activeFormation : 'flying_v';
  initState(false, false);
  state.currentLevel      = 1;
  state.currentDifficulty = selectedDifficulty;
  state.formation         = formation;
  state.diffMult          = selectedDifficulty==='brutal'?1.5:selectedDifficulty==='hard'?1.2:1.0;
  state.bgScrollSpeed     = 55;
  state.stage             = 1;
  state.infiniteMode      = profile.infiniteMode || false;

  // Assign unique bosses to each stage by shuffling the pool
  const bossTypes = ['a','b','c','d'];
  for (let i = bossTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bossTypes[i], bossTypes[j]] = [bossTypes[j], bossTypes[i]];
  }
  state.bossForStage = { 1: bossTypes[0], 2: bossTypes[1], 3: bossTypes[2] };

  // Apply position assignments for real birds
  const slotNames = FORMATION_SLOT_NAMES[formation]||[];
  slotNames.forEach((_,i)=>{
    const key        = `${formation}_${i}`;
    const assignedId = profile.positionAssignments[key];
    if (assignedId && assignedId !== 'borb') {
      const bird = state.birds.find(b=>b.id===assignedId);
      if (bird) bird.formationSlot=i;
    }
  });

  // Prune unassigned birds and inject borbs
  finalizeFlockForFormation(formation);

  waveController.registerLevel('1:normal', level1NormalScript);
  waveController.registerLevel('1:hard', level1NormalScript);
  waveController.registerLevel('1:brutal', level1NormalScript);
  waveController.registerLevel('2:normal', level2NormalScript);
  waveController.registerLevel('2:hard', level2NormalScript);
  waveController.registerLevel('2:brutal', level2NormalScript);
  waveController.registerLevel('3:normal', level3NormalScript);
  waveController.registerLevel('3:hard', level3NormalScript);
  waveController.registerLevel('3:brutal', level3NormalScript);
  waveController.startLevel(state.currentLevel, state.currentDifficulty);

  runLog.begin({
    formation: state.formation,
    difficulty: state.currentDifficulty,
    roster: state.birds.map(b => ({ id: b.id, species: b.species })),
    callCards: state.callCards.map(c => c ? { condition: c.condition, action: c.action, tier: c.tier } : null),
    infiniteMode: profile.infiniteMode || false,
    hardcoreMode: profile.hardcoreMode || false,
    buildId: GAME_VERSION.buildId,
  });

  launchBattle();
}

function retryRun() {
  const prevDiff       = state.currentDifficulty || 'normal';
  const prevInfinite   = state.infiniteMode || false;
  const prevFormation  = state.formation || profile.selectedFormation;
  initState(true, true);
  state.currentDifficulty = prevDiff;
  state.diffMult          = prevDiff==='brutal'?1.5:prevDiff==='hard'?1.2:1.0;
  state.stage             = 1;
  state.currentLevel      = 1;
  state.infiniteMode      = prevInfinite;
  const bossTypes = ['a','b','c','d'];
  for (let i = bossTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bossTypes[i], bossTypes[j]] = [bossTypes[j], bossTypes[i]];
  }
  state.bossForStage = { 1: bossTypes[0], 2: bossTypes[1], 3: bossTypes[2] };
  finalizeFlockForFormation(state.formation || prevFormation);

  waveController.registerLevel('1:normal', level1NormalScript);
  waveController.registerLevel('1:hard', level1NormalScript);
  waveController.registerLevel('1:brutal', level1NormalScript);
  waveController.registerLevel('2:normal', level2NormalScript);
  waveController.registerLevel('2:hard', level2NormalScript);
  waveController.registerLevel('2:brutal', level2NormalScript);
  waveController.registerLevel('3:normal', level3NormalScript);
  waveController.registerLevel('3:hard', level3NormalScript);
  waveController.registerLevel('3:brutal', level3NormalScript);
  waveController.startLevel(state.currentLevel, state.currentDifficulty);

  runLog.begin({
    formation: state.formation,
    difficulty: state.currentDifficulty,
    roster: state.birds.map(b => ({ id: b.id, species: b.species })),
    callCards: state.callCards.map(c => c ? { condition: c.condition, action: c.action, tier: c.tier } : null),
    infiniteMode: profile.infiniteMode || false,
    hardcoreMode: profile.hardcoreMode || false,
    buildId: GAME_VERSION.buildId,
  });

  launchBattle();
}

// ════════════════════════════════════════════════
// DEBRIEF
// ════════════════════════════════════════════════

function showDebrief() {
  running=false;
  if (animId) { cancelAnimationFrame(animId); animId=null; }

  const record = runLog.flush();

  const survivors  = state.birds.filter(b=>b.alive);
  const xp         = Math.round(state.score/80);
  const baseSeed   = state.kills*10+survivors.length*20+(state.bossKilled?80:0);
  const loopBonus  = 1 + (state.infiniteLoop||0) * 0.5;
  const seed       = Math.round(baseSeed * loopBonus);
  const plumes     = state.bossKilled?Math.floor(1+Math.random()*2):0;
  const dm         = state.currentDifficulty==='brutal'?3:state.currentDifficulty==='hard'?2:1;
  const finalScore = Math.round(state.score*dm);
  const bestKey    = `campaign_${state.currentDifficulty}`;
  const prevBest   = profile.personalBests[bestKey]||0;
  const isNewBest  = finalScore>prevBest;

  // Apply progression
  profile.commanderXp  += xp;
  profile.seed         += seed;
  profile.plumes       += plumes;
  profile.runCount      = (profile.runCount||0)+1;
  if (isNewBest) profile.personalBests[bestKey]=finalScore;

  // Track campaign completion
  if (state.runSuccess && state.stage >= 3) {
    profile.personalBests['campaign_cleared'] = true;
  }

  // Genetic inheritance — all real birds contribute based on progress, with deaths and Hardcore amplifying legacy
  const allRealBirds = state.birds.filter(b => !b.isBorb);
  allRealBirds.forEach(bird => {
    if (!bird.baseStats) return;
    const levelProgress = Math.max(0, Math.min(1, (bird.level - 1) / (MAX_BIRD_LEVEL - 1 || 1)));
    let weight = levelProgress;
    const wasLost = !!state.lostBirds.find(lb => lb.id === bird.id);
    if (wasLost) weight *= 1.5;
    if (profile.hardcoreMode) weight *= 1.5;
    processGeneticInheritance(bird, weight);
  });

  // Hall of Feathers — borbs are disposable and leave no legacy
  state.lostBirds.forEach(fallen=>{
    if (fallen.id && fallen.id.startsWith('borb_')) return;
    const sp=SPECIES[fallen.species];
    profile.hallOfFeathers.push({ name:fallen.name, species:fallen.species, role:sp.role, deathTime:fallen.time, runNum:profile.runCount });
    if (profile.hardcoreMode && fallen.id) removeBird(fallen.id);
  });

  // Egg legacy — only real birds count toward legacy enrichment
  const realLost = state.lostBirds.filter(b => !(b.id && b.id.startsWith('borb_')));
  if (realLost.length>0) {
    profile.eggLegacy.statBonus   = Math.min(0.20, (profile.eggLegacy.statBonus||0)+0.005*realLost.length);
    profile.eggLegacy.poolSize    = Math.min(3,    (profile.eggLegacy.poolSize||0)+0.08*realLost.length);
    profile.eggLegacy.traitQuality= Math.min(1.0,  (profile.eggLegacy.traitQuality||0)+0.01*realLost.length);
  }

  // Standard mode: passive egg legacy growth every run (slower than death-based Hardcore gains)
  if (!profile.hardcoreMode) {
    profile.eggLegacy.statBonus    = Math.min(0.20, (profile.eggLegacy.statBonus||0) + 0.002);
    profile.eggLegacy.traitQuality = Math.min(1.0,  (profile.eggLegacy.traitQuality||0) + 0.005);
  }

  saveProfile();

  // Render debrief
  const titleEl = document.getElementById('debrief-outcome');
  if (titleEl) { titleEl.textContent=state.runSuccess?'RUN COMPLETE':'FLOCK DEFEATED'; titleEl.className='debrief-title'+(state.runSuccess?'':' failure'); }

  const metaEl = document.getElementById('debrief-meta');
  const stagesStr = state.stage >= 3 ? '3 BOSSES CLEARED' : `STAGE ${state.stage} · ${state.currentDifficulty.toUpperCase()}`;
  const infiniteStr = state.infiniteLoop > 0 ? ` · LOOP ${state.infiniteLoop}` : '';
  if (metaEl) metaEl.textContent=`${stagesStr}${infiniteStr}${dm>1?' · ×'+dm+' SCORE MULTIPLIER':''}`;

  document.getElementById('debrief-score').textContent=finalScore.toLocaleString();

  const pbEl=document.getElementById('debrief-personal-best');
  if (pbEl) {
    pbEl.textContent = isNewBest?'★ NEW PERSONAL BEST': prevBest>0?`Personal best: ${prevBest.toLocaleString()}`:'';
    pbEl.className   = 'personal-best-notice'+(isNewBest?' new-best':'');
  }

  const statsEl=document.getElementById('debrief-stats');
  if (statsEl) {
    statsEl.innerHTML=`
      <div class="stat-box"><div class="stat-val">${state.kills}</div><div class="stat-name">ENEMIES KILLED</div></div>
      <div class="stat-box"><div class="stat-val">${survivors.filter(b=>!b.isBorb).length}/${state.birds.filter(b=>!b.isBorb).length}</div><div class="stat-name">BIRDS SURVIVING</div></div>
      <div class="stat-box"><div class="stat-val">${xp}</div><div class="stat-name">COMMANDER XP</div></div>
      <div class="stat-box"><div class="stat-val">${seed}</div><div class="stat-name">SEED EARNED${state.infiniteLoop>0?' ×'+loopBonus.toFixed(1):''}</div></div>
      ${plumes>0?`<div class="stat-box"><div class="stat-val">${plumes}</div><div class="stat-name">PLUMES EARNED</div></div>`:''}
      ${state.bossKilled?'<div class="stat-box boss-kill"><div class="stat-val">✓</div><div class="stat-name">BOSS DEFEATED</div></div>':''}
      <div class="stat-box"><div class="stat-val">${Math.round(state.runTime)}s</div><div class="stat-name">TIME SURVIVED</div></div>
      <div class="stat-box"><div class="stat-val">${Math.round(state.morale)}</div><div class="stat-name">FINAL MORALE</div></div>
      <div class="stat-box"><div class="stat-val">${Math.round(state.totalSlipstreamHealing||0)}</div><div class="stat-name">SLIP. HEALED</div></div>
    `;
  }

  const eventsEl=document.getElementById('debrief-events');
  if (eventsEl) {
    const timelineHtml = record && record.events && record.events.length > 0
      ? '<h3>KEY EVENTS</h3><div class="debrief-event-timeline">' + record.events.map(ev => {
          const mins = Math.floor(ev.t / 60);
          const timeStr = `${mins}:${(ev.t % 60).toFixed(1)}`;
          const typeClass = (ev.type || '').replace(/_/g, '-');
          let summary = ev.type || '';
          if (ev.type === 'bird_death') summary = `${ev.name || ev.birdId} fell`;
          else if (ev.type === 'boss_spawn') summary = `${ev.bossName || 'Boss'} appeared`;
          else if (ev.type === 'boss_kill') summary = `Boss defeated`;
          else if (ev.type === 'card_fire') summary = `Card: ${ev.action || ev.condition || ''}`;
          else if (ev.type === 'stance_change') summary = `Stance → ${ev.to || ''}`;
          else if (ev.type === 'formation_change') summary = `Formation → ${ev.to || ''}`;
          else if (ev.type === 'run_end') summary = `Score ${ev.score ?? ''}`;
          else if (ev.type === 'run_heartbeat') summary = `t=${ev.runTime?.toFixed(0)}s`;
          else if (ev.type === 'wave_spawn') summary = `${ev.groupId || ''} (${ev.count ?? 0})`;
          else summary = ev.type;
          return `<div class="event-line event-${typeClass}" title="${ev.type}"><span class="event-time">${timeStr}</span><span class="event-type">${ev.type}</span><span class="event-summary">${summary}</span></div>`;
        }).join('') + '</div>'
      : '<h3>KEY EVENTS</h3>'+buildEventLines(xp,plumes);
    eventsEl.innerHTML=timelineHtml;
  }

  const birdsEl=document.getElementById('debrief-birds');
  if (birdsEl) {
    const realLostBirds = state.lostBirds.filter(b => !(b.id && b.id.startsWith('borb_')));
    const realSurvivors = survivors.filter(b => !b.isBorb);
    if (realLostBirds.length===0) {
      birdsEl.innerHTML='<p class="survivors-note">PERFECT RUN — No birds lost.</p>';
    } else {
      const lostItems=realLostBirds.map(b=>{
        const sp=SPECIES[b.species]; const mins=Math.floor(b.time/60); const secs=Math.floor(b.time%60).toString().padStart(2,'0');
        return `<div class="lost-bird"><div class="lost-bird-dot" style="background:${sp.color}44;border-color:${sp.color}88;"></div><span class="lost-bird-name">${b.name} <span style="color:${sp.color};">(${sp.label})</span></span><span class="lost-bird-time">${mins}:${secs}</span></div>`;
      }).join('');
      const survivorLine=realSurvivors.length>0?`<p class="survivors-note">SURVIVED: ${realSurvivors.map(b=>b.name).join(', ')}</p>`:'';
      const lostHeader = profile.hardcoreMode ? `BIRDS LOST (${realLostBirds.length})` : `BIRDS DOWN (${realLostBirds.length})`;
      const returnNote = profile.hardcoreMode ? '' : '<p class="survivors-note">All birds have been returned to your roster.</p>';
      birdsEl.innerHTML=`<h3>${lostHeader}</h3>${lostItems}${returnNote}${survivorLine}`;
    }
  }

  showScreen('debrief');
}

function buildEventLines(xpEarned, plumesEarned) {
  const lines=[];
  const realLost = state.lostBirds.filter(b => !(b.id && b.id.startsWith('borb_')));
  if (realLost.length===0) {
    lines.push(`<div class="event-line"><span class="hi">No casualties.</span> The flock held together.</div>`);
  } else {
    const first=realLost[0]; const sp=SPECIES[first.species];
    const mins=Math.floor(first.time/60); const secs=Math.floor(first.time%60).toString().padStart(2,'0');
    lines.push(`<div class="event-line">First loss: <span class="warn">${first.name}</span> (${sp.role}) fell at <span class="hi">${mins}:${secs}</span>.</div>`);
  }

  const anchor=state.birds.find(b=>b.species==='angry_honker');
  if (anchor&&!anchor.alive) lines.push(`<div class="event-line"><span class="danger">Anchor lost:</span> ${anchor.name} fell — morale took a cascade hit. Consider protecting the Anchor with a rotation card.</div>`);
  if (state.bossKilled) lines.push(`<div class="event-line"><span class="hi">Boss defeated!</span> ${plumesEarned} Plume${plumesEarned!==1?'s':''} earned.</div>`);
  else if (state.bossActive&&!state.bossKilled) lines.push(`<div class="event-line"><span class="warn">Boss survived.</span> Study its phase pattern — time your attacks to the exposed window.</div>`);
  if (state.moraleCollapse) lines.push(`<div class="event-line"><span class="danger">Morale collapsed.</span> Cards were ignored. Add a rally stance card or protect your Anchor.</div>`);
  if (state.stance==='aggressive') lines.push(`<div class="event-line">Run ended in <span class="warn">aggressive stance</span> — higher damage but flock absorbed more.</div>`);
  else if (state.stance==='evasive') lines.push(`<div class="event-line">Run ended in <span class="hi">evasive stance</span> — reduced damage taken, lower kill rate.</div>`);
  if (state.kills>=25) lines.push(`<div class="event-line"><span class="hi">${state.kills} kills</span> — strong offensive output.</div>`);
  else if (state.kills<8) lines.push(`<div class="event-line">Only <span class="warn">${state.kills} kills</span>. Try a Focus Fire or Aggressive Stance card.</div>`);
  const hot=Math.round(state.totalSlipstreamHealing||0);
  if (hot>=40) lines.push(`<div class="event-line"><span class="hi">${hot} HP</span> recovered via slipstream — rear V discipline paid off.</div>`);

  // XP milestone notices
  const xpBefore=profile.commanderXp-xpEarned;
  Object.entries(UNLOCK).forEach(([key,v])=>{
    if (xpBefore<v && profile.commanderXp>=v) {
      const names={SPREAD_LINE:'Spread Line formation',TIER2_CARDS:'Tier 2 call cards (AND/OR)',TIGHT_CLUSTER:'Tight Cluster formation',CARD_SLOT_4:'4th card slot',ECHELON:'Echelon formation',TIER3_CARDS:'Tier 3 call cards (FOR EACH/WHILE)'};
      lines.push(`<div class="event-line"><span class="hi">UNLOCKED:</span> ${names[key]||key}</div>`);
    }
  });

  if (lines.length===0) lines.push('<div class="event-line">Run complete.</div>');
  return lines.join('');
}

// ════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════

function init() {
  canvas = document.getElementById('game-canvas');
  ctx    = canvas.getContext('2d');
  // Log version info early so playtests can confirm the correct build.
  if (typeof console !== 'undefined') {
    console.info('Assault Flock build', {
      phase: GAME_VERSION.phase,
      buildId: GAME_VERSION.buildId,
      timestampArray: GAME_VERSION.timestampArray,
    });
  }
  loadProfile();
  loadBirdSprite();
  initState(false, false);
  initMcpDebugSocket();
  startMcpDebugPump();
  // Populate hub version label if present.
  const versionEl = document.getElementById('version-label');
  if (versionEl) {
    versionEl.textContent = `${GAME_VERSION.phase} #${GAME_VERSION.buildId}`;
  }
  buildHubUI();
  initCameraControls();
  showScreen('hub');
}

document.addEventListener('DOMContentLoaded', init);

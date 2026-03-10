'use strict';

// ════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════

const W = 600;
const H = 700;
const FLOCK_X = W / 2;
const FLOCK_Y = H * 0.70;
const RUN_DURATION = 90;        // seconds
const SIM_TICK     = 0.15;      // call card evaluation interval (s)
const CARD_COOLDOWN = 6.0;      // seconds before same card can re-fire
const BIRD_R  = 13;
const ENEMY_R = 11;
const PROJ_R  = 3;

// ════════════════════════════════════════════════
// SPECIES DATA
// ════════════════════════════════════════════════

const SPECIES = {
  danger_sparrow:    { label: 'Danger Sparrow',    init: 'DS', role: 'Striker',     color: '#e06030', hp: 65,  dmg: 22, spd: 1.5, range: 110, atkRate: 1.2 },
  feathered_loiter:  { label: 'Feathered Loiterer',init: 'FL', role: 'Screen',      color: '#8aaa50', hp: 42,  dmg: 10, spd: 1.3, range: 80,  atkRate: 0.8 },
  goth_chicken:      { label: 'Goth Chicken',      init: 'GC', role: 'Opportunist', color: '#9955dd', hp: 82,  dmg: 16, spd: 1.1, range: 90,  atkRate: 1.0 },
  angry_honker:      { label: 'Angry Honker',      init: 'AH', role: 'Anchor',      color: '#d4860a', hp: 130, dmg: 13, spd: 0.8, range: 70,  atkRate: 0.9 },
  wise_old_bird:     { label: 'Wise Old Bird',      init: 'WB', role: 'Specialist',  color: '#50a0cc', hp: 72,  dmg: 16, spd: 1.1, range: 130, atkRate: 0.9 },
  beach_screamer:    { label: 'Beach Screamer',     init: 'BS', role: 'Medic',       color: '#40c0a0', hp: 95,  dmg: 9,  spd: 1.2, range: 65,  atkRate: 0.7 },
};

// ════════════════════════════════════════════════
// FORMATION OFFSETS  (relative to FLOCK_X, FLOCK_Y)
// ════════════════════════════════════════════════

function getFormationOffsets(formation, count) {
  if (formation === 'flying_v') {
    // Classic V — front bird leads, wings extend back
    const slots = [
      [  0, -78],              // 0: front / leader
      [-50, -36], [ 50, -36],  // 1,2: inner wings
      [-100,  6], [100,  6],   // 3,4: outer wings
      [-150, 48], [  0, 48], [150, 48], // 5,6,7: tail
    ];
    return slots.slice(0, Math.min(count, slots.length));
  }

  // Loose Swarm — semi-stable spread using golden-angle distribution
  const offsets = [];
  for (let i = 0; i < count; i++) {
    const angle = i * 2.399963; // golden angle in radians
    const r = 30 + (i % 3) * 28 + Math.floor(i / 3) * 10;
    const jx = Math.sin(i * 137.508) * 15;
    const jy = Math.cos(i * 137.508 * 1.3) * 15;
    offsets.push([Math.cos(angle) * r + jx, Math.sin(angle) * r + jy]);
  }
  return offsets;
}

// ════════════════════════════════════════════════
// SPAWN SCHEDULE
// ════════════════════════════════════════════════

function buildSpawnSchedule() {
  const s = [];

  // 0–25s: drone waves
  for (let t = 4; t <= 25; t += 6) {
    const n = Math.min(2 + Math.floor(t / 8), 5);
    for (let i = 0; i < n; i++) s.push({ time: t + i * 0.6, type: 'drone' });
  }
  // 12–55s: turret nests
  for (let t = 12; t <= 55; t += 11) {
    s.push({ time: t, type: 'turret' });
    s.push({ time: t + 2, type: 'turret' });
  }
  // 38–88s: rival sparrows
  for (let t = 38; t <= 86; t += 9) {
    s.push({ time: t, type: 'sparrow' });
    s.push({ time: t + 2.5, type: 'sparrow' });
  }

  return s.sort((a, b) => a.time - b.time);
}

// ════════════════════════════════════════════════
// GAME STATE
// ════════════════════════════════════════════════

let state = {};

function buildStarterFlock() {
  const roster = [
    { name: 'Rex',      species: 'danger_sparrow',   trait: 'Reckless'   },
    { name: 'Blaze',    species: 'danger_sparrow',   trait: 'Vengeful'   },
    { name: 'Pidge',    species: 'feathered_loiter', trait: null         },
    { name: 'Coo',      species: 'feathered_loiter', trait: null         },
    { name: 'Mortimer', species: 'goth_chicken',     trait: 'Cautious'   },
    { name: 'Gerald',   species: 'angry_honker',     trait: 'Enduring'   },
    { name: 'Archie',   species: 'wise_old_bird',    trait: 'Protective' },
    { name: 'Sandy',    species: 'beach_screamer',   trait: null         },
  ];

  return roster.map((r, i) => {
    const sp = SPECIES[r.species];
    return {
      id: i,
      name: r.name,
      species: r.species,
      trait: r.trait,
      hp: sp.hp,
      maxHp: sp.hp,
      stamina: 100,
      x: FLOCK_X + (i - 3.5) * 20,
      y: FLOCK_Y,
      targetX: FLOCK_X,
      targetY: FLOCK_Y,
      formationSlot: i,
      alive: true,
      atkCooldown: i * 0.25,   // stagger initial attacks
      healCooldown: 0,
      flashTimer: 0,
      deathTime: null,
    };
  });
}

function initState(keepCards, keepFormation) {
  const savedCards     = keepCards     ? state.callCards  : null;
  const savedFormation = keepFormation ? state.formation  : 'flying_v';

  state = {
    screen: 'hub',
    birds: buildStarterFlock(),
    enemies: [],
    projectiles: [],
    callCards: savedCards || [],
    formation: savedFormation,
    stance: 'normal',
    score: 0,
    kills: 0,
    runTime: 0,
    bgOffset: 0,
    simTimer: 0,
    cardFlash:    [0, 0, 0],
    cardCooldowns:[0, 0, 0],
    focusTarget: null,
    isReorganizing: false,
    reorgTimer: 0,
    spawnSchedule: buildSpawnSchedule(),
    nextSpawnIdx: 0,
    enemyId: 0,
    projId: 0,
    lostBirds: [],
    runSuccess: false,
  };
}

// ════════════════════════════════════════════════
// ENEMY CREATION
// ════════════════════════════════════════════════

function spawnEnemy(type) {
  const x = 60 + Math.random() * (W - 120);
  const id = ++state.enemyId;

  if (type === 'drone') {
    state.enemies.push({
      id, type: 'drone',
      hp: 28, maxHp: 28,
      x, y: -30,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 1.4,
      alive: true,
      atkCooldown: 0.8 + Math.random(),
      flashTimer: 0,
    });
  } else if (type === 'turret') {
    state.enemies.push({
      id, type: 'turret',
      hp: 90, maxHp: 90,
      x, y: -25,
      vx: 0, vy: 0.35,
      alive: true,
      atkCooldown: 2.0 + Math.random() * 1.5,
      flashTimer: 0,
    });
  } else if (type === 'sparrow') {
    state.enemies.push({
      id, type: 'sparrow',
      hp: 55, maxHp: 55,
      x, y: -30,
      vx: (Math.random() - 0.5) * 1.0,
      vy: 0.9,
      alive: true,
      atkCooldown: 1.5 + Math.random(),
      flashTimer: 0,
    });
  }
}

// ════════════════════════════════════════════════
// UTILITY
// ════════════════════════════════════════════════

function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function fireProj(fromX, fromY, toX, toY, dmg, owner, color) {
  const d = dist(fromX, fromY, toX, toY) || 1;
  const spd = owner === 'bird' ? 5.5 : 3.8;
  state.projectiles.push({
    id: ++state.projId,
    x: fromX, y: fromY,
    vx: (toX - fromX) / d * spd,
    vy: (toY - fromY) / d * spd,
    dmg, owner, color,
    alive: true,
  });
}

// ════════════════════════════════════════════════
// FORMATION
// ════════════════════════════════════════════════

function updateFormationTargets() {
  const alive   = state.birds.filter(b => b.alive);
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
  state.formation = newFormation;
  state.isReorganizing = true;
  state.reorgTimer = 1.8;
  updateFormationTargets();
  const el = document.getElementById('hud-formation');
  if (el) el.textContent = newFormation === 'flying_v' ? 'FLYING V' : 'LOOSE SWARM';
}

function rotateLeader() {
  const alive = state.birds.filter(b => b.alive);
  if (alive.length < 2) return;
  const leader = alive.find(b => b.formationSlot === 0);
  if (!leader) return;
  const maxSlot = Math.max(...alive.map(b => b.formationSlot));
  leader.formationSlot = maxSlot + 1;
  alive
    .sort((a, b) => a.formationSlot - b.formationSlot)
    .forEach((b, i) => { b.formationSlot = i; });
  updateFormationTargets();
}

// ════════════════════════════════════════════════
// CALL CARD SYSTEM
// ════════════════════════════════════════════════

function readCallCards() {
  state.callCards = [];
  for (let i = 0; i < 3; i++) {
    const cond = document.querySelector(`#card-cond-${i}`)?.value || 'none';
    const act  = document.querySelector(`#card-act-${i}`)?.value  || 'none';
    state.callCards.push({ condition: cond, action: act });
  }
}

function checkCondition(cond) {
  const alive  = state.birds.filter(b => b.alive);
  const totHp  = alive.reduce((s, b) => s + b.hp, 0);
  const maxHp  = alive.reduce((s, b) => s + b.maxHp, 0);
  const hpPct  = maxHp > 0 ? totHp / maxHp : 0;
  const avgSt  = alive.length ? alive.reduce((s, b) => s + b.stamina, 0) / alive.length : 0;

  switch (cond) {
    case 'flock_hp_70':    return hpPct < 0.70;
    case 'flock_hp_50':    return hpPct < 0.50;
    case 'flock_hp_30':    return hpPct < 0.30;
    case 'enemy_drone':    return state.enemies.some(e => e.alive && e.type === 'drone');
    case 'enemy_sparrow':  return state.enemies.some(e => e.alive && e.type === 'sparrow');
    case 'enemy_turret':   return state.enemies.some(e => e.alive && e.type === 'turret');
    case 'birds_6':        return alive.length < 6;
    case 'birds_4':        return alive.length < 4;
    case 'stamina_50':     return avgSt < 50;
    case 'stamina_30':     return avgSt < 30;
    case 'always':         return true;
    default:               return false;
  }
}

function applyAction(act) {
  switch (act) {
    case 'loose_swarm':
      if (state.formation !== 'loose_swarm') triggerFormationChange('loose_swarm');
      break;
    case 'flying_v':
      if (state.formation !== 'flying_v') triggerFormationChange('flying_v');
      break;
    case 'aggressive':
      if (state.stance !== 'aggressive') state.stance = 'aggressive';
      break;
    case 'evasive':
      if (state.stance !== 'evasive') state.stance = 'evasive';
      break;
    case 'normal_stance':
      if (state.stance !== 'normal') state.stance = 'normal';
      break;
    case 'focus_fire': {
      const targets = state.enemies.filter(e => e.alive);
      if (targets.length) {
        state.focusTarget = targets.reduce((best, e) =>
          dist(e.x, e.y, FLOCK_X, FLOCK_Y) < dist(best.x, best.y, FLOCK_X, FLOCK_Y) ? e : best
        );
      }
      break;
    }
    case 'rotate_leader':
      rotateLeader();
      break;
  }
}

function evaluateCallCards() {
  for (let i = 0; i < state.callCards.length; i++) {
    if (state.cardCooldowns[i] > 0) continue;
    const card = state.callCards[i];
    if (card.condition === 'none' || card.action === 'none') continue;
    if (checkCondition(card.condition)) {
      applyAction(card.action);
      state.cardFlash[i]     = 0.7;
      state.cardCooldowns[i] = CARD_COOLDOWN;
      break; // highest-priority card wins
    }
  }
}

// ════════════════════════════════════════════════
// UPDATE — BIRDS
// ════════════════════════════════════════════════

function updateBirds(dt) {
  const atkMult  = state.stance === 'aggressive' ? 1.4 : state.stance === 'evasive' ? 0.6 : 1.0;
  const spdMult  = state.stance === 'evasive'    ? 1.05 : 1.0;
  const jitter   = state.stance === 'evasive'    ? 9 : 0;

  const alive = state.birds.filter(b => b.alive);
  alive
    .sort((a, b) => a.formationSlot - b.formationSlot)
    .forEach((bird, slotIdx) => {

      // ── Stamina drain (front birds tire faster in V formation) ──
      const isLeader = slotIdx === 0;
      const drain = (state.formation === 'flying_v')
        ? (isLeader ? 5.0 : (slotIdx < 3 ? 2.5 : 1.2)) * dt
        : 2.2 * dt;
      bird.stamina = Math.max(0, bird.stamina - drain);

      // ── Slow recovery in slipstream ──
      if (state.formation === 'flying_v' && !isLeader) {
        bird.stamina = Math.min(100, bird.stamina + 0.6 * dt);
      }

      // ── Beach Screamer: heal nearby allies ──
      if (bird.species === 'beach_screamer') {
        bird.healCooldown -= dt;
        if (bird.healCooldown <= 0) {
          bird.healCooldown = 2.8;
          alive.forEach(b => {
            if (b !== bird && dist(b.x, b.y, bird.x, bird.y) < 90) {
              b.hp = Math.min(b.maxHp, b.hp + 9);
            }
          });
        }
      }

      // ── Move toward formation target ──
      const tx = bird.targetX + (Math.random() - 0.5) * jitter;
      const ty = bird.targetY + (Math.random() - 0.5) * jitter;
      const d  = dist(bird.x, bird.y, tx, ty);
      const sp = SPECIES[bird.species];
      const moveSpd = sp.spd * spdMult * (0.4 + bird.stamina / 160) * dt * 60;
      if (d > 2) {
        bird.x += (tx - bird.x) / d * Math.min(d, moveSpd);
        bird.y += (ty - bird.y) / d * Math.min(d, moveSpd);
      }

      // ── Auto-attack ──
      bird.atkCooldown -= dt;
      if (bird.atkCooldown <= 0 && !state.isReorganizing) {
        let target = null;

        // Focus fire overrides normal targeting
        if (state.focusTarget && state.focusTarget.alive) {
          target = state.focusTarget;
        } else {
          const inRange = state.enemies.filter(e =>
            e.alive && dist(bird.x, bird.y, e.x, e.y) < sp.range
          );
          if (inRange.length) {
            target = inRange.reduce((best, e) =>
              dist(bird.x, bird.y, e.x, e.y) < dist(bird.x, bird.y, best.x, best.y) ? e : best
            );
          }
        }

        if (target) {
          let dmg = sp.dmg;
          if (state.stance === 'aggressive') dmg *= 1.3;
          if (bird.species === 'goth_chicken' && target.hp < target.maxHp * 0.5) dmg *= 1.4;
          if (bird.trait === 'Vengeful' && state.lostBirds.length > 0) dmg *= 1.2;

          fireProj(bird.x, bird.y, target.x, target.y, dmg, 'bird', '#a0e060');
          bird.flashTimer  = 0.12;
          bird.atkCooldown = (1.0 / (sp.atkRate * atkMult)) + Math.random() * 0.25;
        } else {
          bird.atkCooldown = 0.4;
        }
      }

      bird.flashTimer = Math.max(0, bird.flashTimer - dt);
    });

  // Clear stale focus target
  if (state.focusTarget && !state.focusTarget.alive) {
    state.focusTarget = null;
  }
}

// ════════════════════════════════════════════════
// UPDATE — ENEMIES
// ════════════════════════════════════════════════

function updateEnemies(dt) {
  const alive = state.birds.filter(b => b.alive);

  state.enemies.forEach(e => {
    if (!e.alive) return;

    if (e.type === 'turret') {
      e.y += e.vy * dt * 60;

      e.atkCooldown -= dt;
      if (e.atkCooldown <= 0 && alive.length > 0) {
        const target = alive[Math.floor(Math.random() * alive.length)];
        fireProj(e.x, e.y, target.x, target.y, 14, 'enemy', '#cc3030');
        e.atkCooldown = 2.2 + Math.random() * 1.5;
      }

    } else if (e.type === 'drone') {
      if (alive.length > 0) {
        const target = alive.reduce((best, b) =>
          dist(e.x, e.y, b.x, b.y) < dist(e.x, e.y, best.x, best.y) ? b : best
        );
        const d = dist(e.x, e.y, target.x, target.y);
        const spd = 1.8 * dt * 60;
        if (d > 4) {
          e.x += (target.x - e.x) / d * spd;
          e.y += (target.y - e.y) / d * spd;
        }
        e.atkCooldown -= dt;
        if (e.atkCooldown <= 0 && d < 75) {
          fireProj(e.x, e.y, target.x, target.y, 9, 'enemy', '#cc7030');
          e.atkCooldown = 1.1 + Math.random() * 0.8;
        } else if (e.atkCooldown <= 0) {
          e.atkCooldown = 0.25;
        }
      } else {
        e.y += 1.4 * dt * 60;
      }

    } else if (e.type === 'sparrow') {
      // Pursues flock leader
      const leader = alive.find(b => b.formationSlot === 0) || alive[0];
      if (leader) {
        const d = dist(e.x, e.y, leader.x, leader.y);
        const spd = 1.5 * dt * 60;
        if (d > 4) {
          e.x += (leader.x - e.x) / d * spd;
          e.y += (leader.y - e.y) / d * spd;
        }
        e.atkCooldown -= dt;
        if (e.atkCooldown <= 0 && d < 90) {
          fireProj(e.x, e.y, leader.x, leader.y, 18, 'enemy', '#cc3070');
          e.atkCooldown = 1.7 + Math.random() * 0.8;
        } else if (e.atkCooldown <= 0) {
          e.atkCooldown = 0.3;
        }
      } else {
        e.y += 0.9 * dt * 60;
      }
    }

    e.flashTimer = Math.max(0, (e.flashTimer || 0) - dt);
    if (e.y > H + 80) e.alive = false;
  });

  state.enemies = state.enemies.filter(e => e.alive);
}

// ════════════════════════════════════════════════
// UPDATE — PROJECTILES
// ════════════════════════════════════════════════

function updateProjectiles(dt) {
  state.projectiles.forEach(p => {
    if (!p.alive) return;
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
      p.alive = false;
      return;
    }

    if (p.owner === 'bird') {
      for (const e of state.enemies) {
        if (!e.alive) continue;
        if (dist(p.x, p.y, e.x, e.y) < ENEMY_R + PROJ_R) {
          e.hp -= p.dmg;
          e.flashTimer = 0.1;
          p.alive = false;
          if (e.hp <= 0) {
            e.alive = false;
            state.kills++;
            state.score += 100;
          }
          break;
        }
      }
    } else {
      for (const b of state.birds) {
        if (!b.alive) continue;
        if (dist(p.x, p.y, b.x, b.y) < BIRD_R + PROJ_R) {
          let dmg = p.dmg;
          if (state.stance === 'evasive')    dmg *= 0.78;
          if (state.stance === 'aggressive') dmg *= 1.2;

          // Angry Honker aura absorbs some damage for nearby allies
          const honker = state.birds.find(hk =>
            hk.alive && hk !== b && hk.species === 'angry_honker' &&
            dist(hk.x, hk.y, b.x, b.y) < 85
          );
          if (honker) dmg *= 0.72;

          b.hp -= dmg;
          b.flashTimer = 0.2;
          p.alive = false;

          if (b.hp <= 0) {
            b.hp = 0;
            b.alive = false;
            b.deathTime = state.runTime;
            state.lostBirds.push({
              name:    b.name,
              species: b.species,
              time:    state.runTime,
            });
          }
          break;
        }
      }
    }
  });

  state.projectiles = state.projectiles.filter(p => p.alive);
}

// ════════════════════════════════════════════════
// UPDATE — SPAWNER
// ════════════════════════════════════════════════

function updateSpawner() {
  while (
    state.nextSpawnIdx < state.spawnSchedule.length &&
    state.runTime >= state.spawnSchedule[state.nextSpawnIdx].time
  ) {
    spawnEnemy(state.spawnSchedule[state.nextSpawnIdx].type);
    state.nextSpawnIdx++;
  }
}

// ════════════════════════════════════════════════
// MAIN UPDATE
// ════════════════════════════════════════════════

function update(dt) {
  state.runTime += dt;
  state.bgOffset = (state.bgOffset + dt * 55) % 60;

  // Sim tick: call card evaluation
  state.simTimer += dt;
  if (state.simTimer >= SIM_TICK) {
    state.simTimer = 0;
    evaluateCallCards();
  }

  // Stamina slow recovery (passive)
  state.birds.forEach(b => {
    if (b.alive) b.stamina = Math.min(100, b.stamina + 0.3 * dt);
  });

  // Reorganization countdown
  if (state.isReorganizing) {
    state.reorgTimer -= dt;
    if (state.reorgTimer <= 0) state.isReorganizing = false;
  }

  // Per-frame decrements
  state.cardFlash     = state.cardFlash.map(f => Math.max(0, f - dt));
  state.cardCooldowns = state.cardCooldowns.map(c => Math.max(0, c - dt));

  updateFormationTargets();
  updateSpawner();
  updateBirds(dt);
  updateEnemies(dt);
  updateProjectiles(dt);

  state.score += 8 * dt; // survival points

  updateHUD();

  // Run-end checks
  const allDead = state.birds.every(b => !b.alive);
  const timeUp  = state.runTime >= RUN_DURATION;

  if (allDead || timeUp) {
    if (timeUp) {
      state.runSuccess = true;
      const survivors = state.birds.filter(b => b.alive).length;
      state.score += survivors * 200;
    }
    state.score = Math.round(state.score);
    running = false; // stops the loop after this tick
    setTimeout(showDebrief, 500);
  }
}

// ════════════════════════════════════════════════
// RENDERER
// ════════════════════════════════════════════════

let canvas, ctx;

function render() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawProjectiles();
  drawEnemies();
  drawBirds();
  if (state.isReorganizing) drawReorgOverlay();
}

function drawBackground() {
  // Dark base
  ctx.fillStyle = '#0a1008';
  ctx.fillRect(0, 0, W, H);

  // Scrolling solar panel grid
  const gW = 90, gH = 60;
  const offY = state.bgOffset % gH;

  for (let gx = 0; gx < W; gx += gW) {
    for (let gy = -gH + offY; gy < H + gH; gy += gH) {
      const tileX = gx + 4;
      const tileY = gy + 4;
      const tileW = gW - 8;
      const tileH = gH - 8;

      // Panel body
      ctx.fillStyle = '#0f1a0b';
      ctx.fillRect(tileX, tileY, tileW, tileH);

      // Panel grid lines
      ctx.strokeStyle = '#182810';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(tileX, tileY, tileW, tileH);
      ctx.beginPath();
      ctx.moveTo(tileX + tileW / 2, tileY);
      ctx.lineTo(tileX + tileW / 2, tileY + tileH);
      ctx.moveTo(tileX, tileY + tileH / 2);
      ctx.lineTo(tileX + tileW, tileY + tileH / 2);
      ctx.stroke();

      // Amber solar glow on some tiles
      const tileRow = Math.floor((gy - offY + gH) / gH);
      const tileCol = Math.floor(gx / gW);
      if ((tileRow * 3 + tileCol) % 5 === 0) {
        ctx.fillStyle = 'rgba(170, 90, 8, 0.20)';
        ctx.beginPath();
        ctx.arc(tileX + tileW / 2, tileY + tileH / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.50)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

function drawBirds() {
  state.birds.forEach(bird => {
    if (!bird.alive) return;
    const sp = SPECIES[bird.species];
    const isLeader = bird.formationSlot === 0;

    // Slipstream trail
    if (state.formation === 'flying_v' && !isLeader) {
      ctx.strokeStyle = 'rgba(64, 140, 200, 0.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bird.x, bird.y + BIRD_R);
      ctx.lineTo(bird.x, bird.y + BIRD_R + 16);
      ctx.stroke();
    }

    // Attack flash glow
    if (bird.flashTimer > 0) {
      const a = (bird.flashTimer / 0.12) * 0.45;
      ctx.fillStyle = `rgba(160, 230, 80, ${a})`;
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, BIRD_R + 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Leader ring
    if (isLeader) {
      ctx.strokeStyle = '#f0d070';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, BIRD_R + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Bird body
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, BIRD_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Initials
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sp.init, bird.x, bird.y);

    // HP bar
    const bW = 24, bH = 3;
    const bx = bird.x - bW / 2;
    const by = bird.y + BIRD_R + 4;
    const hpF = bird.hp / bird.maxHp;
    ctx.fillStyle = '#111a0a';
    ctx.fillRect(bx, by, bW, bH);
    ctx.fillStyle = hpF > 0.5 ? '#50cc40' : hpF > 0.25 ? '#d4860a' : '#cc3030';
    ctx.fillRect(bx, by, bW * hpF, bH);
  });
}

function drawEnemies() {
  state.enemies.forEach(e => {
    if (!e.alive) return;

    // Hit flash
    if (e.flashTimer > 0) {
      const a = (e.flashTimer / 0.1) * 0.55;
      ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, ENEMY_R + 7, 0, Math.PI * 2);
      ctx.fill();
    }

    if (e.type === 'turret') {
      const r = ENEMY_R;
      ctx.fillStyle = '#4a1010';
      ctx.fillRect(e.x - r, e.y - r, r * 2, r * 2);
      ctx.strokeStyle = '#cc3030';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(e.x - r, e.y - r, r * 2, r * 2);
      // Gun barrel
      ctx.strokeStyle = '#cc3030';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x, e.y + r + 10);
      ctx.stroke();
      ctx.lineCap = 'butt';

    } else if (e.type === 'drone') {
      const r = ENEMY_R - 2;
      ctx.fillStyle = '#0d3535';
      ctx.beginPath();
      ctx.moveTo(e.x,     e.y - r);
      ctx.lineTo(e.x + r, e.y);
      ctx.lineTo(e.x,     e.y + r);
      ctx.lineTo(e.x - r, e.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#40c0b0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

    } else if (e.type === 'sparrow') {
      // Triangle pointing down (toward flock)
      const r = ENEMY_R;
      ctx.fillStyle = '#3a1808';
      ctx.beginPath();
      ctx.moveTo(e.x,     e.y + r);
      ctx.lineTo(e.x - r, e.y - r * 0.7);
      ctx.lineTo(e.x + r, e.y - r * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e07030';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // HP bar
    const bW = 22, bH = 2;
    const bx = e.x - bW / 2;
    const by = e.y - ENEMY_R - 7;
    const hpF = e.hp / e.maxHp;
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(bx, by, bW, bH);
    ctx.fillStyle = '#cc3030';
    ctx.fillRect(bx, by, bW * hpF, bH);
  });
}

function drawProjectiles() {
  state.projectiles.forEach(p => {
    if (!p.alive) return;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 5;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PROJ_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawReorgOverlay() {
  ctx.fillStyle = 'rgba(64, 130, 200, 0.06)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(64, 140, 210, 0.65)';
  ctx.font = '11px Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('REFORMING...', W / 2, 50);
}

// ════════════════════════════════════════════════
// HUD UPDATES
// ════════════════════════════════════════════════

function updateHUD() {
  const scoreEl = document.getElementById('hud-score');
  if (scoreEl) scoreEl.textContent = 'SCORE: ' + Math.round(state.score).toString().padStart(6, '0');

  const timerEl = document.getElementById('hud-timer');
  if (timerEl) {
    const rem  = Math.max(0, RUN_DURATION - state.runTime);
    const mins = Math.floor(rem / 60);
    const secs = Math.floor(rem % 60).toString().padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;
  }

  const alive = state.birds.filter(b => b.alive);
  const totHp = alive.reduce((s, b) => s + b.hp, 0);
  const maxHp = state.birds.reduce((s, b) => s + b.maxHp, 0);
  const hpPct = maxHp > 0 ? totHp / maxHp : 0;

  const bar = document.getElementById('hud-hp-bar');
  if (bar) {
    bar.style.width = (hpPct * 100).toFixed(1) + '%';
    bar.className   = 'hud-bar hp-bar' + (hpPct < 0.25 ? ' critical' : hpPct < 0.5 ? ' low' : '');
  }

  const birdCountEl = document.getElementById('hud-bird-count');
  if (birdCountEl) birdCountEl.textContent = `${alive.length}/${state.birds.length} BIRDS`;

  const stanceEl = document.getElementById('hud-stance');
  if (stanceEl) {
    stanceEl.textContent = state.stance.toUpperCase();
    stanceEl.style.color = state.stance === 'aggressive' ? '#e06030'
                         : state.stance === 'evasive'    ? '#40c0a0'
                         : '#607040';
  }

  const killsEl = document.getElementById('hud-kills');
  if (killsEl) killsEl.textContent = `${state.kills} KILLS`;

  // Card flash indicators
  state.cardFlash.forEach((f, i) => {
    const el = document.getElementById(`card-ind-${i}`);
    if (el) el.classList.toggle('triggered', f > 0);
  });
}

// ════════════════════════════════════════════════
// HUB UI
// ════════════════════════════════════════════════

const FORMATION_DESCS = {
  flying_v:    'Classic wedge. Slipstream bonus for trailing birds. Leader tires faster. Weak to flanking.',
  loose_swarm: 'No fixed positions. High individual evasion. Difficult to AoE. No slipstream bonuses — calls execute less predictably.',
};

const COND_LABELS = {
  none:          '— condition —',
  flock_hp_70:   'flock HP < 70%',
  flock_hp_50:   'flock HP < 50%',
  flock_hp_30:   'flock HP < 30%',
  enemy_drone:   'drone sighted',
  enemy_sparrow: 'rival sparrow sighted',
  enemy_turret:  'turret sighted',
  birds_6:       'birds remaining < 6',
  birds_4:       'birds remaining < 4',
  stamina_50:    'avg stamina < 50%',
  stamina_30:    'avg stamina < 30%',
  always:        'always',
};

const ACT_LABELS = {
  none:          '— action —',
  loose_swarm:   '→ switch to Loose Swarm',
  flying_v:      '→ switch to Flying V',
  aggressive:    '→ aggressive stance',
  evasive:       '→ evasive stance',
  normal_stance: '→ normal stance',
  focus_fire:    '→ focus fire nearest',
  rotate_leader: '→ rotate leader',
};

function buildHubUI() {
  buildRosterList();
  buildCallCardSlots();

  document.querySelectorAll('.formation-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.formation-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('formation-desc').textContent = FORMATION_DESCS[btn.dataset.formation] || '';
    });
  });

  document.getElementById('launch-btn')?.addEventListener('click', startRun);
  document.getElementById('retry-btn')?.addEventListener('click', retryRun);
  document.getElementById('hub-btn')?.addEventListener('click', () => showScreen('hub'));
}

function buildRosterList() {
  const container = document.getElementById('roster-list');
  if (!container) return;
  container.innerHTML = '';

  const birds = buildStarterFlock();
  birds.forEach(bird => {
    const sp   = SPECIES[bird.species];
    const card = document.createElement('div');
    card.className = 'bird-card';
    card.innerHTML = `
      <div class="bird-badge" style="background:${sp.color}20; border-color:${sp.color}55;">
        <span style="color:${sp.color};">${sp.init}</span>
      </div>
      <div class="bird-info">
        <div class="bird-name">${bird.name}</div>
        <div class="bird-species">${sp.label}${bird.trait ? ' · ' + bird.trait : ''}</div>
      </div>
      <span class="bird-role" style="color:${sp.color}; border-color:${sp.color}55;">${sp.role}</span>
      <div class="bird-stats">
        <span>HP ${sp.hp}</span>
        <span>DMG ${sp.dmg}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function buildCallCardSlots() {
  const container = document.getElementById('call-card-slots');
  if (!container) return;

  const defaults = [
    { cond: 'flock_hp_50', act: 'loose_swarm' },
    { cond: 'enemy_drone', act: 'aggressive'  },
    { cond: 'birds_4',     act: 'evasive'     },
  ];

  container.innerHTML = '';
  defaults.forEach((def, i) => {
    const div = document.createElement('div');
    div.className = 'call-card';

    const condOpts = Object.entries(COND_LABELS).map(([v, l]) =>
      `<option value="${v}"${v === def.cond ? ' selected' : ''}>${l}</option>`
    ).join('');

    const actOpts = Object.entries(ACT_LABELS).map(([v, l]) =>
      `<option value="${v}"${v === def.act ? ' selected' : ''}>${l}</option>`
    ).join('');

    div.innerHTML = `
      <div class="card-slot-num">${i + 1}</div>
      <span class="card-keyword">IF</span>
      <select class="card-select" id="card-cond-${i}">${condOpts}</select>
      <span class="card-keyword">THEN</span>
      <select class="card-select" id="card-act-${i}">${actOpts}</select>
    `;
    container.appendChild(div);
  });
}

// ════════════════════════════════════════════════
// CARD INDICATOR LABELS (battle HUD)
// ════════════════════════════════════════════════

const COND_SHORT = {
  none: 'OFF', flock_hp_70: 'HP<70', flock_hp_50: 'HP<50', flock_hp_30: 'HP<30',
  enemy_drone: 'DRONE', enemy_sparrow: 'SPARROW', enemy_turret: 'TURRET',
  birds_6: 'BIRDS<6', birds_4: 'BIRDS<4', stamina_50: 'STAM<50', stamina_30: 'STAM<30',
  always: 'ALWAYS',
};

const ACT_SHORT = {
  none: '--', loose_swarm: '→SWARM', flying_v: '→V', aggressive: '→AGG',
  evasive: '→EVA', normal_stance: '→NRM', focus_fire: '→FOCUS', rotate_leader: '→ROT',
};

function updateCardIndicators() {
  state.callCards.forEach((card, i) => {
    const el = document.getElementById(`card-ind-${i}`);
    if (!el) return;
    const c = COND_SHORT[card.condition] || '?';
    const a = ACT_SHORT[card.action] || '?';
    el.querySelector('.card-ind-label').textContent = `${c} ${a}`;
  });
}

// ════════════════════════════════════════════════
// SCREEN MANAGEMENT
// ════════════════════════════════════════════════

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`)?.classList.add('active');
  state.screen = name;
}

// ════════════════════════════════════════════════
// RUN MANAGEMENT
// ════════════════════════════════════════════════

let animId  = null;
let lastTS  = 0;
let running = false;

function gameLoop(ts) {
  if (!running) return;
  const dt = Math.min((ts - lastTS) / 1000, 0.05);
  lastTS = ts;
  update(dt);
  render();
  animId = requestAnimationFrame(gameLoop);
}

function launchBattle() {
  running = false;
  if (animId) cancelAnimationFrame(animId);
  updateFormationTargets();
  updateCardIndicators();
  showScreen('battle');
  lastTS  = performance.now();
  running = true;
  animId  = requestAnimationFrame(gameLoop);
}

function startRun() {
  const formBtn = document.querySelector('.formation-btn.active');
  const formation = formBtn ? formBtn.dataset.formation : 'flying_v';
  initState(false, false);
  state.formation = formation;
  readCallCards();
  launchBattle();
}

function retryRun() {
  initState(true, true);
  launchBattle();
}

// ════════════════════════════════════════════════
// DEBRIEF
// ════════════════════════════════════════════════

function showDebrief() {
  running = false;
  if (animId) { cancelAnimationFrame(animId); animId = null; }

  const survivors = state.birds.filter(b => b.alive);
  const xp    = Math.round(state.score / 100);
  const scrap = state.kills * 10 + survivors.length * 20;

  const titleEl = document.getElementById('debrief-outcome');
  if (titleEl) {
    titleEl.textContent  = state.runSuccess ? 'RUN COMPLETE' : 'FLOCK DEFEATED';
    titleEl.className    = 'debrief-title' + (state.runSuccess ? '' : ' failure');
  }

  const scoreEl = document.getElementById('debrief-score');
  if (scoreEl) scoreEl.textContent = Math.round(state.score).toString();

  const statsEl = document.getElementById('debrief-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-box">
        <div class="stat-val">${state.kills}</div>
        <div class="stat-name">ENEMIES KILLED</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${survivors.length}/${state.birds.length}</div>
        <div class="stat-name">BIRDS SURVIVING</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${xp}</div>
        <div class="stat-name">COMMANDER XP</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${scrap}</div>
        <div class="stat-name">SCRAP EARNED</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${Math.round(state.runTime)}s</div>
        <div class="stat-name">TIME SURVIVED</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${state.stance.toUpperCase()}</div>
        <div class="stat-name">FINAL STANCE</div>
      </div>
    `;
  }

  // Key event callout
  const eventsEl = document.getElementById('debrief-events');
  if (eventsEl) {
    const lines = buildEventLines();
    eventsEl.innerHTML = `<h3>KEY EVENTS</h3>${lines}`;
  }

  // Birds lost
  const birdsEl = document.getElementById('debrief-birds');
  if (birdsEl) {
    if (state.lostBirds.length === 0) {
      birdsEl.innerHTML = '<p class="survivors-note">PERFECT RUN — No birds lost.</p>';
    } else {
      const lostItems = state.lostBirds.map(b => {
        const sp   = SPECIES[b.species];
        const mins = Math.floor(b.time / 60);
        const secs = Math.floor(b.time % 60).toString().padStart(2, '0');
        return `
          <div class="lost-bird">
            <div class="lost-bird-dot" style="background:${sp.color}44; border-color:${sp.color}88;"></div>
            <span class="lost-bird-name">${b.name} <span style="color:${sp.color};">(${sp.label})</span></span>
            <span class="lost-bird-time">${mins}:${secs}</span>
          </div>`;
      }).join('');

      const survivorLine = survivors.length > 0
        ? `<p class="survivors-note">SURVIVED: ${survivors.map(b => b.name).join(', ')}</p>`
        : '';

      birdsEl.innerHTML = `<h3>BIRDS LOST (${state.lostBirds.length})</h3>${lostItems}${survivorLine}`;
    }
  }

  showScreen('debrief');
}

function buildEventLines() {
  const lines = [];

  if (state.lostBirds.length === 0) {
    lines.push(`<div class="event-line"><span class="hi">No casualties.</span> The flock held together.</div>`);
  } else {
    const first = state.lostBirds[0];
    const sp    = SPECIES[first.species];
    const mins  = Math.floor(first.time / 60);
    const secs  = Math.floor(first.time % 60).toString().padStart(2, '0');
    lines.push(
      `<div class="event-line">First loss: <span class="warn">${first.name}</span> (${sp.role}) fell at <span class="hi">${mins}:${secs}</span>.</div>`
    );
  }

  // Anchor status
  const gerald = state.birds.find(b => b.species === 'angry_honker');
  if (gerald && !gerald.alive) {
    lines.push(
      `<div class="event-line"><span class="danger">Anchor lost:</span> Losing Gerald destabilized nearby birds. Consider a rotation call card.</div>`
    );
  }

  // Stance feedback
  if (state.stance === 'aggressive') {
    lines.push(`<div class="event-line">Run ended in <span class="warn">aggressive stance</span> — higher damage, but the flock took more hits.</div>`);
  } else if (state.stance === 'evasive') {
    lines.push(`<div class="event-line">Run ended in <span class="hi">evasive stance</span> — reduced incoming damage, lower kill rate.</div>`);
  }

  if (state.kills >= 20) {
    lines.push(`<div class="event-line"><span class="hi">${state.kills} kills</span> — strong offensive output this run.</div>`);
  } else if (state.kills < 8) {
    lines.push(`<div class="event-line">Only <span class="warn">${state.kills} kills</span>. Try adding a Focus Fire or Aggressive Stance call card.</div>`);
  }

  if (lines.length === 0) lines.push('<div class="event-line">Run complete.</div>');
  return lines.join('');
}

// ════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════

function init() {
  canvas = document.getElementById('game-canvas');
  ctx    = canvas.getContext('2d');

  initState(false, false);
  buildHubUI();
  showScreen('hub');
}

document.addEventListener('DOMContentLoaded', init);

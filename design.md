## Assault Flock – Design Notes (Draft)

### 1. High-level concept

- **Core pitch**: Real-time “auto-battler” flock tactics game where the player pre-programs a flock of birds (roster, formation, and reactive “calls”) and then releases them into combat scenarios with no mid-battle input.
- **Player fantasy**: You are a flock commander/handler designing battle plans, not a twitch shooter. Victory comes from preparation, configuration, and understanding systems rather than execution speed.
- **Core loop**:
  - Configure flock: choose birds, set formations, assign and tune calls.
  - Run mission: watch the battle play out with zero direct control.
  - Analyze results: identify failure points and successful behaviors.
  - Upgrade and refine: improve birds, formations, and calls; retry harder missions.
- **Project structure**: Assault Flock lives under the `shoot/Assault Flock` folder.

---

### 1.1 Combat presentation & shooter lineage

- **Top-down shooter feel**
  - Once launched, the flock and enemies are presented in a **top-down, scrolling shooter style**, inspired by games like Ikaruga and Galaga.
  - The camera and encounter pacing should evoke classic arcade shoot-’em-ups, with dense projectile patterns, enemy waves, and distinct boss setpieces.

- **Flock behavior during levels**
  - The flock behaves as an **autonomous “ship”** composed of many birds, following its preconfigured formations and calls.
  - The player has **no direct control** once the mission starts; they cannot move the flock manually or fire weapons themselves.
  - All behavior (movement, targeting, evasive maneuvers, bombing runs, etc.) emerges from:
    - Formation definitions.
    - Calls and rotation rules.
    - Individual bird traits and roles.

- **Targets and enemy examples**
  - **Ground targets**: the flock attacks ground locations primarily via **bombing runs** and dive attacks.
  - **Air targets**: enemy flocks and aerial threats such as “Defense Hawks”, “Ballistic Penguins”, drones, and other sky enemies.
  - **Boss encounters**: end-of-level bosses designed around recognizable patterns and weak points that specifically challenge formation/call setups rather than reaction time.

---

### 2. Flock & birds (units)

- **Species & archetypes**
  - Different bird species as archetypes: hawks (divers/strikers), crows (opportunists), owls (stealth/ambush), geese (tanks/support), gulls (medics/harassers), etc.
  - Each species has base stats: speed, toughness, agility, awareness, aggression, stamina.

- **Roles**
  - **Strikers**: High damage, fragile, ideal for dive attacks and priority target deletion.
  - **Screens / Interceptors**: Outer layers; peel off threats, intercept projectiles or fast enemies.
  - **Anchors**: Central birds that provide buffs/aura effects; losing them destabilizes the flock.
  - **Specialists**: Debuffers, scouts, decoys, healers, disruption roles.

- **Personality traits**
  - Birds can have traits (positive and negative) that affect behavior and how they interpret calls:
    - Examples: reckless, cautious, protective, vengeful, enduring, “hates drones”, “hates the front”.
  - Traits interact with formations and calls (e.g., reckless bird might over-commit even when a call suggests retreat).

- **Progression & persistence**
  - Birds level up and gain perks, traits, and sometimes quirks.
  - Consider:
    - Injuries vs permadeath vs temporary morale penalties.
    - A “Hall of Feathers” memorial for lost aces to increase attachment.

---

### 3. Formations

- **Formation templates**
  - Basic shapes: wedge/V, line, double line, sphere, rotating ring, layered columns, loose swarm cloud.
  - Player can assign roles to specific rings/lanes of a formation (front, mid, rear, flanks, core).

- **Parameters**
  - **Spacing**: compact vs loose.
    - Compact: stronger auras, better mutual support, more vulnerable to AoE.
    - Loose: safer versus AoE, weaker buffs, more scattered responses.
  - **Directional bias**:
    - Forward-focused vs 360° coverage.
    - Some formations are optimized for frontal assaults; others for defense or escort.
  - **Sub-flocks**:
    - Formations can have detachable “mini-wings” that act semi-independently based on calls.

- **Formation changes during battle**
  - Formations can shift in response to calls:
    - Example: “On missile volley → tighten shield wall”, “On heavy losses → disperse into cloud”.
  - Tradeoff: each formation change has a reorganization time where the flock is temporarily vulnerable or less effective.

---

### 4. Formation physics & rotation (inspired by real birds)

- **Real-world inspiration**
  - Flying V and similar formations provide slipstream/reduced drag benefits to birds in trailing positions.
  - The front bird works hardest, tires faster, and real flocks rotate leadership to share the load.

- **Core mechanics**
  - **Slipstream / drag reduction**:
    - Certain formations (e.g., V, line, echelon) grant reduced stamina drain and small speed or maneuverability bonuses to birds in specific trailing positions.
    - The front/lead position(s) suffer increased stamina drain and possibly higher exposure to incoming fire.
  - **Stamina / fatigue**:
    - Each bird has a stamina value; as stamina depletes, speed and agility decrease.
    - Over-fatigued leaders may drop out of position, causing temporary formation wobble or gaps.

- **Rotation rules**
  - **Automatic rotation**:
    - Formations have default logic to rotate the front bird when its stamina or HP falls below a threshold.
    - Rotation selects a suitable replacement from trailing birds and reorganizes positions.
  - **Call-driven rotation**:
    - Calls can override or refine rotation rules:
      - Example: “When front leader HP < 50% OR stamina < 30% → rotate with healthiest rear bird.”
      - Example: “In escape mode, rotate leaders more frequently to maintain maximum speed.”
  - **Risk–reward options**:
    - Aggressive: rotate less frequently → stable directionality and speed at the cost of burning out leaders.
    - Defensive: rotate often → safer for leaders but introduces more disruption during swaps.

- **Traits & leader suitability**
  - Certain traits make better leaders (e.g., “Enduring”, “Steady Wing”) by reducing front-position penalties.
  - Negative traits like “Hates the Front” can create stress, morale issues, or mispositioning if a bird is forced to lead too long.
  - Calls or setup can assign preferred leaders per formation (e.g., prioritize geese as V-formation leaders).

- **Feedback / UX**
  - Visual hints for slipstream (subtle airflow lines behind leading birds).
  - UI indicators showing the current leader and next-in-rotation within the formation editor.
  - Replays highlight key rotation events, especially ones that averted collapse (e.g., timely leader swap before being shot down).

---

### 5. Calls – automation & “macro” system

- **Concept**
  - Calls are player-authored automation scripts/macros that define how the flock reacts to events during a mission.
  - Once the level begins, the player has **no direct input**; calls are effectively the “code” the flock runs.

- **Call structure**
  - **Triggers** – “When X happens”:
    - Time-based: elapsed mission time, phase transitions, countdowns.
    - Event-based: bird HP thresholds, enemy type sighted, ally downed, projectile volley detected, morale drops.
    - Spatial: entering/exiting zones, being flanked, proximity to objectives or hazards.
  - **Conditions / filters**:
    - Which birds: by role (striker, screen, anchor, specialist), species, traits, health/stamina status.
    - Situation checks: local enemy density, incoming fire level, current formation, morale, altitude.
  - **Actions**:
    - Movement: change formation, surge forward, retreat, orbit or hold a position, detach sub-flocks.
    - Targeting: prioritize enemies with specific tags (turrets, drones, bosses), focus-fire, spread targeting.
    - Stance: aggressive, defensive, evasive, sacrificial (protect anchors at all costs).
    - Abilities: trigger species or role-specific abilities (screech, decoy dives, shield flares, healing bursts).

- **Complexity over progression**
  - Early: simple if–then calls (“If HP < 30% → evasive stance”).
  - Mid: chained calls with priorities, cooldowns, and mutual exclusion.
  - Late: nested conditions and multi-step routines:
    - Example: “If shield drone is destroyed AND missile battery is alive → detach intercept wing to destroy battery → then regroup on left flank.”

- **UI / editing**
  - Visual node-based or block-based editor to make calls approachable.
  - Library of prebuilt “call blueprints” (e.g., “Protect the Core”, “Berserk Push”, “Last Stand Disperse”).
  - Calls can be assigned globally, per formation, or per specific birds.

---

### 6. Missions & combat situations

- **Mission types**
  - **Escort**: Protect a slow-moving ally/object (e.g., airship, convoy) through hostile airspace.
  - **Assault**: Destroy enemy emplacements, nests, or boss targets.
  - **Defense**: Hold a zone or asset against waves of enemies.
  - **Heist/Raid**: Dive into dense defenses to grab items and escape.
  - **Recon**: Survive for a set time while gathering intel and avoiding overwhelming threats.

- **Environment & hazards**
  - Static: anti-air guns, flamethrowers, nets, minefields, sensor towers, pollution/toxin clouds.
  - Dynamic: moving trains, ships, mechs, balloons, airships, environmental storms, updrafts, turbulence.

- **Enemies**
  - Automated defenses with predictable arcs vs smart tracking systems.
  - Enemy flocks (other bird factions, drones) that may appear to run their own “call systems.”
  - Bosses with patterns that stress-test formation and calls (beam sweeps, AoE blasts, lure decoys).

- **Designing enemies/bosses for calls**
  - Enemies and bosses should be built around **clear, readable patterns and telegraphs** so that players can reliably hook calls into them (e.g., “when boss charges beam → spread formation”).
  - Attacks and behaviors should expose **distinct, taggable states** the call system can see:
    - Examples: “charging”, “exposed core”, “shielded”, “airborne only”, “grounded only”, “spawning adds”.
  - Encounters should feature **deliberate windows** where a well-timed call produces big payoffs:
    - Example: a boss opens ground vents for a short time; bombing-focused calls that trigger on this event deal massive damage.
  - Different enemy types should **reward or punish specific macro styles**:
    - Wave enemies that punish always-clumped formations.
    - Snipers that punish slow rotation or poor evasive calls.
    - Swarms that reward preplanned focus-fire or area denial calls.
  - Some advanced enemies can act as **“call puzzles”**:
    - Player must discover and script the right combination/order of calls to safely navigate phases.
    - Boss phases escalate in a way that stresses different parts of the player’s call setup (movement logic, targeting logic, rotation rules, morale responses).

---

### 7. Progression & meta-game

- **Unlocks**
  - New species and elite variants of birds.
  - Additional call slots, new trigger/condition/action types, new logical constructs.
  - Advanced formations and formation presets; extra formation loadout slots.
  - Research trees that expand the “logic vocabulary” of calls (e.g., sustained conditions, priority weighting).

- **Economy**
  - Rewards: feathers, scrap, tech, prestige, etc.
  - Spending: bird training, equipment, injuries rehab, call upgrades, trait rerolls, unlocking new formation templates.

- **Difficulty ramp**
  - Introduce enemies and hazards that punish specific poor setups:
    - Over-clustering punished by AoE.
    - Over-frontal bias punished by flanking threats.
  - Higher difficulties require sophisticated interaction between formations, rotation rules, and calls.

---

### 8. Player experience flow

- **Before mission – Aviary HQ**
  - Roster management: choose which birds fly.
  - Formation setup: select formation templates, assign birds to positions/roles, define rotation preferences.
  - Call authoring: create/tune calls and assign them appropriately.
  - Optional test range: fast simulations against simplified scenarios to iterate quickly.

- **During mission**
  - No direct control: player watches and learns.
  - Limited overlays: threat lines, target priorities, call triggers lighting up when they fire.
  - Possible control over camera and time (pause, slow-mo, fast-forward).

- **After mission – Debrief**
  - Timeline of key events linked to calls and formation changes:
    - Example: “At 0:32, Call X triggered rotation; at 0:37, Call Y initiated evasive spread.”
  - Suggestions or heuristics:
    - “Anchors frequently died to flak at ~30s; consider an early disperse or shield call.”
  - Bird outcomes: level-ups, injuries, deaths, new traits.

---

### 9. Systems to explore further

- **Morale and psychology**
  - Flock-wide morale that can break if leaders/anchors fall.
  - Morale impacts responsiveness to calls, formation stability, and aggression.
  - Calls or formations designed to stabilize or weaponize morale swings (e.g., berserk mode on morale collapse).

- **Synergy and combos**
  - Species combos that synergize (e.g., one species debuffs armor, another capitalizes on it).
  - Calls that chain: one bird’s screech triggers nearby birds to dive, etc.

- **Permadeath vs recovery**
  - Tension between attachment to long-lived birds and the need to risk them on hard missions.
  - Systems for retirement, memorialization, or legacy bonuses from fallen aces.

---

### 10. Vertical slice thoughts (very rough)

- **Minimum to prove the concept**
  - 2–3 bird archetypes with distinct roles.
  - 1–2 basic enemy types + 1 simple boss.
  - 3–5 formations (including at least one with slipstream/rotation).
  - A small set of calls that demonstrate triggers, conditions, and actions (including a rotation-focused call).
  - 1–2 short missions designed to encourage iterating on flock setup and calls.

These notes are intentionally rough and idea-focused; future passes can tighten scope, solidify numbers, and decide on exact systems for stamina, morale, injuries, and call complexity.

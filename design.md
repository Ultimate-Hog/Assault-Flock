## Assault Flock – Design Document

### 1. High-level concept

- **Core pitch**: Roguelite auto-battler flock tactics game. The player pre-programs a flock of birds — roster, formation, and reactive "call cards" — then launches them into a top-down scrolling shooter mission with zero mid-battle input. Runs are short (under 3 minutes), designed to be replayed dozens of times as the player iterates on loadouts and unlocks deeper systems.
- **Player fantasy**: You are a flock commander designing battle plans, not a twitch pilot. Victory comes from preparation, configuration, and understanding systems — never from execution speed.
- **Target audience**: Broad appeal. Easy to pick up (starter loadout works out of the box), with opt-in complexity for players who want to build intricate call card logic and min-max formations. Accessible enough for casual strategy fans; deep enough for Into the Breach / Slay the Spire enthusiasts.
- **Core loop**:
  1. Configure flock: choose birds, set formation, slot call cards.
  2. Launch run: watch the battle scroll by with zero direct control.
  3. Evaluate results: score screen, birds lost, loot earned.
  4. Iterate: retry instantly with the same loadout, or return to the hub to recruit, upgrade, and rethink.
- **Platform**: Web-first (browser). Planned migration path to mobile (iOS/Android) and Steam.
- **Business model**: Early Access leading to a Premium (one-time purchase) release. No microtransactions.
- **Multiplayer**: Single-player only.
- **Project structure**: Assault Flock lives under the `shoot/Assault Flock` folder.

---

### 2. Art, audio & tone

- **Visual identity: pixel art — retro / techno / solarpunk**
  - The art direction fuses retro pixel art with a solarpunk post-apocalyptic aesthetic. Think overgrown solar arrays, vine-wrapped wind turbines, rusted monorails reclaimed by moss — all rendered in chunky, readable pixel art.
  - This is **not** synthwave. Avoid neon grids, hot pink/cyan palettes, and 80s pop culture pastiche. The "retro" influence is structural (pixel density, animation style, shmup camera) rather than chromatic.
  - **Palette guidance**: muted earth tones (oxidized copper, weathered concrete, sun-bleached teal) punctuated by vivid organic greens and the warm amber glow of still-functioning solar tech. Projectiles and call-card triggers use brighter accent colors for gameplay clarity.
  - **Readability**: with 8–12 friendly birds, enemies, and projectiles all on screen during a scrolling run, visual clarity is paramount. Each bird species needs a distinct silhouette at small scale. Projectile colors must contrast against both level palettes. Enemy types need recognizable shapes before the player reads any UI.

- **Audio direction: chiptune ambient**
  - Music is chiptune-based but ambient and atmospheric — closer to a lo-fi chiptune playlist than a high-energy arcade soundtrack.
  - The deliberate juxtaposition: the music stays relaxed and contemplative while the gameplay is violent and chaotic. The player is an observer/strategist reviewing their plan in action, not an adrenaline-fueled pilot.
  - Music does **not** dynamically escalate with combat intensity. It remains a steady, meditative backdrop. Urgency comes from the visuals and SFX only.
  - SFX should be punchy and satisfying (pixel-era sound design: crunchy hits, chirpy projectiles, sharp explosions) to carry the moment-to-moment impact the music deliberately avoids.

- **Tone and storytelling philosophy**
  - Zero exposition. No cutscenes, no dialogue boxes, no narrator, no text dumps.
  - All lore is embedded in the environment: backgrounds tell stories through visual details. Item and trait names hint at the world. Bird species names and faction identities carry flavor.
  - The game never explains what happened to humanity. Players piece it together (or don't) through observation.

---

### 3. Narrative & world

- **Setting**
  - Humanity is gone. No one knows why. The infrastructure they left behind — solar farms, wind turbines, monorails, automated factories — still hums along, maintained by machines that no longer have masters.
  - In their absence, birds have risen. Rival bird factions fight for territory, resources, and nesting rights across the overgrown ruins of a highly advanced, sustainability-focused civilization.
  - The world is lush, not bleak. Nature has won. The apocalypse was quiet.

- **Lore delivery rules (for all content creators)**
  - **Never** tell the player what happened. Environmental details imply; they never confirm.
  - Bird trait names, formation names, and item descriptions can carry subtle worldbuilding (e.g., a trait called "Circuit Pecker" implies birds have learned to interact with leftover tech).
  - Level backgrounds should contain bespoke visual storytelling moments (a child's bicycle overgrown with ivy, a self-driving car with a bird's nest on the dashboard) that reward attentive players but are never highlighted by the UI.
  - Enemy factions should feel like they have their own culture and territory, communicated purely through their visual design and behavior patterns.

---

### 4. Run structure

- **Run anatomy**
  - A single run is a **continuous vertical-scrolling shooter level**, inspired by Ikaruga and Galaga.
  - The flock scrolls upward through the level. Enemies appear from the top and sides. Ground targets scroll into view below.
  - Each run lasts **under 3 minutes**. The game is designed around many short runs, not few long ones.
  - A full run consists of a **fixed sequence of levels**: Level 1 → Level 2 → Boss → Run Complete.
  - 2 levels at launch, with the system designed to support expansion.

- **Scroll behavior**
  - Base scroll speed is fixed and consistent within a level.
  - Slight acceleration in the final approach to the boss to build tension.
  - The flock's horizontal position and movement is determined entirely by formation logic and call cards — the player cannot steer.

- **Boss randomization**
  - Each level has a **pool of possible bosses**. One is randomly selected per run.
  - This ensures that even when grinding a specific level/difficulty tier, the final encounter varies, demanding flexible call card setups rather than boss-specific scripts.

- **Scoring**
  - Runs produce a **numeric score** based on: enemies killed, birds surviving, time efficiency, and bonus objectives.
  - Personal best scores are tracked per level and per difficulty tier.
  - Score directly influences Scrap (common currency) earned.

- **Run outcomes**
  - **Success**: minimal debrief screen (score, kills, birds lost, loot). Auto-queues the next level in the sequence.
  - **Failure**: same debrief screen, then the player is sent to the **Aviary HQ** hub for recruitment, call editing, and formation adjustment.
  - **Instant retry**: available on failure. One button relaunches the same level with the same loadout. No friction.

- **Player agency during runs**
  - **Camera controls only**: zoom, pan, follow a specific bird. No speed control (no pause, no slow-mo, no fast-forward).
  - The player is a spectator evaluating their plan in real time. The lack of speed control reinforces commitment to the pre-configured loadout.

---

### 5. Flock & birds

- **Flock size**: 8–12 birds per run. Squad-level tactics with room for sub-flocks, layered formations, and meaningful role assignment.

- **Species (6 at launch)**

  | Species | Role | Strengths | Weaknesses | Notes |
  |---------|------|-----------|------------|-------|
  | **Hawk** | Striker | High damage, high speed, dive attack specialist | Fragile, expensive to recruit | Primary damage dealer. Excels at priority target deletion. |
  | **Pigeon** | Filler / Screen | Cheap, plentiful, fast to recruit | Low stats across the board | Expendable. Ideal for sacrificial screens, risky escort roles, or padding out formations cheaply. |
  | **Crow** | Opportunist | Balanced stats, bonus damage to wounded targets | No standout strength in any single area | Flexible generalist. Becomes deadly when paired with debuffers or after initial strikes soften targets. |
  | **Goose** | Anchor / Tank | High toughness, aura buffs, formation backbone | Slow, low agility | Central to formation stability. Losing a Goose destabilizes nearby birds. |
  | **Owl** | Specialist | Stealth, ambush attacks, debuffs, high awareness | Low stamina, poor sustained combat | Best used for hit-and-run debuff application. Fragile if exposed. |
  | **Gull** | Harasser / Medic | Healing bursts, ranged harassment, medium survivability | Low damage output | Support role. Keeps the flock alive but contributes little to kills directly. |

- **Base stats** (per bird): Speed, Toughness, Agility, Awareness, Aggression, Stamina. Each species has a base profile; individual birds roll slight variations on recruitment.

- **Roles**
  - **Strikers**: High damage, fragile. Dive attacks and priority target deletion.
  - **Screens / Interceptors**: Outer formation layers. Peel off threats, intercept projectiles or fast enemies.
  - **Anchors**: Central birds providing buffs/aura effects. Losing them destabilizes the flock.
  - **Specialists**: Debuffers, scouts, decoys, healers, disruption.

- **Personality traits**
  - Each bird is generated with one or more personality traits that affect behavior and how they interpret call cards:
    - **Positive**: Enduring (reduced stamina drain), Protective (bodyblocks for nearby allies), Vengeful (damage boost when an ally dies), Steady Wing (reduced front-position penalties).
    - **Negative**: Reckless (over-commits on attack calls), Cautious (delays before executing aggressive calls), Hates the Front (stress/morale penalties when leading), Hates Drones (morale penalty near drones, but damage bonus against them).
  - Traits interact with call cards. A Reckless bird might dive even when a call suggests retreat. A Cautious bird might delay a critical formation switch.

- **Progression within a run**
  - Birds gain XP during a run from kills and survival. XP carries across runs as part of meta-progression.
  - Leveled birds gain minor stat boosts and occasionally develop new traits (positive or negative quirks).

- **Death and egg inheritance**
  - Birds **die permanently** during combat. Death is expected and frequent, especially among Pigeons and front-line Strikers.
  - When a bird dies, it does not simply vanish — it **enriches the nest**. Dead birds' accumulated stats and traits passively influence the recruitment pool. Over many generations of death and recruitment, the available recruits develop better base aptitude: faster stat growth rates, higher chance of desirable traits, and stronger starting profiles.
  - This is a **background system** with no explicit egg management UI. The player simply notices that after losing many experienced birds, the next generation of recruits is subtly stronger. This rewards playing aggressively and accepting losses rather than hoarding veteran birds on safe missions.
  - **Hall of Feathers**: a memorial screen listing fallen birds and their lifetime stats. Purely cosmetic, designed to build attachment and give weight to losses.

---

### 6. Formations

- **Formations at launch (5)**

  1. **Flying V**
     - Classic wedge shape. Strong frontal assault orientation.
     - **Slipstream bonus**: trailing birds get reduced stamina drain and a small speed buff.
     - **Rotation dependent**: the lead bird tires faster and must be rotated. Well-suited to Geese or Enduring-trait birds at the point.
     - **Weakness**: flanking attacks and rear threats are poorly covered.

  2. **Spread Line**
     - Birds arranged in a wide horizontal line.
     - **Strength**: 360-degree targeting coverage, good against enemies from multiple directions.
     - **Weakness**: no slipstream bonuses, weak to focused fire on any single point.

  3. **Tight Cluster**
     - Compact grouping with minimal spacing.
     - **Strength**: maximum aura stacking from Anchors/Geese. Strongest mutual support and healing efficiency.
     - **Weakness**: devastating AoE vulnerability. A single well-placed blast can hit the entire flock.

  4. **Echelon (staggered diagonal)**
     - Offset diagonal line, combining elements of the V and Spread Line.
     - **Strength**: partial slipstream benefits with better lateral coverage than the V. Good for flanking runs.
     - **Weakness**: weaker frontal concentration than the V, weaker spread than the Line.

  5. **Loose Swarm**
     - No fixed positions. Birds move semi-independently within a rough area.
     - **Strength**: high individual evasion, very difficult to AoE effectively. Best defensive/survival formation.
     - **Weakness**: no slipstream bonuses, no aura stacking, weakest coordinated firepower. Calls execute less predictably because bird positions are fluid.

- **Formation positions**: Front, Mid, Rear, Flanks, Core. Players assign birds to positions within the formation editor. Position determines exposure, slipstream eligibility, and aura range.

- **Formation changes during battle**
  - Call cards can trigger formation switches mid-run (e.g., `IF [incoming AoE detected] THEN [switch to Loose Swarm]`).
  - Each formation change incurs a **reorganization window** (~1.5–2 seconds) where the flock is transitioning and temporarily vulnerable. Birds move to new positions and are less responsive to other calls during the switch.
  - Frequent formation switching is a valid strategy but carries compounding reorganization risk.

- **Sub-flocks**
  - Formations can designate a detachable "mini-wing" (2–3 birds) that can be sent on independent tasks via call cards (e.g., intercept a flanking threat, dive-bomb a ground target, scout ahead).
  - Detached mini-wings operate outside the main formation and lose its aura/slipstream benefits until they rejoin.

---

### 7. Formation physics & rotation

- **Slipstream / drag reduction**
  - Formations with defined trailing positions (V, Echelon) grant reduced stamina drain and small speed/agility bonuses to birds behind the leader.
  - The front/lead position suffers increased stamina drain and higher exposure to incoming fire.

- **Stamina / fatigue**
  - Each bird has a stamina value that depletes during flight. As stamina drops, speed and agility decrease.
  - Over-fatigued leaders may drop out of position, causing temporary formation wobble or gaps in coverage.
  - Stamina regenerates slowly in trailing positions with slipstream bonuses.

- **Rotation rules**
  - **Default rotation**: formations automatically rotate the lead bird when its stamina or HP falls below a configurable threshold. The system selects the healthiest suitable bird from trailing positions.
  - **Call-driven rotation**: call cards can override or refine rotation behavior:
    - Example: `IF [leader HP < 50%] THEN [rotate with healthiest rear bird]`
    - Example: `IF [leader stamina < 30%] THEN [rotate]`
  - **Rotation tradeoffs**:
    - Aggressive (rotate rarely): stable direction and speed, but leaders burn out and may collapse.
    - Defensive (rotate often): safer for leaders, but each swap introduces a brief reorganization wobble.

- **Leader suitability traits**
  - Traits like "Enduring" and "Steady Wing" reduce front-position penalties, making those birds ideal leaders.
  - "Hates the Front" creates stress and mispositioning if a bird is forced to lead.
  - The formation editor allows setting preferred leader priority (e.g., prioritize Geese as V-formation leaders).

- **Visual feedback**
  - Subtle airflow lines behind leading birds indicate slipstream.
  - Formation editor shows the current leader and next-in-rotation.

---

### 8. Call cards

- **Core concept**
  - Call cards are the player's **only means of controlling the flock**. They are pre-configured automation rules — the "code" the flock executes during a run.
  - Once the run begins, the player has zero input. Everything the flock does emerges from call cards, formation logic, and individual bird traits.

- **Card format: slottable cards with editable variables**
  - Each call card is a logical statement with **selectable dropdown variables** for its condition and action.
  - Cards are physical objects in the UI: the player drags them into slots, then configures the variables via dropdowns or dials on the card face.

- **Deck constraints**
  - **3–4 call card slots per run.** This tight constraint forces hard choices about which situations to automate. A player cannot cover every scenario — they must prioritize.
  - Cards execute in **slot priority order**: Slot 1 is evaluated first each tick, then Slot 2, etc. If multiple cards' conditions are true simultaneously, the highest-priority card wins.
  - Conflict resolution: if two cards prescribe contradictory actions in the same tick, the higher-slotted card takes precedence.

- **Card complexity tiers (unlocked via Commander XP)**

  - **Tier 1 — Starter cards (available from first run)**
    - Simple `IF [condition] THEN [action]` structure.
    - Condition variables: flock HP threshold, enemy type sighted, bird count remaining, stamina threshold.
    - Action variables: switch formation, change stance (aggressive/defensive/evasive), focus fire nearest, retreat.
    - Examples:
      - `IF [flock HP < 50%] THEN [switch to Loose Swarm]`
      - `IF [enemy type = turret] THEN [focus fire]`
      - `IF [birds remaining < 4] THEN [evasive stance]`

  - **Tier 2 — Compound cards (unlocked mid-progression)**
    - `IF [condition A] AND/OR [condition B] THEN [action]` structure.
    - New condition variables: incoming fire level, current formation, specific bird alive/dead, enemy count.
    - New action variables: detach sub-flock, change targeting priority, trigger species ability.
    - Examples:
      - `IF [enemy type = drone] AND [drone count > 3] THEN [focus fire nearest drone]`
      - `IF [anchor dead] OR [flock HP < 30%] THEN [evasive stance]`

  - **Tier 3 — Loop cards (unlocked late-progression)**
    - `FOR EACH [subset] IF [condition] THEN [action]` and `WHILE [condition] DO [action]` structures.
    - Subset selectors: by role, by species, by trait, by HP range.
    - New action variables: retreat to rear, surge forward, cooldown-gated abilities.
    - Examples:
      - `FOR EACH [striker] IF [stamina < 30%] THEN [retreat to rear]`
      - `WHILE [boss state = exposed core] DO [all strikers dive attack]`

- **Card library at launch**
  - ~15–20 unique card templates across all tiers.
  - 3–4 starter cards available on first run. Remaining cards unlock through Commander XP milestones.
  - Prebuilt "blueprint" cards (e.g., "Protect the Core", "Berserk Push", "Last Stand Disperse") available as starting points that players can customize by changing variables.

- **Card assignment**
  - Cards are assigned globally (apply to the whole flock) by default.
  - Tier 2+ cards can target specific roles, species, or sub-flocks via their condition filters.

---

### 9. Combat, enemies & bosses

- **Combat presentation**
  - Top-down continuous vertical scroll. The flock is an autonomous unit moving upward through the level.
  - The camera and encounter pacing evoke classic arcade shmups: dense projectile patterns, enemy waves, and distinct boss setpieces.
  - Ground targets scroll into view below the flock and are attacked via bombing runs and dive attacks. Air targets approach from ahead and the sides.

- **Enemy archetypes (launch roster: 5 types)**

  1. **Turret Nests** (ground, static)
     - Fixed-arc fire with predictable patterns. Rewards good formation positioning — approach from their blind arc for free damage.
     - Call card hook: `IF [turret sighted] THEN [focus fire]`.

  2. **Drone Swarms** (air, mobile)
     - Fast, numerous, individually weak. Appear in clusters of 5–8.
     - Punish players who have no spread-targeting or AoE call. Reward focus-fire cards and area denial.
     - Call card hook: `IF [drone count > 3] THEN [spread targeting]`.

  3. **Defense Hawks** (air, mobile)
     - Rival birds that mirror your mechanics: they dodge, dive, and pursue. The most dangerous common enemy.
     - Punish passive/defensive setups. Reward aggressive stance switches and priority targeting.
     - Call card hook: `IF [enemy type = hawk] THEN [aggressive stance]`.

  4. **Flak Balloons** (air, semi-static)
     - Hovering platforms that fire AoE bursts at regular intervals. The burst radius is telegraphed.
     - Punish Tight Cluster formation. Reward formation-switch cards that trigger on AoE detection.
     - Call card hook: `IF [incoming AoE detected] THEN [switch to Loose Swarm]`.

  5. **Sniper Towers** (ground, static)
     - High single-target damage with a visible charge-up laser sight. Targets the bird with highest aggro (usually the leader).
     - Punish slow rotation and static leaders. Reward rotation-focused call cards.
     - Call card hook: `IF [leader HP < 50%] THEN [rotate leader]`.

- **Enemy state tags**
  - All enemies expose distinct, taggable states that the call card system can read:
    - `charging`, `exposed`, `shielded`, `spawning adds`, `cooldown`, `retreating`.
  - These states are visually telegraphed (charge-up animations, shield shimmer, spawn portals) so players can observe them during runs and then write call cards that react to them.

- **Boss design**
  - 3–4 bosses in the launch pool, randomly assigned at the end of each run.
  - Each boss is designed to **stress-test a different aspect** of the call card and formation system:
    - **Boss A**: heavy AoE sweeps — tests formation switching and spacing discipline.
    - **Boss B**: spawns waves of adds — tests targeting priority and sub-flock management.
    - **Boss C**: alternates between shielded and exposed phases — tests conditional timing (attack only during exposed windows).
    - **Boss D**: high single-target sniper attacks on leaders — tests rotation rules and leader management.
  - Bosses have clear, readable patterns with **deliberate vulnerability windows** where a well-timed call produces massive damage payoffs.
  - Boss phases escalate in a way that stresses different parts of the player's call setup across the fight.

- **Environment hazards**
  - Level-specific: turbine blades (Turbine Gorge), solar panel glare zones (Solar Canopy), updrafts, toxin clouds, net traps.
  - These are not enemies but affect movement, stamina, and formation stability. Some can be exploited (updrafts restore stamina, glare zones blind enemies too).

---

### 10. Progression & meta-game

- **Commander XP**
  - Earned every run (win or lose). Amount scales with score.
  - Commander XP is the **sole unlock currency** for new content:
    - New call card templates (Tier 2 and Tier 3 cards).
    - New formation templates (beyond the 2 starters).
    - New bird species (beyond the 2 starters).
    - Milestone unlocks at defined XP thresholds, giving the player a clear progression roadmap.
  - Commander XP is **permanent** — it never resets, even on failed runs.

- **Dual currency**
  - **Scrap** (common)
    - Earned every run, amount based on score performance.
    - Spent on: recruitment (hiring birds from the nest), bird training (leveling stats between runs), refreshing the recruitment pool, purchasing formation presets.
  - **Plumes** (rare)
    - Earned from boss kills and milestone achievements (first clear of a difficulty tier, personal best scores, etc.).
    - Spent on: elite bird variants (cosmetic + minor stat edge), advanced call card unlocks (shortcut past XP gates), premium formation templates.

- **Recruitment & the nest**
  - After a failed run, the player visits the **Aviary HQ** which includes the **Nest** — a recruitment screen showing a small pool (4–6 slots) of recruitable birds.
  - Each recruit is a specific individual with: species, rolled base stats (within species range), and 1–2 personality traits.
  - Recruiting costs Scrap. Rarer species and better traits cost more.
  - **Refreshing the pool** costs Scrap (scaling cost to prevent infinite rerolling).
  - **Egg inheritance effect**: the recruitment pool's quality improves passively over time as birds die in combat. The accumulated legacy of fallen birds raises the baseline — recruits gradually start with better stat growth rates and higher trait quality. This is invisible to the player as a mechanic; they simply notice better birds appearing over time.

- **Difficulty tiers**
  - Each level has three difficulty tiers: **Normal**, **Hard**, **Brutal**.
  - Higher tiers increase enemy density, enemy stat scaling, boss HP, and environmental hazard frequency.
  - Higher tiers award more Scrap, more Plumes, and apply a score multiplier to personal bests.
  - Hard unlocks after Normal clear. Brutal unlocks after Hard clear.
  - Brutal runs are intended to require Tier 2+ call cards and optimized formations — they are the endgame grind.

- **Starter loadout**
  - First run: 8 birds (2 Hawks, 2 Pigeons, 1 Crow, 1 Goose, 1 Owl, 1 Gull), 2 basic IF/THEN call cards, Flying V formation.
  - This loadout is functional enough to survive Level 1 Normal with attentive card configuration, but will not carry the player far without iteration.

---

### 11. Player experience flow

- **First launch**
  - Player is dropped into the Aviary HQ with a starter flock and starter call cards. No tutorial mission — tooltips and the debrief screen are the teaching tools.
  - A brief tooltip overlay on first visit explains: "Slot your call cards. Pick your formation. Launch."
  - The starter loadout is pre-configured to work out of the box. The player can launch immediately.

- **Before run — Aviary HQ** (accessed after failure or by choice)
  - **Roster management**: choose which 8–12 birds fly. View stats, traits, and level.
  - **Formation setup**: select formation, assign birds to positions (front/mid/rear/flanks/core), set rotation preferences and leader priority.
  - **Call card editor**: slot 3–4 call cards, configure their variables via dropdowns. Drag to reorder priority. Prebuilt blueprints available as starting points.
  - **Nest (recruitment)**: inspect and recruit new birds. Refresh pool for Scrap.
  - **Hall of Feathers**: memorial screen for fallen birds (cosmetic).

- **Run start**
  - Select level and difficulty tier from the level select screen.
  - Launch button. No loading screen — immediate transition to gameplay.

- **During run**
  - No direct control. The player watches the flock execute their call cards and formation logic.
  - **Camera controls**: zoom in/out, pan across the level, follow a specific bird.
  - **Overlay**: call card triggers flash on-screen when they fire (brief icon pulse). Threat lines show incoming high-damage attacks. Current score ticks up in the corner.
  - Run lasts under 3 minutes.

- **After run — Debrief**
  - **Minimal debrief screen**: final score, enemies killed, birds lost (with names), Scrap earned, Plumes earned (if boss killed), Commander XP earned.
  - Key event callouts: "Your Anchor (Gerald the Goose) died at 0:42 to Flak Balloon AoE." — enough information to prompt iteration without a full replay system.
  - **On success**: "Next Level" button auto-queues the next level in the run sequence. "Return to HQ" also available.
  - **On failure**: "Instant Retry" button (same loadout, one button, zero friction) and "Return to HQ" button.

---

### 12. Onboarding

- **Philosophy: learn by doing**
  - No tutorial missions. No guided hand-holding sequences. The game teaches through failure and iteration.
  - The starter loadout is functional — the player's first run will not be an instant death, but it will likely fail. The debrief screen then provides enough information to prompt changes.

- **Teaching tools**
  - **Tooltips**: every UI element has a hover/tap tooltip explaining what it does. Tooltips are concise (one sentence max).
  - **Debrief callouts**: the post-run debrief highlights the most impactful event ("Your Anchor died at 0:42 to AoE"). This is the primary teaching mechanism — it points at the problem, the player figures out the solution.
  - **Call card blueprints**: prebuilt card templates serve as examples of what's possible. Players can use them as-is or study them to understand the system.
  - **Pre-filled defaults**: new call cards come with example variable values already selected. The player can launch with defaults and see what happens before customizing.

- **Complexity pacing**
  - The call card unlock system (via Commander XP) naturally gates complexity. Players only see IF/THEN cards until they've earned enough XP to unlock AND/OR and later FOR/WHILE constructs.
  - This means the first several hours of play only involve choosing between simple conditional cards — the system reveals its depth gradually.

---

### 13. Level themes

- **Level 1: The Solar Canopy**
  - **Setting**: a sprawling solar farm overgrown with tropical vegetation. Vine-draped photovoltaic panels stretch across the landscape in geometric rows, their surfaces cracked but still glowing faintly. Rusted maintenance walkways and collapsed monitoring stations litter the ground.
  - **Palette**: warm amber, organic green, oxidized copper, faded solar-panel blue.
  - **Ground targets**: Turret Nests embedded in panel arrays, Sniper Towers on collapsed gantries.
  - **Air threats**: Drone Swarms (reactivated maintenance bots), rival Pigeon flocks.
  - **Environmental hazards**: solar glare zones (temporary vision reduction for birds passing through — enemies affected too), vine tangles (slow ground-bombing approaches).
  - **Mechanical identity**: introductory level. Moderate enemy density, predictable patterns. Teaches formation basics and simple call card usage.

- **Level 2: Turbine Gorge**
  - **Setting**: a deep canyon lined with massive wind turbines, their blades still spinning. The gorge walls are terraced with nesting platforms and covered in moss. Fog rolls through the lower sections. Cables and catwalks span the gap between turbine towers.
  - **Palette**: steel blue, moss green, cloud white, weathered concrete grey.
  - **Ground targets**: Sniper Towers on canyon walls, Turret Nests on turbine nacelles.
  - **Air threats**: Defense Hawks riding updrafts, Flak Balloons tethered between turbines.
  - **Environmental hazards**: spinning turbine blades (physical obstacles that damage birds on contact — must be navigated around via formation positioning), updrafts (restore stamina but push birds out of formation temporarily), crosswinds (affect projectile trajectories).
  - **Mechanical identity**: harder than Solar Canopy. Environmental hazards demand formation awareness. Defense Hawks test aggressive call cards. Updrafts introduce stamina management as a tactical consideration.

- **Level design principles**
  - Each level should have a distinct visual identity, enemy mix, and environmental mechanic that rewards different call card and formation configurations.
  - Future levels should continue this pattern: new environment, new hazard type, new reason to change your loadout.

---

### 14. Technical notes

- **Platform targets**
  - **Primary**: modern web browsers (Chrome, Firefox, Safari, Edge). Target resolution: 1920x1080 with responsive scaling. 60fps target with 8–12 birds + enemies + projectiles on screen.
  - **Migration 1 — Mobile** (iOS/Android): touch controls for camera (pinch zoom, drag pan, tap to follow bird). Call card editor redesigned for touch (larger drag targets, tap-to-select dropdowns). Portrait and landscape orientation support.
  - **Migration 2 — Steam**: controller support, Steam achievements, cloud save integration. Keyboard/mouse camera controls.

- **Save system**
  - **Cloud save** for meta-progression: Commander XP, unlocked content, recruitment pool state, roster, Scrap/Plume balances, Hall of Feathers.
  - **Local storage fallback** for offline/privacy-conscious players.
  - No mid-run saves (runs are under 3 minutes — no need).
  - Egg inheritance data (accumulated legacy stats from fallen birds) is part of the save profile.

- **Performance considerations**
  - Pixel art at native resolution with integer scaling keeps GPU load minimal.
  - Flock simulation (8–12 birds with formation logic, stamina, call card evaluation) is the primary CPU concern. Call cards should be evaluated once per simulation tick (not per frame).
  - Projectile pooling and enemy culling for off-screen entities.

---

### 15. Morale & psychology (to be refined)

- **Flock morale**
  - A flock-wide morale value that shifts during a run based on events: ally deaths decrease morale, kills and successful call triggers increase it.
  - Low morale degrades call responsiveness (delayed execution), formation stability (birds drift from positions), and aggression (less damage output).
  - **Morale collapse**: if morale drops below a critical threshold, the flock enters a panicked state — calls may be ignored entirely, formation breaks, birds scatter.
  - Call cards can be designed to interact with morale: `IF [morale < 30%] THEN [rally stance]` (a stance that stabilizes morale at the cost of offensive output).

- **Morale as a design lever**
  - Morale makes Anchor/Goose deaths devastating beyond the loss of aura buffs — it cascades through the flock's behavior.
  - Aggressive players who lose their Anchors early face a morale spiral that makes the rest of the run progressively harder.
  - Defensive players who protect Anchors can maintain high morale and consistent call execution throughout.

---

### 16. Synergies & combos (to be refined)

- **Species combos**
  - Certain species combinations produce synergy bonuses when positioned near each other in formation:
    - Owl debuffs enemy armor → Hawk follow-up deals amplified damage.
    - Gull healing aura keeps Goose alive → Goose aura keeps the whole formation stable.
    - Crow bonus damage to wounded targets → pairs with any species that deals initial chip damage.
  - Synergies should be discoverable through play, not listed in a menu. The debrief screen can hint at them: "Crow dealt 40% more damage this run — nearby Owl debuffs increased effectiveness."

- **Call card chaining**
  - Because cards execute in priority order, players can create implicit chains:
    - Slot 1: `IF [enemy shielded] THEN [Owl screech debuff]`
    - Slot 2: `IF [enemy debuffed] THEN [all strikers dive attack]`
  - This sequential logic emerges from slot ordering, not an explicit "chain" mechanic. Mastering card sequencing is a key skill ceiling.

---

### 17. Vertical slice

- **Scope: minimum viable proof of concept**
  - **Birds**: 6 species available. Starter flock of 8 (2 Hawks, 2 Pigeons, 1 Crow, 1 Goose, 1 Owl, 1 Gull).
  - **Level**: 1 level (The Solar Canopy), Normal difficulty only.
  - **Enemies**: 3 types (Turret Nest, Drone Swarm, Defense Hawk).
  - **Boss**: 1 boss from the pool (Boss A: AoE sweeps — tests formation switching).
  - **Formations**: 2 (Flying V, Loose Swarm).
  - **Call cards**: 3 starter Tier 1 IF/THEN cards with configurable variables.
  - **Run loop**: full cycle — launch → scroll → combat → boss → debrief → retry or hub.
  - **Hub**: functional Aviary HQ with roster management, formation editor, call card editor, and nest (recruitment with 3–4 recruit slots).
  - **Progression**: Commander XP earning functional. Scrap earning and spending on recruitment functional. Egg inheritance running in the background.
  - **Camera**: zoom, pan, and follow-bird controls during run.
  - **Score**: numeric score with personal best tracking.

- **What the vertical slice proves**
  - The core loop is satisfying: configure → watch → learn → iterate.
  - Call cards are understandable and fun to tinker with at Tier 1 complexity.
  - The auto-battler shmup hybrid is visually engaging to watch.
  - Failure feels like a puzzle to solve, not a punishment.
  - The "instant retry" flow keeps session momentum high.
  - 3-minute runs feel like the right length.

- **What it defers**
  - Tier 2 and Tier 3 call cards.
  - Level 2 (Turbine Gorge) and additional levels.
  - Hard and Brutal difficulty tiers.
  - Plumes (rare currency) and Plume-gated content.
  - Morale system.
  - Species synergy bonuses.
  - Hall of Feathers.
  - Sub-flock detachment.
  - Mobile and Steam builds.

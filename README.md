# Assault Flock

Assault Flock is a **roguelite auto‑battler flock tactics game**.  
You do all your thinking **before** the run: configure a flock of birds, pick a formation, wire up a few automation “call cards” — then hit LAUNCH and watch the plan succeed (or fall apart) with **zero mid‑run input**.

This repo contains the **standalone web demo**: a single‑page HTML5 game that runs entirely client‑side (no backend, no build step).

---

## Play the game

- **Live demo**: `https://ultimate-hog.github.io/Assault-Flock/`
- **Local**: open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge).

Everything needed to run the game is in three files at the repo root:

- `index.html`
- `game.js`
- `style.css`

No external assets or libraries are required.

---

## Core concept

- **Genre**: roguelite auto‑battler / flock tactics / vertical shmup hybrid  
- **Player fantasy**: you are a **flock commander**, not a twitch pilot  
- **Run length**: under 3 minutes per run  
- **Input model**: configuration‑only — you never steer the flock directly

The basic loop:

1. **Recruit & configure** birds at the Aviary HQ.
2. **Choose a formation** and assign birds to positions.
3. **Slot call cards** (IF/THEN automation rules).
4. **Launch a run** and watch the flock fly a vertical‑scrolling mission.
5. **Debrief**, earn currency, recruit/upgrade, iterate the build.

Success comes from understanding systems and planning, not reaction speed.

---

## Birds & roles (demo slice)

The demo focuses on a small flock of distinct bird species, each with a clear battlefield role.

- **Danger Sparrow** — Striker, melee (Peel)  
  - Dives out of formation to delete priority targets then returns.  
  - Strong all‑rounder damage dealer; fragile if over‑exposed.

- **Feathered Loiterer** — Screen / filler, ranged (Rapid)  
  - Cheap, numerous, fires a stream of low‑damage shots.  
  - DPS comes from sheer volume; great at cleaning up waves.

- **Goth Chicken** — Opportunist, melee (Peel)  
  - Fast peel attacker with elevated crit chance.  
  - Underwhelming on normal hits, terrifying on crits — loves wounded targets.

- **Angry Honker** — Anchor / tank, melee (Charge)  
  - Slow, tough, and radiates an armor aura to nearby birds.  
  - Occasionally launches a straight‑line charge through multiple enemies.

- **Wise Old Bird** — Specialist, ranged (Sniper)  
  - Very slow but extremely high single‑shot damage.  
  - Ideal for bosses and high‑value elites; often pairs with debuff effects.

- **Beach Screamer** — Harasser / medic, ranged (Triple)  
  - Fires a 3‑shot spread; can push surprising burst at close range.  
  - Provides healing and sustain to keep the flock alive.

Each bird rolls **stats** (Speed, Toughness, Agility, Awareness, Aggression, Stamina) and may have **personality traits** that subtly alter behaviour (e.g., Enduring, Reckless, Protective).

---

## Formations

Formations are the macro‑level shape the flock flies in. They govern:

- Which birds are most exposed to fire
- Who gets **slipstream** bonuses (reduced stamina drain, passive HP regen)
- How aura effects and support radiate through the flock

Key formations in the demo:

- **Flying V**  
  - Classic wedge. Trailing birds enjoy strong slipstream regen and armor; the lead bird takes the brunt of incoming fire.  
  - Great baseline for most builds, but vulnerable to flanking and rear threats.

- **Spread Line**  
  - Wide horizontal line. Fantastic coverage against enemies from many angles.  
  - No armor or slipstream bonuses; every bird is equally exposed.

- **Tight Cluster**  
  - Compact ball of birds. Maximises aura stacking and healing efficiency.  
  - Extremely vulnerable to area‑of‑effect (AoE) attacks.

- **Echelon**  
  - Staggered diagonal line. Partial slipstream, better lateral coverage than V.  
  - More flexible than V, less raw frontal power.

- **Loose Swarm**  
  - Birds move semi‑independently in a rough cloud.  
  - Hard to hit with AoE, but loses most structured bonuses.

Formation choice plus **which birds sit where** (front, mid, rear, flanks, core) has huge impact on survivability and effective damage.

---

## Call cards (automation rules)

Call cards are your only direct control over the flock. They are slottable **IF/THEN rules** that the game evaluates continuously during a run.

Examples:

- `IF flock HP < 50% THEN switch to Loose Swarm`
- `IF enemy type = turret THEN focus fire`
- `IF birds remaining < 4 THEN evasive stance`

Cards execute in **slot priority order** (slot 1 first, then slot 2, etc.).  
If multiple cards match at once, the higher‑priority slot wins.

This turns the game into a light **visual programming puzzle**: you’re effectively writing battle logic, then observing how it behaves under pressure.

---

## Level & pacing (demo)

The demo vertical slice focuses on a short campaign:

- **Continuous vertical scroll** through overgrown solar farms and turbine canyons.
- Mix of **ground targets** (turret nests, sniper towers) and **air threats** (drones, rival birds, flak balloons).
- Each run ends in a **boss encounter** tuned to stress a particular system (formation switching, targeting priorities, or rotation management).

Runs are deliberately brief so you can:

- Try a build
- Watch it fail in an interesting way
- Tweak calls / formations / roster
- Relaunch within seconds

---

## Meta‑progression (demo flavour)

The demo includes a light taste of the planned meta systems:

- **Seed** — common currency earned from runs, used to recruit and train birds.
- **Plumes** — rarer currency from major milestones and bosses.
- **Commander XP** — permanent progression that unlocks new formations and call card templates over time.
- **Hall of Feathers** — a memorial log of fallen birds (in full game design; lightly referenced in the demo UI).

The full design (captured in the private `design.md` document on the author’s machine) extends this into long‑term bloodline evolution and more elaborate call‑card logic tiers. The web demo here focuses on delivering the **feel** of that system within a single self‑contained page.

---

## Tech notes

- **Stack**: vanilla HTML5 + CSS + JavaScript (no frameworks, no build tools).
- **Rendering**: `<canvas>`‑based 2D rendering at a fixed internal resolution with responsive scaling.
- **Persistence**: uses `localStorage` in the browser to remember basic profile/progression data between sessions.
- **Performance target**: 60 FPS on modern desktop browsers with a full flock, enemy waves, and dense projectiles.

Because the entire game lives in `index.html`, `game.js`, and `style.css`, it’s easy to:

- Host on GitHub Pages (root of the `main` branch).  
- Mirror on any static web host.  
- Zip and distribute as an offline HTML build.

---

## Repository layout (after cleanup)

After the repo reorganisation, the relevant files are:

- `index.html` — entry point and UI structure
- `game.js` — all game logic, systems, and rendering
- `style.css` — layout and visual styling
- `README.md` — this document
- `.gitignore` — keeps local tools, archives, and non‑game projects out of Git

Everything else (archives, old deploy scripts, other local projects, design docs) is **ignored locally** and no longer pushed to GitHub, so the repo stays focused on the playable web build.

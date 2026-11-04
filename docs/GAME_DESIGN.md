# Spider-Man: Neon Pursuit

**Game Design Document — playable prototype**

| Field | Value |
| --- | --- |
| Title | **Spider-Man: Neon Pursuit** |
| Genre | Third-person 3D action / open-city chase / arcade traversal |
| Platform | PC browser and mobile browser (responsive, touch controls) |
| Players | Single player |
| Audience | All ages; readable action, no gore, no blood |
| Session length | 8–12 minutes for a full three-chapter run |
| Camera | Dynamic third-person chase camera with mouse / right-stick / drag look |
| Engine | Three.js + Vite, procedural art and WebAudio |
| Status | Playable vertical slice with complete three-chapter arc, results, upgrades, fail and victory states |

---

## 1. Title and Pitch

**Spider-Man: Neon Pursuit** is a fast, stylish web-swinging chase through a neon-lit Manhattan at dusk. The Green Goblin has turned the skyline into his personal playground: his scouts are hunting civilians, pumpkin bombs are falling on the streets, and his glider is always one rooftop ahead.

The player is Spider-Man. Swing from rooftop to rooftop, build momentum, web the Goblin out of the sky, and strike while he is tangled. Rescue the people caught in the crossfire, grab field power-ups, and chase him through three escalating chapters — from a sunset skyline, to a midnight canyon of glass and neon, to a final aerial duel above Oscorp.

**One-line pitch:** *Swing. Strike. Save the city.*

### Design pillars

1. **Momentum is the fantasy.** Swinging should feel physical, fast, and forgiving. Every release should launch the player toward the next problem.
2. **Chase pressure, not open-world sprawl.** The city is a stage for a moving fight. The Goblin's distance, the timer, and the bombs keep the player moving forward.
3. **Readable spectacle.** Big silhouettes, neon colour coding, slow-motion impact frames, and a camera that sells speed without losing the target.
4. **Short arcade runs.** Three chapters, clear fail states, quick retries, and upgrades that change how the next chapter feels.
5. **Anyone can pick it up.** One-button swing, contextual web/strike, generous aim range, and a x9 combo ceiling that rewards aggression but does not punish beginners.

---

## 2. Story

### 2.1 World and tone

The story takes place over one long night in a stylised New York. The city is recognisable but heightened: enormous vertical avenues, rooftop helipads, Oscorp signage, neon billboards, and a permanent sunset glow that gives way to midnight and finally dawn.

The tone is **neon-noir adventure**: playful Goblin taunts, heroic one-liners, dramatic aerial action, and a warm, hopeful ending. There is no gore. Civilians are shown as stylised silhouettes and are always rescued, never harmed on screen.

### 2.2 Beginning — "The city has a new hunter"

The Green Goblin hijacks the Oscorp airwave network at sunset. His face appears on billboards across Manhattan. He announces that the city belongs to him now, and his scout drones begin rounding up civilians on the rooftops.

Spider-Man arrives on a helipad rooftop at the edge of the financial district. The opening cinematic establishes the scale of the city, the Goblin's glider circling in the distance, and the first objective: reach the rooftop signal and find out what the Goblin is planning.

The player swings toward the signal. A Goblin scout drone intercepts them. Web it down, and the Goblin himself appears — taunting from his glider before blasting the rooftop and leading Spider-Man on the first chase.

### 2.3 Middle — "Midnight Run"

The first chase ends with the Goblin escaping into the smoke, but the player has disrupted his scout network. Chapter 2 begins on a different rooftop at midnight. The Goblin has moved downtown, using the narrow streets and bright billboards to break line of sight.

The middle chapter escalates:

- More civilians are trapped on rooftops along the route.
- The Goblin drops bombs more often and flies faster.
- The player can spend upgrade choices earned from chapter clears.
- The chase loops through the city canyon, teaching the player to use building corners, release boosts, and dodge timing.

Narrative beats in this section: the Goblin mocks Spider-Man for "saving people who will never remember his name", and Spider-Man answers by rescuing another civilian mid-chase. The chapter ends with the Goblin's glider trailing smoke as he retreats toward Oscorp Tower.

### 2.4 Final aerial battle — "Goblin's Gambit"

Chapter 3 opens above Oscorp Tower. The Goblin has nowhere left to run. He turns to fight.

At half health the encounter changes phase:

- The Goblin stops running and hovers in the air.
- He throws **double pumpkin bombs** at a faster cadence.
- He telegraphs a **green shockwave** with a warning ring; the player must dodge out of the blast radius.
- The camera pulls wider, the music switches to the boss arrangement, and a full-width boss banner announces the final aerial battle.
- The player must web the Goblin, close the distance with a web-strike, and repeat while managing health and web fluid.

The final blow triggers a slow-motion impact, an explosion on the glider, and the Goblin's defeat.

### 2.5 Ending — "The sky is yours"

The Goblin's glider spins out. Green smoke and sparks trail across the dawn sky as the camera pulls back over the city. The sunrise palette replaces the neon night. Spider-Man lands on a rooftop, the civilians are safe, and the results screen presents the final score, civilian count, and rank.

The closing line is simple: **"The city gets to see another morning."**

### 2.6 Cinematic cutscene list

| Moment | Trigger | Purpose |
| --- | --- | --- |
| Opening cutscene | New run, before chapter 1 | City flyover, Goblin broadcast, hero arrival, tutorial setup |
| Goblin reveal | First scout captured in chapter 1 | Goblin taunt, pumpkin-bomb blast, transition into the chase |
| Chapter 2 intro | Start of chapter 2 | New rooftop, midnight mood, Goblin's next move |
| Chapter 3 intro | Start of chapter 3 | Oscorp Tower, final showdown setup |
| Chapter 1 escape | Goblin health depleted in chapter 1 | Goblin escapes through the smoke; results |
| Chapter 2 escape | Goblin health depleted in chapter 2 | Damaged glider retreats toward Oscorp; results |
| Final defeat | Goblin health depleted in chapter 3 | Slow-motion final strike, glider explosion, victory |
| Dawn victory | Final cutscene end | Sunrise over the city, rank and score presentation |

All cutscenes are skippable with the on-screen **SKIP** button or `Esc`/pause flow. They are rendered in-engine with the same camera, character, and effect systems as gameplay.

---

## 3. Rules

### 3.1 Win condition

Each chapter is won by reducing the Green Goblin's health to zero before the chapter timer expires and before he escapes.

| Chapter | Goblin health | Timer | Civilians | Mood |
| --- | --- | --- | --- | --- |
| Ch. 01 — Neon Heights | 100 | 150 s | 3 | Sunset |
| Ch. 02 — Midnight Run | 110 | 140 s | 4 | Night |
| Ch. 03 — Goblin's Gambit | 120 | 165 s | 4 | Final / green night |

Chapters 1 and 2 end with a story escape: the Goblin is beaten for now, but the chase continues. Chapter 3 ends with the final defeat and the victory screen.

### 3.2 Lose conditions

The player fails a chapter immediately when any of the following happens:

1. **Health depleted.** Spider-Man's health reaches 0.
2. **Goblin escapes.** The Goblin gets more than 245 m away and stays beyond that threshold for 4.5 seconds. A hard distance of 330 m also ends the run instantly.
3. **Timer expires.** The chapter getaway timer reaches zero.

Failure shows a dedicated fail screen with the reason, remaining lives, and **RETRY** / **QUIT** options.

### 3.3 Lives and retries

- The player starts with **3 lives**.
- Each failure consumes one life.
- **Retry** restarts the current chapter from its opening state, keeping the current run score and upgrades.
- Clearing a chapter restores **1 life**, up to the maximum of 3.
- If the player has 0 lives when retrying, the run resets to a fresh chapter 1 with default stats.
- Health and web fluid are refilled at the start of each chapter.

### 3.4 Health, web fluid, and damage

| Resource | Starting value | Notes |
| --- | --- | --- |
| Health | 100 (125 / 150 / 175 with armor upgrades) | Pumpkin bomb: 16 damage. Boss shockwave: 20 damage. Brief invulnerability after a hit. |
| Web fluid | 100 | Web shot costs 18 (15 / 12 / 9 with web upgrades). Regenerates only through pickups and rescues. |
| Dodge i-frames | 0.62 s | Cooldown 1.15 s. Dodge in the movement direction, or forward if no direction is held. |
| Hit invulnerability | 1.25 s | Prevents bomb chain-stun and gives the player time to recover. |

### 3.5 Scoring

| Action | Base points | Multiplier |
| --- | --- | --- |
| Web hit on Goblin | 250 | × combo |
| Web-strike on stunned Goblin | 1,000 | × combo |
| Goblin scout captured | 500 | × combo |
| Civilian rescued | 500 | × combo |
| Field power-up collected | 150 | × combo |
| Time bonus at chapter clear | 18 × seconds remaining | — |
| Civilian bonus at chapter clear | 250 × civilians rescued | — |

Final rank thresholds:

| Rank | Score |
| --- | --- |
| S | Above 42,000 |
| A | Above 30,000 |
| B | Above 18,000 |
| C | 18,000 or below |

### 3.6 Combo meter

- Every scored action starts or extends a **5.2-second combo window**.
- Consecutive actions increase the multiplier: x1 → x2 → … → **x9**.
- Taking damage breaks the combo and resets it to zero.
- Combo feedback escalates with words such as **NICE!**, **GOOD!**, **SWEET!**, **AMAZING!**, **SPECTACULAR!**, and **UNSTOPPABLE!**
- The HUD shows the multiplier, combo word, and a pulse when the chain is active. Hits also trigger brief slow-motion and camera shake to sell impact.

### 3.7 Field power-ups

Two floating pickups are distributed along each chapter route on rooftops:

| Pickup | Visual | Effect |
| --- | --- | --- |
| **Bio-Mesh** | Green octahedron with a spinning ring | +30 health, +10 web fluid |
| **Web Capsule** | Cyan octahedron with a spinning ring | +45 web fluid, +8 health |

Power-ups bob and spin, emit a coloured glow, and are collected by flying within 4.2 m. Each grants score and a short impact burst. They are optional, but they reward route exploration and make the final boss phase more survivable.

Civilians are the other major field reward. Rescue them by flying within 22 m and pressing **R** / the **RESCUE** touch button:

- +14 health
- +18 web fluid
- +500 × combo score
- One civilian counted toward the chapter's rescue total and the final results

### 3.8 Progression and upgrades

After each of the first two chapters, the player chooses **one of three upgrade cards** (the fourth rotates into the pool on later clears). Upgrades persist for the run.

| Upgrade | Effect | Fantasy |
| --- | --- | --- |
| **Spider-Sense** (Armor Weave) | +25 maximum health | Survive one more bomb |
| **Tensile Tension** (Web Formula) | +35% web-stun duration (2.7 s → 3.6 s per stack) | Longer strike windows |
| **Kinetic Pump** (Momentum) | +18% swing acceleration and launch | Faster route, more speed |
| **Wide Web** (Utility Belt) | Web shots cost 3 less and recharge faster | More thwip per fight |

Chapter clears also restore 30 health for the next chapter and award the time/civilian bonuses described above.

### 3.9 Difficulty and all-ages tuning

- Aim assist: the web shot and web-strike accept targets up to **135 m**, so the player never has to pixel-hunt a moving Goblin.
- Forgiving traversal: holding the swing button automatically attaches a new web when airborne and off cooldown.
- Clear telegraphs: bombs have orange trails and a ground explosion; the boss shockwave has a green warning ring and a 0.75 s fuse.
- No fail state for falling: the player lands on streets or rooftops and can swing again.
- Optional challenge: score, combo, civilian count, and rank give experienced players a reason to replay.

---

## 4. Gameplay Style

### 4.1 Genre and platform

A **third-person 3D action chase** with arcade traversal and light combat. The camera sits behind the hero, the city is explored vertically, and the primary loop is movement rather than cover shooting. It is designed for:

- **PC browser**: keyboard + mouse, optional gamepad.
- **Mobile browser**: touch joystick, drag-look, on-screen action buttons.
- **Single player**: no multiplayer, no network dependency.

### 4.2 Core loop

1. **Read the objective.** The HUD names the current task and the world marker shows the target distance.
2. **Swing toward the target.** Jump, hold to attach, steer with the camera, release at the top for a boost.
3. **Engage the target.** Web the Goblin or scout, then close with a web-strike; dodge bombs and shockwaves.
4. **Collect and rescue.** Grab power-ups and civilians on the route for health, web fluid, and score.
5. **Clear the chapter.** Deplete the Goblin's health, watch the escape/final cutscene, review results, pick an upgrade.
6. **Repeat with escalation.** Chapter 2 is faster and darker; chapter 3 adds the boss phase and double bombs.

### 4.3 Traversal model

- **Anchors** are generated around the roof rim of every building. The game scores candidate anchors by distance, height, and camera direction, then attaches a rope to the best available point.
- **Rope constraint**: while swinging, the player is pulled toward the anchor if the rope is taut, gravity pulls them down, and steering input adds lateral acceleration. Releasing converts the swing into a forward/upward launch.
- **Auto-attach**: holding the swing input while airborne fires a new line when the attach cooldown is ready.
- **Ground movement**: running, jumping, and a short dodge burst let the player reposition on rooftops and streets.
- **Landing**: rooftop and street surfaces resolve vertically; side collisions keep the player outside building volumes.
- **Camera**: follows behind, pulls back with speed, raises while airborne, auto-aligns toward velocity when the player is not manually looking, and avoids clipping through buildings.

### 4.4 Combat model

- **Web shot (`E` / WEB SHOT)**: fires a visible web strand at the Goblin or scout. On the Goblin it applies a stun (2.7 s base); on a scout it captures the drone instantly.
- **Web-strike (`F` / STRIKE)**: only works while the Goblin is stunned. Spider-Man zip-dashes to the target, triggers slow-motion, and deals 25 damage. The dash is invulnerable during the approach.
- **Dodge (`Shift` / DODGE)**: short directional burst with 0.62 s of invulnerability; used to escape bombs and shockwaves.
- **Pumpkin bombs**: the Goblin leads the player's velocity and throws arcing bombs with orange trails. They explode on impact or fuse timeout, dealing 16 damage within a 9 m radius.
- **Boss shockwave**: a telegraphed green ring around the Goblin. After 0.75 s it deals 20 damage within 46 m unless the player dodges out or is invulnerable.
- **Rescue (`R` / RESCUE)**: heals and refills web fluid when a civilian is within 22 m.

The intended combat rhythm is **web → dodge → strike → reposition → web**. The player is always moving, and the Goblin's position doubles as the next traversal target.

### 4.5 Chase pressure

- The Goblin follows a closed Catmull-Rom route through the city. His speed, bomb interval, and health scale up per chapter.
- The HUD shows distance to the Goblin. Beyond 245 m the escape timer starts; beyond 330 m the chase ends immediately.
- The chapter timer is always visible during a chase and turns red when critical.
- The Goblin's health bar sits below the timer, with contextual notes: **WEB HIM, THEN STRIKE**, **STUNNED — STRIKE NOW**, **GOBLIN ESCAPING — SWING FASTER!**, and **FINAL AERIAL BATTLE**.

### 4.6 Level structure

Each chapter is a hand-authored route through the procedural city:

- **Chapter 1 — Neon Heights**: sunset, wide rooftop-to-rooftop swings, 3 civilians, 150 s. Teaches swing, web, scout capture, and the first chase.
- **Chapter 2 — Midnight Run**: night, tighter downtown route, 4 civilians, 140 s. Faster Goblin, shorter bomb interval, first upgrade choice.
- **Chapter 3 — Goblin's Gambit**: green final mood, route around Oscorp Tower, 4 civilians, 165 s. Boss phase at 50% health, double bombs, shockwaves, final cutscene and victory.

### 4.7 Controls

#### PC

| Action | Keyboard / Mouse | Gamepad |
| --- | --- | --- |
| Move | `WASD` / arrow keys | Left stick |
| Look | Mouse (pointer lock) | Right stick |
| Jump / hold to swing | `Space` | South face button (A / cross) |
| Web shot | `E` | West face button (X / square) |
| Web-strike | `F` | North face button (Y / triangle) |
| Dodge | `Shift` | East face button (B / circle) |
| Rescue | `R` | Left bumper / L1 |
| Pause | `Esc` | Start / options |

#### Mobile

| Action | Input |
| --- | --- |
| Move / steer | Left virtual joystick |
| Look / aim camera | Drag on the right side of the screen |
| Jump / swing | **WEB / SWING** button: tap to jump, hold to swing, release to launch |
| Web shot | **WEB / SHOT** button |
| Web-strike | **STRIKE** button |
| Dodge | **DODGE** button |
| Rescue | **RESCUE** button |

The mobile layout places the joystick bottom-left and a five-button action cluster bottom-right, with the status rail lifted above the controls so health, web, and lives remain readable. Keyboard prompts are hidden on narrow touch layouts; the button labels carry the instructions.

### 4.8 Accessibility and onboarding

- Large, high-contrast HUD text with short labels.
- Colour is never the only signal: markers use shape, label, and distance.
- Screen-shake, slow-motion, and speed lines can be reduced by the browser's **prefers-reduced-motion** setting.
- Tutorial objectives are phrased as actions, not systems: "SWING TO THE ROOFTOP SIGNAL", "WEB THE GOBLIN SCOUT".
- Failure is immediate and retryable; the player never loses more than the current chapter attempt.
- No timers on cutscenes; they can be skipped.

---

## 5. Visual and Animation Style

### 5.1 Art direction

**Stylised 3D cartoon-realism.** The game uses low-poly, hand-built geometry with strong silhouettes, emissive neon accents, and a painterly sky. It is not photoreal: the goal is a playable comic-book diorama with enough material detail to feel like a place.

Key visual rules:

- **Hero:** saturated red and blue, black web lines, large white eye lenses, readable limbs. A warm key light and a cyan rim light separate him from the city.
- **Goblin:** dark green armour, purple tunic, yellow eyes, bat-wing glider, green engine trails. He is the only major green light source in most scenes.
- **City:** deep blue and charcoal towers, warm window grids, cyan lane strips, red aviation beacons, Oscorp green signage, and giant billboard light.
- **Palette progression:** sunset orange/pink → midnight blue/cyan → toxic green/black → dawn gold.
- **Contrast:** the hero's warm red/blue against the cool city; the Goblin's green against everything else.

### 5.2 Environment

- Procedural grid city with an open central avenue, varied building heights, setback crowns, rooftop AC units, vents, crates, pipes, billboards, helipads, and neon roof trim.
- Rooftop surfaces use generated panel textures with helipad markings on the starting roof and signal rings on the waypoint roof.
- Traffic moves down the avenue with emissive headlights and taillights.
- A police helicopter circles with a soft searchlight cone.
- Fog, stars, and a custom sky shader carry the time-of-day mood.
- Four lighting moods: **sunset**, **night**, **final**, and **dawn**.

### 5.3 Characters and animation

All characters are procedurally modelled and animated; there are no imported rigs or animation clips.

- **Spider-Man:** capsule-based body with a black spider emblem, mask webbing, eye lenses, articulated shoulders, elbows, hips, knees, and hands. Poses blend between idle, run, swing, fall, shoot, strike, and dodge.
- **Green Goblin:** armoured body, tunic, helmet, yellow eyes, articulated arms, and a bat-wing glider with animated banking and engine glow.
- **Scout drone:** compact hovering drone with red eye glow and a capture animation.
- **Civilians:** simple stylised figures with idle panic and rescue poses.

Animation principles:

- **Anticipation:** the web arm reaches before the line attaches; the strike pose coils before the dash.
- **Follow-through:** the free arm trails during swings; the body banks into turns; the glider rolls through corners.
- **Impact:** hit-stop-style slow-motion, camera shake, particle bursts, and shockwave rings on every major hit.
- **Readability:** silhouettes are exaggerated; the Goblin is always visually distinct from the city.

### 5.4 Camera and effects

- Third-person chase camera with speed-based distance and FOV.
- Auto-align toward velocity when the player is not actively looking.
- Building-aware camera collision to avoid clipping through towers.
- Hand-authored cutscene camera moves with eased interpolation between key positions and targets.
- **Effects:** bloom post-processing, speed lines, slow-motion colour grade, damage flash, web splats, explosion sprites, shockwave rings, dust, engine trails, and title-screen Goblin smoke.
- **Slow-motion:** triggered by web hits, strikes, boss phase entry, and final blows; it scales gameplay time to 28% for a short window.

### 5.5 UI and typography

- Condensed display type (Barlow Condensed) for chapter titles and score; Rajdhani for technical labels.
- Angular, clipped panels with thin neon borders.
- Red for danger and the hero, cyan for traversal and web, green for the Goblin and rescues, gold for score and objectives.
- World markers project 3D objectives to screen space and clamp to the edge with a distance label when off-screen.
- The reticle tracks the current web target instead of sitting over the hero.
- Touch controls use translucent circular buttons with large labels and safe-area padding.

### 5.6 Audio

The entire score and soundscape are synthesized at runtime with the Web Audio API:

- Layered synth/orchestral pads, bass pulses, arpeggios, and percussion that shift between calm, chase, and boss scenes.
- SFX for jump, swing, web thwip, web hit, strike, explosion, damage, rescue, slow-motion, UI, and the Goblin's laugh.
- Audio unlocks on the first user interaction (browser autoplay policy).
- A sound toggle is available on the title screen and pause menu.

---

## 6. First Level — Moment-by-Moment First Two Minutes

This beat sheet describes the opening of **Chapter 1: Neon Heights**, from the title screen to the first Goblin chase. Times are approximate and assume the player follows the objective; skilled players can move faster, and the cutscene can be skipped.

| Time | Beat | Player experience | Systems / feedback |
| --- | --- | --- | --- |
| **0:00–0:12** | Title screen | Neon city, Spider-Man on a helipad, Goblin glider in the distance. The logo reads **SPIDER-MAN: NEON PURSUIT**. | Title camera orbit, ambient city, synth pad, **START PURSUIT** and **HOW TO PLAY**. |
| **0:12–0:20** | Start pressed | The camera pulls into the opening cinematic. HUD hides; cinematic bars slide in. | Audio switches to the calm cinematic cue. |
| **0:20–0:34** | Opening cinematic | A billboard broadcast reveals the Goblin's takeover. Spider-Man lands on the rooftop as the camera sweeps across the skyline. | In-engine cutscene: Goblin taunt, city flyover, hero landing. **SKIP** available. |
| **0:34–0:40** | Control handoff | Cinematic bars retract. The HUD appears: chapter name, objective, score, health, web, lives. The hero stands on the helipad. | Objective: **SWING TO THE ROOFTOP SIGNAL**. Prompt: **SPACE — JUMP · HOLD TO SWING**. World marker shows the signal distance (about 165 m). |
| **0:40–0:48** | First jump | Player presses `Space`. Spider-Man jumps; the camera lifts and pulls back slightly. | Jump SFX, dust burst, air-control state. |
| **0:48–0:56** | First swing | Player holds `Space` in the air. A web line snaps to a rooftop anchor. The rope tightens and the hero arcs forward. | Web thwip, anchor glow, speed lines begin, FOV widens. |
| **0:56–1:06** | Momentum lesson | The player releases at the top of the arc and launches. They re-press to chain the next swing. The city opens up below. | Release boost, swing SFX, camera auto-align, objective marker stays on the signal. |
| **1:06–1:14** | Rooftop signal reached | The player swings within 17 m of the signal rooftop. A yellow impact ring and a **SIGNAL REACHED** toast confirm the objective. | Tutorial stage advances. The signal beam marks the waypoint. |
| **1:14–1:20** | Scout appears | A Goblin scout drone rises ahead with a red eye. The chapter card changes to **WEB THE GOBLIN SCOUT**. | Prompt: **E — WEB SHOT · STOP THE SCOUT**. Drone begins strafing. |
| **1:20–1:26** | First web shot | Player presses `E`. A white web strand snaps out, splats the drone, and wraps it. Slow-motion and a +500 score pop. | Web hit SFX, capture animation, combo x1, **SCOUT WRAPPED UP**. |
| **1:26–1:34** | Goblin reveal | The captured scout sparks. The Goblin's glider drops out of the sun, engines screaming. Cinematic camera cuts to his face. | Boss laugh, **WELL, WELL... THE SPIDER CAME OUT TO PLAY.** Camera pushes in. |
| **1:34–1:42** | Rooftop blast | The Goblin hurls a pumpkin bomb into the rooftop. The screen shakes, orange fire and smoke burst, and he banks away. | Explosion SFX, camera shake, **YOU WANT THE CITY? COME AND TAKE IT.** HUD returns. |
| **1:42–1:50** | Chase starts | The getaway timer appears at **2:30**. The Goblin health bar and distance readout slide in. The Goblin is about 100 m ahead. | Objective: **TAKE DOWN THE GREEN GOBLIN**. Music switches to the chase arrangement. Prompt: **E — WEB SHOT** when in range. |
| **1:50–2:00** | First pursuit | Player swings after the Goblin. A pumpkin bomb arcs toward the rooftop; the player dodges or eats 16 damage. The first web hit is available if they close distance. | Timer ticks, bombs leave orange trails, reticle locks to the Goblin when in range, distance marker updates. |

**What the first two minutes teach, without a tutorial menu:**

1. Hold to swing; release to launch.
2. Follow the objective marker.
3. Web a target at range.
4. The Goblin is the target; the chase is the level.
5. Bombs are dangerous; movement is survival.

**Optional first-minute discoveries:** the player can ignore the signal for a few seconds and explore the starting rooftop, find the helipad markings, or test the dodge. The Goblin does not attack until the scout is captured, so the opening is safe for experimentation.

### 6.1 Extended chapter 1 flow (after the first two minutes)

| Time (approx.) | Beat |
| --- | --- |
| 2:00–2:20 | First web hit on the Goblin; **STUNNED — STRIKE NOW** prompt; first web-strike and slow-motion impact. |
| 2:20–3:00 | Chase through the sunset rooftops; bombs every ~5 seconds; first civilian marker appears on a nearby roof. |
| 3:00–3:30 | Optional rescue and power-up pickups; combo can reach x3–x5. |
| 3:30–4:30 | Goblin health drains through repeated web → strike cycles; distance pressure forces the player to keep swinging. |
| 4:30–5:00 | Final hit; Goblin's glider spins out; escape cutscene; chapter results with score, civilians, best combo, and time. |
| 5:00–5:20 | Upgrade choice; chapter 2 begins. |

---

## 7. Content Summary

### 7.1 Chapters

| Chapter | Route character | New pressure | Story beat |
| --- | --- | --- | --- |
| **Neon Heights** | Wide sunset rooftops, first signal, scout tutorial | Timer, first bombs, first stun/strike | Goblin reveal and first chase |
| **Midnight Run** | Tighter downtown loop, more civilians, darker visibility | Faster Goblin, shorter bomb interval, upgrade choice | Goblin retreats toward Oscorp |
| **Goblin's Gambit** | Oscorp Tower loop, green night palette | Boss phase, double bombs, shockwaves, final cutscene | Final defeat and dawn |

### 7.2 Enemy and hazard roster

| Entity | Behaviour | Counter |
| --- | --- | --- |
| **Green Goblin (chase)** | Follows a route, throws leading bombs, flees at speed | Web to stun, strike to damage, keep distance low |
| **Green Goblin (boss)** | Hovers, throws double bombs, charges shockwaves | Dodge the ring, web between bomb volleys, strike in the stun window |
| **Scout drone** | Hovers ahead, strafes, marks the first combat lesson | One web shot captures it |
| **Pumpkin bomb** | Arcing projectile with a 9 m blast radius | Dodge, keep moving, use buildings as cover |
| **Boss shockwave** | 46 m radial blast after a 0.75 s telegraph | Dodge i-frames or leave the radius |

### 7.3 Reward schedule

- **Immediate:** score pops, combo words, slow-motion, screen shake, audio stingers.
- **Per encounter:** scout capture (+500), web hit (+250), strike (+1,000), rescue (+500).
- **Per chapter:** time bonus, civilian bonus, +1 life (up to 3), +30 health carry-over, upgrade choice.
- **Per run:** final score, civilian total, rank S/A/B/C.
- **Mastery:** faster routes, higher combos, all-civilian clears, no-damage attempts.

---

## 8. Technical Design

### 8.1 Stack

- **Three.js** for rendering, scene graph, procedural geometry, cameras, and post-processing.
- **Vite** for development and static production builds.
- **Web Audio API** for procedural music and SFX.
- **HTML/CSS** for all UI, HUD, title, results, upgrades, pause, fail, and victory screens.
- **Playwright** used during development for visual QA and screenshots.

### 8.2 Systems

| System | Implementation |
| --- | --- |
| City | Procedural grid of ~48 buildings plus background skyline, street, traffic, helicopter, billboards, rooftop props, and mood lighting |
| Anchors | Eight rim anchors per building, scored at swing time by distance, height, and camera direction |
| Movement | Velocity integration, gravity, rope constraint, steering acceleration, jump, dodge, landing, side collision |
| Chase | Closed Catmull-Rom route, distance tracking, escape timer, bomb leading, boss hover phase |
| Combat | Web bolts, stun timer, strike dash, damage, invulnerability, combo scoring, slow-motion |
| Power-ups | Route-spawned rooftop pickups with bob/spin animation and proximity collection |
| UI | DOM HUD, projected world markers, clamped off-screen indicators, track reticle, toasts, results and upgrade screens |
| Audio | Layered oscillators/noise buffers, scene crossfades, positional-ish one-shots |
| Rendering | ACES tone mapping, bloom composer, fog, sky shader, emissive materials, canvas textures |

### 8.3 Performance notes

- Pixel ratio is capped (renderer 1.7, composer 1.5) to keep fill rate manageable.
- Geometry and textures are shared where possible; facade textures are cloned per building but generated once.
- The city uses simple box colliders rather than physics meshes.
- Bloom is a single UnrealBloomPass; no expensive global illumination or shadows.
- Mobile uses the same scene with CSS-scaled HUD and touch controls; lower-end devices can run a smaller viewport.

### 8.4 Persistence

No save data is written. The run state (score, lives, upgrades, civilians) lives in memory for the session. Refreshing the page starts a new run.

---

## 9. Assumptions and Out of Scope

The following assumptions were made while building the prototype:

- **Fan concept.** This is an unlicensed fan game created as a design and engineering exercise. It is not affiliated with Marvel or Sony.
- **Procedural art only.** No external models, textures, animations, music, or voice files are used. Everything is generated in code or canvas.
- **Browser target.** The game is designed for modern desktop and mobile browsers with WebGL and WebAudio. It is not a native console or app-store build.
- **Arcade scope.** The city is a chase stage, not a full open-world. There are no interiors, side quests, shops, or NPC dialogue trees.
- **Single-player only.** No multiplayer, leaderboards, cloud saves, or accounts.
- **Content rating.** Stylised action violence only: bombs, energy blasts, and knocked-out drones. No blood or graphic harm.
- **Session length.** A full run is tuned for 8–12 minutes. The first two minutes are the onboarding; chapters 2 and 3 escalate difficulty.
- **Accessibility.** Reduced-motion support is provided through the browser media query. Full remapping, colour-blind palettes, and subtitle localisation are future work.

### Future extensions

- Additional chapters and villains (Vulture, Electro, Rhino chase).
- Time-trial and score-attack modes.
- Cosmetic suits and web-line styles.
- Full controller remapping and accessibility menu.
- Persistent best scores and ghost replays.
- More civilian rescue variety and rooftop events.
- Dynamic weather and a true day/night cycle.

---

## 10. Playtest Checklist

Use this checklist when validating a build:

- [ ] Title screen loads with the 3D city, hero, and Goblin visible.
- [ ] Start opens the cutscene; skip works; HUD appears on handoff.
- [ ] Jump, hold-to-swing, release boost, and auto-attach all work.
- [ ] The rooftop signal triggers the scout spawn.
- [ ] Web shot captures the scout and starts the Goblin reveal.
- [ ] The chase HUD shows timer, Goblin health, distance, and objective.
- [ ] Web hit stuns; strike damages; combo and slow-motion trigger.
- [ ] Bombs damage and can be dodged; health failure works.
- [ ] Timer failure and escape failure show the correct fail screen.
- [ ] Retry consumes a life and restarts the chapter.
- [ ] Chapter clear shows results and upgrade cards.
- [ ] Upgrades apply to the next chapter.
- [ ] Boss phase triggers at 50% health in chapter 3; shockwave telegraphs and damages.
- [ ] Victory shows score, civilians, and rank.
- [ ] Mobile layout keeps the joystick, action buttons, status rail, and objective readable.
- [ ] No console errors other than optional external requests.
- [ ] `npm run build` succeeds and the production build runs.

---

*Document version 1.0 — written for the playable prototype in this repository.*

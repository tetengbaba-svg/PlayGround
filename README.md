# Spider-Man: Neon Pursuit

A playable 3D web-swinging chase game built with Three.js and Vite. Swing across a neon-lit Manhattan, web up Goblin scouts, rescue civilians, and take down the Green Goblin before the getaway timer runs out.

> Fan-made concept. Not affiliated with or endorsed by Marvel. All art, audio, and code in this repository are procedurally generated for this prototype.

![Title screen](screenshots/title3.png)

## Play it

```bash
npm install
npm run dev
```

Open the URL printed by Vite (the configured dev port is `http://localhost:3002`).

Production build:

```bash
npm run build
npm run preview
```

The build is a static site; deploy the `dist/` folder anywhere that serves static files.

## What is in the game

- **Three chapters** across sunset, midnight, and a green-lit final showdown above Oscorp.
- **Momentum web-swinging** with rooftop anchors, rope constraint physics, jump/hold auto-attach, and a release boost.
- **Chase combat** against the Green Goblin: web him to stun, then web-strike for big damage and slow-motion impacts.
- **Pumpkin bombs, dodge i-frames, shockwaves, and a final aerial boss phase** where the Goblin hovers and doubles his bomb pressure.
- **Rescue objectives and field power-ups**: free trapped civilians for health/web refills; grab Bio-Mesh and Web Capsule pickups on the route.
- **Scoring and combos** with a x9 multiplier, chapter results, four upgrade paths, three lives, and a final rank.
- **Cinematic presentation**: opening, reveal, chapter intros, escape, final battle, and dawn victory cutscenes, all rendered in-engine.
- **Procedural audio**: synth/orchestral score and sound effects generated with WebAudio; no audio files required.
- **Desktop and mobile UI**: keyboard + controller + mouse on PC; on-screen joystick, look drag, and action buttons on touch devices.

## Controls

### PC

| Action | Keyboard / Mouse | Controller |
| --- | --- | --- |
| Move / steer | `WASD` or arrow keys | Left stick |
| Look / aim camera | Mouse (click the scene to lock the pointer) | Right stick |
| Jump / hold to swing | `Space` | `A` / cross |
| Web shot (stun Goblin / capture scout) | `E` | `X` / square |
| Web-strike (when Goblin is stunned) | `F` | `Y` / triangle |
| Dodge | `Shift` | `B` / circle |
| Rescue nearby civilian | `R` | `LB` / L1 |
| Pause | `Esc` | `Start` / options |

Release `Space` at the top of a swing to launch. Hold it while falling to attach the next web automatically.

### Mobile / touch

- **Left joystick**: move and steer.
- **Drag the right side of the screen**: orbit the camera.
- **WEB / SWING**: tap to jump, hold to swing; release to launch.
- **WEB / SHOT**: web the Goblin or a scout.
- **STRIKE**: web-strike a stunned Goblin.
- **DODGE**: dodge with brief invulnerability.
- **RESCUE**: pick up a nearby civilian.

## Rules at a glance

- Finish each chapter by depleting the Goblin's health bar before the timer expires.
- You fail if your health reaches zero, the Goblin gets too far away for too long, or the getaway timer hits zero.
- Each failure costs one of three lives. Clearing a chapter restores a life (up to three).
- Web hits score 250 × combo; web-strikes score 1,000 × combo; scouts and civilians add bonus score.
- Keep hits chained within 5.2 seconds to build the combo multiplier up to x9.
- At the end of a chapter, choose one of four upgrades: extra health, longer stun, stronger swing, or cheaper web.

Full design, story, scoring tables, visual direction, and the first-two-minutes beat sheet are in [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md).

## Project layout

```text
index.html          UI screens, HUD, touch controls
src/main.js         renderer, bloom composer, game loop, resize
src/game.js         level flow, physics, chase, combat, camera, scoring
src/city.js         procedural city, rooftops, traffic, lighting, moods
src/characters.js   hero, Goblin, scout drone, citizens
src/effects.js      particles, webs, explosions, shockwaves
src/audio.js        procedural score and SFX
src/ui.js           DOM HUD, markers, results, upgrades, input bindings
src/style.css       responsive neon UI and touch layout
```

## Assumptions and limitations

- This is a fan concept, not a licensed Marvel product.
- There are no external models, textures, or audio files. All visuals are procedural Three.js geometry and canvas textures; all sound is synthesized at runtime.
- The city is a stylized 3D backdrop rather than a fully simulated open world. Buildings are solid for collision and swinging, but interiors and street-level missions are out of scope.
- Progress is session-only; there is no save system.
- The game is tuned for a short arcade run of roughly 8–12 minutes across three chapters.
- Performance depends on the device GPU. The renderer caps pixel ratio and uses a lightweight bloom pass; low-end mobile devices may prefer a smaller viewport.

---

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/tetengbaba-svg/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/tetengbaba-svg/PlayGround)

- 🎮 [Open the project](https://go.ondev.store/tetengbaba-svg/PlayGround).
- ✨ [Remix this project](https://go.ondev.store/tetengbaba-svg/PlayGround?remix=1).
- 💻 [Explore the source](https://github.com/tetengbaba-svg/PlayGround).
- 🛠️ [Check build runs](https://github.com/tetengbaba-svg/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/tetengbaba-svg/PlayGround/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/tetengbaba-svg).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
<!-- omgithub:readme:end -->

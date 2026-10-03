# Joker’s Run

A playable third-person arcade flight combat demo. Launch from a retreating carrier, complete flight and weapons checks, intercept three recon aircraft, fight their escorts, chase a scout through coastal cliffs and a bridge, engage a two-stage ace, then stop a final transmission before returning to the fleet.

## Run

```sh
npm ci
npm run dev
```

Open **http://localhost:5177** and select **Launch mission**. Click inside the game before using the keyboard. The catapult takes four seconds. Escape opens the complete controls and settings.

```sh
npm run build       # type-check and create dist/
npm run preview     # serve the production build on port 5177
npm test            # flight, weapons, mission failure and progression tests
npx tsx scripts/simulate.ts  # deterministic pilot using the normal flight/weapon rules
```

The production output is a static site: serve the contents of `dist/` over HTTP. No account, API key, backend, or paid asset is required.

## Fly

| Control             | Action                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| W / S, Up / Down    | Climb / dive                                                             |
| A / D, Left / Right | Bank and turn                                                            |
| Shift               | Boost; releases to recharge                                              |
| C / Ctrl            | Brake and turn tighter                                                   |
| Space / left click  | Guns; release to cool                                                    |
| E / right click     | Fire a missile after acquiring a lock                                    |
| Tab                 | Select the next target                                                   |
| X, held             | Pursuit assist; steers toward the selected target or tutorial checkpoint |
| Q                   | Barrel roll; evade incoming missiles                                     |
| F                   | Flares                                                                   |
| R                   | Wingmen: cover, attack scouts, split                                     |
| Escape              | Pause, controls, settings, restart                                       |

Touch devices have a virtual flight stick and buttons. Landscape gives the clearest view. Mouse steering, reduced motion, low graphics, and spoken radio are available in the pause menu. Audio starts after a user gesture; radio captions always appear. Spoken radio uses an installed browser/system voice when available.

## Mission rules

- The flight check rewards both performing each maneuver and passing cleanly through its checkpoint. Fast execution builds the Hot Start score multiplier.
- Keep targets within the forward sight to build missile lock. Boosting makes locks slower. Missiles reload automatically; guns overheat under sustained fire.
- The second training drone must be destroyed with guns.
- Scout damage interrupts transmission. Escort kills add fifteen seconds to the data clock. Wingman orders change the enemy type your squad attacks.
- Guns, close-range kills, combo chains, and taking no damage award additional points.
- The lead scout follows a real route through a canyon and underneath a bridge. Terrain collisions cause hull damage.
- The ace loops and dodges missiles, then attacks more aggressively below half health. Destroying it awards 10,000 base points. The final scout can demand your attention while the ace is still alive.
- All three scouts must die to win. An expired transmission/escape clock or a destroyed aircraft ends the mission.
- Killing scouts early changes the later sequence rather than making them invulnerable. A fast assisted pilot can beat the mission in around six minutes; eight to ten minutes is the design target for a first play, not a verified human timing claim.
- The result screen saves the best score in local storage. Breakout is a next-mission tease, not a second playable level.

## Implementation

TypeScript, Vite, and [Three.js](https://threejs.org/). The aircraft, ships, islands, bridge, ocean, sky, effects, and music are procedural. The interface uses Barlow and Barlow Condensed. See `docs/DESIGN.md` for the interaction contract and `docs/VERIFICATION.md` for test evidence and limits.

`src/core.ts` owns simulation and mission state. `src/world.ts` renders it. `src/hud.ts` presents targeting and instruments. `src/audio.ts` synthesizes sound and music. `src/main.ts` handles input, focus, and the fixed-step loop. Read-only `window.joker` telemetry exposes state, recent events, errors, and frame samples for diagnosis; it does not contain mission-skip or invulnerability controls.

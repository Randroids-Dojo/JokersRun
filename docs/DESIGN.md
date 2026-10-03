# Joker's Run: playable demo contract

Third-person arcade flight. The player continuously steers, closes distance, lines up guns, earns missile locks, and chooses which enemy to pursue. The fleet is retreating beneath the fight. No long briefing or character introduction.

## Visual direction

The memorable object is the fighter in flight: pale swept wings, twin orange exhausts, dark canopy, orange squadron marks. Render the world in stylized, faceted 3D, with teal water, chalk cliffs, a gold sun and a storm at the far horizon. Use an instrument overlay with open space around the aircraft, sparse white typography and amber prompts. All-caps belongs to the aircraft instruments and mission warnings here.

Palette: deep sea #174d61, haze #9ac5ce, chalk #bbc8b3, instrument white #edf4e7, warning coral #ff745c, signal gold #ffd38a. Condensed Impact/Arial Narrow mission display; system sans for prompts; monospace only for instrument values. Left objective, centered compass and aim, right score, lower-left radar, lower-right weapons, bottom-center radio. No web-page card grid over the game.

## Verbs and constraints

| Input                                  | Action and consequence | Resistance                                    | Feedback                                               |
| -------------------------------------- | ---------------------- | --------------------------------------------- | ------------------------------------------------------ |
| WASD / arrows; optional mouse steering | Pitch and turn in 3D   | Momentum, altitude, collision                 | Aircraft bank, horizon, speed and altitude instruments |
| Shift / Ctrl                           | Boost / brake          | Rechargeable boost; high-speed lock is slower | Exhaust, speed lines, wider field of view, audio       |
| Space / left click                     | Fire guns              | Range and forward aim, overheating            | Tracers, hit marker, sparks, kill score                |
| E / right click                        | Fire homing missile    | Acquire lock, reload, ace evasion             | Lock diamond, tone, missile smoke, explosion           |
| Q                                      | Barrel roll            | Cooldown                                      | Full rotation, temporary missile evasion               |
| F                                      | Flares                 | Recharge                                      | Visible burst and broken incoming missiles             |
| Tab                                    | Cycle targets          | Position and distance                         | Target marker and offscreen bearing                    |
| X (hold)                               | Pursuit assistance     | Steers the same flight model; never fires     | Selected target gradually enters sight                 |
| R                                      | Cycle wingman orders   | Attack scouts, cover, or split                | Formation changes, actual attacks, radio confirmation  |

## Mission progression

1. Four-second carrier catapult; radio immediately. Five timed movement checkpoints, each awards execution and clean-passage points. Hot Start rewards fast flying.
2. Three drones: missile lock, guns-only armored drone, evasive drone. No progress without actual kills.
3. Warning; three scouts and six escorts. 90-second data clock. Damage pauses transmission; escort kills add time. Scouts have individual upload meters. Wingmen can split targets.
4. Dogfight with the surviving escorts, clouds and coastal terrain. Gun/missile/close-range and no-damage bonuses; combo expires if pressure stops.
5. Lead scout dives along a route through cliffs, canyon and bridge to open sea. The player must close or risk an escape.
6. Ace makes a head-on entrance. Two stages: loops and evasions, then aggressive passes below 50% health. 10,000-point kill and an uninterrupted-combo bonus.
7. Final scout accelerates during the ace encounter (or on the ace's destruction). 25 seconds to intercept. Ace destruction is optional when the last scout runs.
8. Mission clear only after every scout is destroyed. Radio, fleet return, storm-front tease, next mission: Breakout. Score/rank, local best, replay.

The mission adapts when scouts die early rather than granting them invisible invulnerability. The target duration is 8–10 minutes for a first play; a skilled pilot can finish sooner. Failure and restart are concrete states. A pause freezes all simulation and audio. Losing focus releases held input and pauses.

## Verification boundary

Build/type checks, deterministic mission/combat tests, actual browser input, screenshot review, mobile layout and input cleanup. Simulation tests can establish mechanics and transitions. Screenshots establish appearance. Neither establishes subjective enjoyment or human listening quality.

# Verification receipt

2026-10-03. Campaign demo verification.

## Automated checks

- `npm run build`: passes strict TypeScript checking and builds the static site.
- `npm test`: 19 passing tests. Covers catapult timing; steering, acceleration and key release effects; pause; missile acquisition and projectile damage; the gun-only drone; overheating/cooling; interrupted transmissions; escort time extensions and upload meters; failure and restart; flares and rolls; ace stages; final-scout priority; early scout kills; canyon geometry; return-flight altitude; frozen completion time; and split-wingman assignments.
- Full deterministic pilots use the normal flight, gun, missile, countermeasure and pursuit rules, without direct damage or phase edits. Both strategies finish with all three scouts destroyed. Scout-first: 356.93 seconds. Escort-first: 416.58 seconds. These are automated expert/assist timings, not measured first-time human play.
- The built site is approximately 752 KB including local fonts. Vite reports an advisory for the 523.65 KB Three.js engine chunk (132.37 KB gzip); the game chunk is approximately 67.6 KB (24.1 KB gzip).

## Browser evidence

The T3 collaborative preview was used for navigation, interaction, state inspection and screenshots. Its initial screenshot path failed; navigating with the environment-port target restored screenshots. Recording remained unavailable.

An initial browser run used keyboard events for the full campaign and reached mission clear at 365.88 simulation seconds with three scouts destroyed, 90 hull, 45,382 points and no captured runtime errors. Every mission phase appeared in order. This run exposed a return-flight dive and a debrief timer that continued counting after success; both are fixed and covered by regression tests.

The preview throttles animation while its pane is not visible. Test-only scheduling in the browser used timer-driven animation callbacks so input and simulation could advance normally; an additional final-build pass invoked the captured render callback in bounded batches with controlled timestamps. The ordinary game still uses requestAnimationFrame and a fixed 60 Hz simulation. The final production-build run reached mission clear at 366.68 seconds with 90 hull, 50,530 points, all three scouts destroyed, every campaign phase visited, and zero captured runtime errors. The return flight remained above water and the debrief correctly froze its flight time at 6:06. These tests do not establish frame-rate or input-latency performance for a player's device.

Independent browser checks established:

- Keyboard climb/turn/boost changed pitch, heading, position and speed. Releasing the keys emptied held input.
- Escape froze the entire simulation state; resume and restart worked. A deliberate dive into the sea produced Mission Failed at zero hull, and Fly Again restored 100 hull, zero score and released input.
- Touch mode renders at 390×844 and landscape layouts remain usable. Synthetic pointer events exercised stick steering and gun heat, and pointer-up cleared both. One test used an inactive synthetic pointer ID and correctly failed pointer capture; retesting with an active pointer ID succeeded. This is browser input automation, not physical phone acceptance.
- The personal best was written to local storage and survived reload. Test scores are removed before handoff.
- The production build served on port 5180 loaded its models, fonts, interface and engine with zero external network requests and no initial runtime errors.

Full-run JSON and captured screenshots are in `artifacts/` (ignored by git). `scripts/simulate.ts` provides reproducible core runs. `scripts/browser-pilot.js` is a test-only console helper and is excluded from the production build.

## Remaining human judgments

Flight feel, campaign difficulty, first-play duration, audio mix, intelligibility of installed speech-synthesis voices, and real mouse/touch-device comfort require human play and listening. The intended first-play length is 8–10 minutes; assisted expert runs are faster. Breakout is a closing teaser only.

import { Game, emptyInput } from "../src/core.ts";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Exercises the actual flight, aiming, projectile, damage and mission rules.
// No teleport, direct damage, invulnerability, or phase-skip calls.
export function simulate(strategy: "scouts" | "escorts" = "scouts") {
  const g = new Game();
  g.start();
  let phase = "";
  const transitions: {
    phase: string;
    time: number;
    hp: number;
    kills: number;
    scouts: number;
  }[] = [];
  let missileAttempts = 0;
  for (let i = 0; i < 60 * 750; i++) {
    const input = emptyInput();
    if (
      strategy === "escorts" &&
      g.phase === "scouts" &&
      g.alive("fighter").length &&
      g.target?.kind !== "fighter"
    ) {
      // Equivalent to cycling Tab until a fighter is selected.
      for (let n = 0; n < g.alive().length; n++) {
        g.selectTarget(true);
        if (g.target?.kind === "fighter") break;
      }
    }
    const target = g.target;
    input.pursuit = true;
    if (g.phase === "tutorial" && g.gate) {
      const action = g.gate.action;
      if (g.gate.age < 0.35) {
        input.pursuit = false;
        if (action === "CLIMB") input.pitch = 1;
        if (action === "BANK LEFT") input.turn = -1;
      }
      input.boost = action === "BOOST";
      input.brake = action === "BRAKE";
      if (action === "ROLL") g.roll();
    }
    if (target) {
      const distance = target.pos.distanceTo(g.player.pos);
      input.boost =
        (g.phase === "final" || g.phase === "chase" || distance > 2100) &&
        g.player.boost > 8;
      input.brake = distance < 340;
      input.gun = distance < 1800;
      if (g.lock >= 1 && g.player.missileCD <= 0) {
        g.missile();
        missileAttempts++;
      }
    }
    if (
      g.projectiles.some(
        (p) => p.type === "hostile" && p.pos.distanceTo(g.player.pos) < 700,
      )
    ) {
      if (g.player.flareCD <= 0) g.flare();
      else if (g.player.rollCD <= 0) g.roll();
    }
    g.update(1 / 60, input);
    if (g.phase !== phase) {
      phase = g.phase;
      transitions.push({
        phase,
        time: +g.time.toFixed(2),
        hp: g.player.hp,
        kills: g.kills,
        scouts: g.scoutsDown,
      });
    }
    if (g.phase === "clear" || g.phase === "failed") break;
  }
  return { transitions, state: g.snapshot(), missileAttempts };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const strategy = process.argv.includes("--escorts-first")
    ? "escorts"
    : "scouts";
  const report = simulate(strategy);
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/simulation-" + strategy + ".json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  if (report.state.phase !== "clear") process.exitCode = 1;
}

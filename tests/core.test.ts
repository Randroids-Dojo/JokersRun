import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { Game, emptyInput, direction } from "../src/core.ts";
const advance = (g: Game, seconds: number, input = emptyInput()) => {
  for (let i = 0; i < seconds * 60; i++) g.update(1 / 60, input);
};
function flight() {
  const g = new Game();
  g.start();
  g.enter("drones");
  g.player.pos.set(0, 600, 0);
  g.player.prev.copy(g.player.pos);
  g.player.speed = 220;
  g.player.pitch = 0;
  return g;
}

test("catapult gives control within four seconds and freezes on pause", () => {
  const g = new Game();
  g.start();
  advance(g, 4.1);
  assert.equal(g.phase, "tutorial");
  assert.ok(g.player.speed > 200);
  assert.ok(g.player.pos.z > 400);
  g.paused = true;
  const before = g.snapshot();
  advance(g, 5, { ...emptyInput(), gun: true, boost: true });
  assert.deepEqual(g.snapshot(), before);
});
test("steering, boost and brake change flight; release stops the turn", () => {
  const g = flight();
  const initial = g.player.pos.clone();
  advance(g, 1, { ...emptyInput(), turn: 1, pitch: 1, boost: true });
  assert.ok(g.player.yaw < -0.5);
  assert.ok(g.player.pos.y > initial.y);
  assert.ok(g.player.speed > 340);
  assert.ok(g.player.boost < 100);
  const yaw = g.player.yaw;
  advance(g, 1);
  assert.equal(g.player.yaw, yaw);
  advance(g, 2, { ...emptyInput(), brake: true });
  assert.ok(g.player.speed < 125);
});
test("missiles require a forward lock and do actual projectile damage", () => {
  const g = flight();
  g.enemies = [];
  const e = g.spawn("drone", "test", new Vector3(0, 600, 700));
  g.targetId = e.id;
  g.missile();
  assert.equal(g.projectiles.length, 0);
  advance(g, 1.3, { ...emptyInput(), pursuit: true });
  assert.equal(g.lock, 1);
  g.missile();
  assert.equal(g.projectiles.filter((p) => p.type === "missile").length, 1);
  advance(g, 3, { ...emptyInput(), pursuit: true });
  if (!e.dead) {
    g.missile();
    advance(g, 2, { ...emptyInput(), pursuit: true });
  }
  assert.equal(e.dead, true);
  assert.equal(g.trainingKills, 1);
});
test("armored drone rejects missile damage, but can be shot down", () => {
  const g = flight();
  const e = g.spawn("drone", "armored", new Vector3(0, 600, 600), {
    gunOnly: true,
  });
  g.hit(e, 100, "missile");
  assert.equal(e.hp, e.maxHp);
  g.targetId = e.id;
  advance(g, 3, { ...emptyInput(), pursuit: true, gun: true });
  assert.ok(e.dead);
});
test("guns overheat and cool after release; projectiles expire", () => {
  const g = flight();
  g.enemies = [];
  advance(g, 10, { ...emptyInput(), gun: true });
  assert.ok(g.events.some((e) => e.type === "gun"));
  assert.ok(g.player.heat > 0);
  advance(g, 5);
  assert.equal(g.player.heat, 0);
  assert.equal(g.player.overheated, false);
  assert.equal(g.projectiles.length, 0);
});
test("scout damage interrupts transmission, escort kills buy time", () => {
  const g = flight();
  g.enemies = [];
  g.enter("scouts");
  advance(g, 2);
  const before = g.dataTime;
  const scout = g.alive("scout")[0];
  g.hit(scout, 5, "gun");
  advance(g, 1);
  assert.equal(g.dataTime, before);
  const escort = g.alive("fighter")[0];
  g.hit(escort, 999, "gun");
  assert.equal(g.dataTime, before + 15);
  assert.ok(g.combo > 0);
});
test("scouts really transmit if the player fails to intercept", () => {
  const g = flight();
  g.enemies = [];
  g.enter("scouts");
  g.order = "cover";
  g.dataTime = 0.2;
  advance(g, 0.3);
  assert.equal(g.phase, "failed");
  assert.match(g.failReason, /transmitted/);
});
test("flares clear incoming missiles and barrel rolls have a cooldown", () => {
  const g = flight();
  g.projectiles.push({
    id: 900,
    pos: g.player.pos.clone().add(new Vector3(0, 0, 100)),
    prev: new Vector3(),
    vel: new Vector3(0, 0, -100),
    life: 5,
    type: "hostile",
    target: -1,
    damage: 10,
  });
  g.flare();
  advance(g, 0.1);
  assert.equal(g.projectiles.length, 0);
  assert.ok(g.player.flareCD > 11);
  g.roll();
  assert.ok(g.player.rollTime > 0);
  const cd = g.player.rollCD;
  g.roll();
  assert.equal(g.player.rollCD, cd);
});
test("destroying the lead scout starts the ace, half health enrages it, final scout governs success", () => {
  const g = flight();
  g.enemies = [];
  g.enter("scouts");
  g.hit(g.alive("scout")[0], 999, "gun");
  advance(g, 0.05);
  assert.equal(g.phase, "dogfight");
  for (const e of g.alive("fighter")) g.hit(e, 999, "gun");
  advance(g, 0.05);
  assert.equal(g.phase, "chase");
  g.hit(g.enemies.find((e) => e.id === g.chaseId)!, 999, "gun");
  advance(g, 0.05);
  assert.equal(g.phase, "ace");
  const ace = g.alive("ace")[0];
  g.hit(ace, ace.maxHp * 0.51, "gun");
  advance(g, 0.05);
  assert.equal(g.aceEnraged, true);
  g.hit(ace, ace.maxHp, "gun");
  advance(g, 0.05);
  assert.equal(g.phase, "final");
  assert.ok(g.finalTime > 24.9 && g.finalTime <= 25);
  g.hit(g.alive("scout")[0], 999, "gun");
  advance(g, 0.05);
  assert.equal(g.phase, "clear");
  assert.equal(g.scoutsDown, 3);
});
test("final target escapes on a real timer; restart clears all mission state", () => {
  const g = flight();
  g.enemies = [];
  g.spawn("scout", "last", new Vector3(0, 600, 2000));
  g.enter("final");
  g.finalTime = 0.1;
  advance(g, 0.2);
  assert.equal(g.phase, "failed");
  g.start();
  assert.equal(g.phase, "launch");
  assert.equal(g.kills, 0);
  assert.equal(g.time, 0);
  assert.equal(g.score, 0);
  assert.equal(g.enemies.length, 0);
  assert.equal(g.player.hp, 100);
});
test("the ace encounter can be abandoned to save the fleet", () => {
  const g = flight();
  g.enemies = [];
  g.spawn("scout", "last", new Vector3(0, 600, 4000));
  g.enter("ace");
  g.phaseTime = 145;
  advance(g, 0.05);
  assert.equal(g.phase, "final");
  assert.equal(g.alive("ace").length, 1);
  g.hit(g.alive("scout")[0], 999, "gun");
  advance(g, 0.05);
  assert.equal(g.phase, "clear");
  assert.equal(g.aceKilled, false);
});
test("killing scouts early does not soft-lock the scripted campaign", () => {
  const g = flight();
  g.enemies = [];
  g.enter("scouts");
  for (const e of g.alive("scout")) g.hit(e, 999, "gun");
  advance(g, 0.05);
  for (const e of g.alive("fighter")) g.hit(e, 999, "gun");
  advance(g, 0.05);
  assert.equal(g.phase, "ace");
  g.hit(g.alive("ace")[0], 5000, "gun");
  advance(g, 0.05);
  assert.equal(g.phase, "clear");
});

test("escort time extensions also delay visible upload meters", () => {
  const g = flight();
  g.enemies = [];
  g.enter("scouts");
  g.dataTime = 12;
  advance(g, 0.1);
  const upload = g.alive("scout")[0].upload;
  g.hit(g.alive("fighter")[0], 999, "gun");
  advance(g, 0.1);
  assert.ok(g.dataTime > 19);
  assert.ok(g.alive("scout")[0].upload < upload);
});
test("chase route has a navigable canyon and collision heights match its cliffs", () => {
  const g = flight();
  g.enemies = [];
  g.spawn("scout", "lead", new Vector3(0, 600, 3000));
  g.enter("chase");
  const center = g.routePoint(0, 160, 5000);
  const cliff = g.routePoint(1000, 0, 5000);
  assert.ok(g.ground(center.x, center.z) < center.y);
  assert.ok(g.ground(cliff.x, cliff.z) > 300);
});
test("an assisted pilot completes every mission phase through real projectiles", async () => {
  const { simulate } = await import("../scripts/simulate.ts");
  const report = simulate();
  assert.equal(report.state.phase, "clear", report.state.failReason);
  assert.equal(report.state.scoutsDown, 3);
  assert.equal(report.state.trainingKills, 3);
  assert.equal(report.state.aceEnraged, true);
  assert.ok(report.missileAttempts > 10);
  for (const phase of [
    "launch",
    "tutorial",
    "drones",
    "warning",
    "scouts",
    "dogfight",
    "chase",
    "ace",
    "final",
    "clear",
  ])
    assert.ok(report.state.phases.includes(phase as never), phase);
  assert.ok(report.state.time > 300);
});

test("return-flight autopilot levels out above the water", () => {
  const g = flight();
  g.player.pitch = -0.6;
  g.player.pos.y = 170;
  g.enter("clear");
  advance(g, 20);
  assert.ok(g.player.pos.y >= 150);
  assert.ok(g.player.pitch > 0);
  assert.equal(g.targetId, -1);
});

test("escort-first strategy can also intercept every scout", async () => {
  const { simulate } = await import("../scripts/simulate.ts");
  const r = simulate("escorts");
  assert.equal(r.state.phase, "clear", r.state.failReason);
  assert.equal(r.state.scoutsDown, 3);
});
test("debrief flight time freezes when the objective is complete", () => {
  const g = flight();
  advance(g, 10);
  g.enter("clear");
  const end = g.missionEndTime;
  advance(g, 120);
  assert.equal(g.missionEndTime, end);
  assert.ok(g.time < end + 23);
});

test("split orders assign one wingman to scouts and two to fighters, with real missiles", () => {
  const g = flight();
  g.enemies = [];
  g.phase = "scouts";
  g.spawn("scout", "scout", new Vector3(0, 600, 900));
  g.spawn("fighter", "fighter", new Vector3(100, 600, 1000));
  g.order = "split";
  advance(g, 2);
  const targets = g.wingTargets.map(
    (id) => g.enemies.find((e) => e.id === id)?.kind,
  );
  assert.deepEqual(targets, ["scout", "fighter", "fighter"]);
  assert.ok(g.events.some((e) => e.type === "wingman"));
});

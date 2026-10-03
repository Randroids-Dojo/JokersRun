import { Vector3, MathUtils } from "three";

export type Phase =
  | "standby"
  | "launch"
  | "tutorial"
  | "drones"
  | "warning"
  | "scouts"
  | "dogfight"
  | "chase"
  | "ace"
  | "final"
  | "clear"
  | "failed";
export type Kind = "drone" | "fighter" | "scout" | "ace";
export type Weapon = "gun" | "missile" | "wingman";
export type Order = "cover" | "scouts" | "split";
export interface Input {
  turn: number;
  pitch: number;
  boost: boolean;
  brake: boolean;
  gun: boolean;
  pursuit: boolean;
}
export interface Enemy {
  id: number;
  kind: Kind;
  name: string;
  pos: Vector3;
  vel: Vector3;
  hp: number;
  maxHp: number;
  yaw: number;
  pitch: number;
  roll: number;
  born: number;
  shot: number;
  dodge: number;
  upload: number;
  interrupted: number;
  gunOnly: boolean;
  evasive: boolean;
  dead: boolean;
  route: number;
}
export interface Projectile {
  id: number;
  pos: Vector3;
  prev: Vector3;
  vel: Vector3;
  life: number;
  type: "bullet" | "missile" | "hostile" | "friendly";
  target: number;
  damage: number;
}
export interface Effect {
  id: number;
  pos: Vector3;
  type: "explosion" | "hit" | "flare" | "smoke";
  age: number;
  life: number;
  size: number;
}
export interface GameEvent {
  id: number;
  time: number;
  type: string;
  text: string;
  detail?: string;
}
export interface Gate {
  pos: Vector3;
  normal: Vector3;
  action: string;
  key: string;
  done: boolean;
  executed: boolean;
  age: number;
}
export interface Island {
  x: number;
  z: number;
  rx: number;
  rz: number;
  h: number;
  seed: number;
}
export const islands: Island[] = [
  { x: -1800, z: 3000, rx: 950, rz: 1700, h: 350, seed: 1 },
  { x: 1800, z: 4200, rx: 1000, rz: 1600, h: 480, seed: 2 },
  { x: -2400, z: 6500, rx: 1300, rz: 1500, h: 590, seed: 3 },
  { x: 2050, z: 8000, rx: 1350, rz: 2000, h: 530, seed: 4 },
  { x: -1150, z: 10300, rx: 680, rz: 1900, h: 500, seed: 5 },
  { x: 1150, z: 11200, rx: 680, rz: 1700, h: 460, seed: 6 },
  { x: -3700, z: 13000, rx: 1550, rz: 2300, h: 880, seed: 7 },
  { x: 3800, z: 14600, rx: 1750, rz: 2000, h: 900, seed: 8 },
  { x: -1600, z: 18000, rx: 1100, rz: 1500, h: 670, seed: 9 },
  { x: 2900, z: 20000, rx: 1350, rz: 1700, h: 560, seed: 10 },
  { x: -6800, z: 6500, rx: 2300, rz: 2600, h: 1150, seed: 11 },
  { x: 7000, z: 1000, rx: 2700, rz: 2500, h: 1450, seed: 12 },
];

for (let n = 0; n < 7; n++) {
  islands.push({
    x: -9500 + (n % 3) * 2200,
    z: 24000 + n * 6000,
    rx: 2400,
    rz: 3200,
    h: 650 + (n % 3) * 150,
    seed: 51 + n,
  });
  islands.push({
    x: 17500 + (n % 2) * 2500,
    z: 22000 + n * 6300,
    rx: 2100,
    rz: 2900,
    h: 530 + (n % 4) * 120,
    seed: 61 + n,
  });
}
export const chaseIslands: Island[] = [
  { x: -1600, z: 1500, rx: 1100, rz: 2000, h: 350, seed: 31 },
  { x: 1700, z: 1800, rx: 1150, rz: 2300, h: 400, seed: 32 },
  { x: -1000, z: 4600, rx: 700, rz: 1900, h: 560, seed: 33 },
  { x: 1000, z: 5000, rx: 700, rz: 1800, h: 490, seed: 34 },
  { x: -1200, z: 7300, rx: 750, rz: 1500, h: 380, seed: 35 },
  { x: 1400, z: 7400, rx: 800, rz: 1700, h: 450, seed: 36 },
];
export const emptyInput = (): Input => ({
  turn: 0,
  pitch: 0,
  boost: false,
  brake: false,
  gun: false,
  pursuit: false,
});
export const direction = (yaw: number, pitch: number) =>
  new Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  );
const angleDelta = (a: number, b: number) =>
  Math.atan2(Math.sin(b - a), Math.cos(b - a));
export const terrainHeight = (x: number, z: number) => {
  let h = 0;
  for (const i of islands) {
    const d = Math.sqrt(((x - i.x) / i.rx) ** 2 + ((z - i.z) / i.rz) ** 2);
    if (d < 1)
      h = Math.max(h, i.h * Math.min(1, (1 - d) * 5) * (0.77 + 0.23 * (1 - d)));
  }
  if (Math.abs(z - 12100) < 32 && Math.abs(x) < 1500) h = Math.max(h, 320);
  return h;
};
export class Game {
  phase: Phase = "standby";
  phaseTime = 0;
  time = 0;
  missionEndTime = 0;
  paused = false;
  score = 0;
  combo = 0;
  comboTime = 0;
  maxCombo = 0;
  hotStart = 1;
  kills = 0;
  scoutsDown = 0;
  damageTaken = 0;
  aceKilled = false;
  aceEnraged = false;
  dataTime = 90;
  chaseTime = 65;
  finalTime = 25;
  phaseHistory: Phase[] = [];
  failReason = "";
  player = {
    pos: new Vector3(0, 32, -100),
    prev: new Vector3(),
    yaw: 0,
    pitch: 0,
    roll: 0,
    speed: 0,
    hp: 100,
    boost: 100,
    heat: 0,
    overheated: false,
    missileCD: 0,
    rollCD: 0,
    rollTime: 0,
    flareCD: 0,
    invincible: 0,
    gunCD: 0,
  };
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  effects: Effect[] = [];
  events: GameEvent[] = [];
  targetId = -1;
  lock = 0;
  gate: Gate | null = null;
  tutorialIndex = 0;
  tutorialPassed = 0;
  cleanGates = 0;
  trainingKills = 0;
  order: Order = "cover";
  wingAttack = 0;
  wingmen = [new Vector3(), new Vector3(), new Vector3()];
  wingTargets = [-1, -1, -1];
  wingHeadings = [0, 0, 0];
  private wingTurn = 0;
  chaseId = -1;
  finalId = -1;
  chaseOrigin: Vector3 | null = null;
  chaseYaw = 0;
  chaseWaypoint = 0;
  finalStart = new Vector3();
  chaseStart = new Vector3();
  noDamageStart = 0;
  aceComboStart = 0;
  aceComboBroken = false;
  radio = { speaker: "", text: "", until: 0 };
  announcement = { title: "", sub: "", until: 0 };
  toast = { text: "", until: 0 };
  private eventSerial = 0;
  private serial = 0;
  private chatter = 0;
  private tutorialAction = 0;
  private droneSpawned = 0;
  private trainingCompleteAt = 0;
  private pendingRadio: { at: number; speaker: string; text: string }[] = [];
  start() {
    Object.assign(this, new Game());
    this.player.speed = 10;
    this.enter("launch");
  }
  emit(type: string, text: string, detail?: string) {
    this.events.push({
      id: ++this.eventSerial,
      time: this.time,
      type,
      text,
      detail,
    });
    if (this.events.length > 350) this.events.shift();
  }
  say(speaker: string, text: string) {
    this.radio = { speaker, text, until: this.time + 5.5 };
    this.emit("radio", text, speaker);
  }
  later(delay: number, speaker: string, text: string) {
    this.pendingRadio.push({ at: this.time + delay, speaker, text });
  }
  announce(title: string, sub = "", duration = 3.5) {
    this.announcement = { title, sub, until: this.time + duration };
    this.emit("announcement", title, sub);
  }
  notify(text: string) {
    this.toast = { text, until: this.time + 2.5 };
  }
  addScore(value: number, label: string) {
    const points = Math.round(
      value * this.hotStart * (1 + Math.min(this.combo, 10) * 0.1),
    );
    this.score += points;
    this.notify(label + "  +" + points.toLocaleString());
    this.emit("score", label, String(points));
  }
  forward() {
    return direction(this.player.yaw, this.player.pitch);
  }
  get target() {
    return this.enemies.find((e) => e.id === this.targetId && !e.dead);
  }
  alive(kind?: Kind) {
    return this.enemies.filter((e) => !e.dead && (!kind || e.kind === kind));
  }
  private ahead(distance: number, side = 0, altitude = 0) {
    return this.player.pos
      .clone()
      .addScaledVector(this.forward(), distance)
      .addScaledVector(
        new Vector3(-Math.cos(this.player.yaw), 0, Math.sin(this.player.yaw)),
        side,
      )
      .add(new Vector3(0, altitude, 0));
  }
  spawn(kind: Kind, name: string, pos: Vector3, options: Partial<Enemy> = {}) {
    const hp =
      kind === "ace"
        ? 3400
        : kind === "scout"
          ? 220
          : kind === "fighter"
            ? 240
            : 80;
    const e: Enemy = {
      id: ++this.serial,
      kind,
      name,
      pos: pos.clone(),
      vel: new Vector3(),
      hp,
      maxHp: hp,
      yaw: this.player.yaw,
      pitch: 0,
      roll: 0,
      born: this.time,
      shot: this.time + 5 + (this.serial % 5),
      dodge: 0,
      upload: 0,
      interrupted: 0,
      gunOnly: false,
      evasive: false,
      dead: false,
      route: 0,
      ...options,
    };
    this.enemies.push(e);
    return e;
  }
  selectTarget(cycle = false) {
    const list = this.alive().sort(
      (a, b) => this.targetWeight(a) - this.targetWeight(b),
    );
    if (!list.length) {
      this.targetId = -1;
      this.lock = 0;
      return;
    }
    const index = cycle
      ? (list.findIndex((e) => e.id === this.targetId) + 1) % list.length
      : 0;
    this.targetId = list[index].id;
    this.lock = 0;
    this.emit("target", list[index].name);
  }
  private targetWeight(e: Enemy) {
    const d = e.pos.clone().sub(this.player.pos);
    const priority =
      (this.phase === "dogfight" && e.kind === "fighter") ||
      (this.phase === "ace" && e.kind === "ace") ||
      (this.phase === "chase" && e.id === this.chaseId) ||
      (this.phase === "final" && e.kind === "scout");
    return (
      (priority ? -100000 : 0) +
      d.length() * (1.5 - d.normalize().dot(this.forward())) +
      (e.kind === "scout" ? -250 : 0)
    );
  }
  cycleOrder() {
    this.order =
      this.order === "cover"
        ? "scouts"
        : this.order === "scouts"
          ? "split"
          : "cover";
    this.say(
      "JOKER 2",
      this.order === "cover"
        ? "Copy. We’ll keep the fighters off you."
        : this.order === "scouts"
          ? "Roger. All wingmen, pressure the scouts."
          : "Two on escorts. I’ll take a scout.",
    );
  }
  roll() {
    if (this.player.rollCD > 0 || !this.playing()) return;
    this.player.rollTime = 0.85;
    this.player.rollCD = 3.8;
    this.player.invincible = 0.95;
    this.emit("roll", "Barrel roll");
    if (this.gate?.action === "ROLL") this.gate.executed = true;
  }
  flare() {
    if (this.player.flareCD > 0 || !this.playing()) return;
    this.player.flareCD = 12;
    this.effect(this.player.pos, "flare", 8);
    for (const m of this.projectiles)
      if (m.type === "hostile" && m.pos.distanceTo(this.player.pos) < 2000)
        m.life = 0;
    this.notify("COUNTERMEASURES DEPLOYED");
    this.emit("flare", "Countermeasures");
  }
  missile() {
    if (!this.playing()) return;
    const t = this.target;
    if (this.player.missileCD > 0) {
      this.notify("MISSILES RELOADING");
      return;
    }
    if (!t || this.lock < 1) {
      this.notify("HOLD TARGET IN SIGHT TO LOCK");
      this.emit("rejected", "No missile lock");
      return;
    }
    this.player.missileCD = 2.7;
    this.lock = 0;
    this.projectiles.push({
      id: ++this.serial,
      pos: this.player.pos.clone().addScaledVector(this.forward(), 22),
      prev: this.player.pos.clone(),
      vel: this.forward().multiplyScalar(this.player.speed + 330),
      life: 8,
      type: "missile",
      target: t.id,
      damage: 70,
    });
    this.emit("missile", "Missile away");
  }
  playing() {
    return !this.paused && !["standby", "failed", "clear"].includes(this.phase);
  }
  effect(pos: Vector3, type: Effect["type"], size = 1) {
    this.effects.push({
      id: ++this.serial,
      pos: pos.clone(),
      type,
      age: 0,
      life: type === "explosion" ? 2.4 : type === "flare" ? 2 : 0.3,
      size,
    });
  }
  damagePlayer(amount: number, reason = "ENEMY FIRE") {
    if (
      this.player.invincible > 0 ||
      !this.playing() ||
      this.phase === "launch"
    )
      return;
    this.player.hp = Math.max(0, this.player.hp - amount);
    this.damageTaken += amount;
    this.player.invincible = 0.6;
    this.combo = 0;
    this.comboTime = 0;
    this.emit("damage", reason, String(amount));
    if (this.player.hp <= 0)
      this.fail(
        reason === "TERRAIN COLLISION"
          ? "Aircraft lost over the coast."
          : "Your aircraft was shot down.",
      );
  }
  hit(e: Enemy, amount: number, weapon: Weapon) {
    if (e.dead) return;
    if (e.gunOnly && weapon !== "gun") {
      this.notify("ARMORED DRONE · USE GUNS");
      return;
    }
    e.hp -= amount;
    e.interrupted = 3;
    this.effect(e.pos, "hit", 1);
    if (weapon !== "wingman") {
      this.comboTime = Math.max(this.comboTime, 10);
      this.emit("hit", e.name);
    }
    if (e.hp <= 0) this.destroy(e, weapon);
  }
  private destroy(e: Enemy, weapon: Weapon) {
    e.dead = true;
    this.effect(
      e.pos,
      "explosion",
      e.kind === "ace" ? 5 : e.kind === "scout" ? 3 : 2,
    );
    this.kills++;
    this.combo++;
    this.comboTime = 24;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const base = e.kind === "ace" ? 10000 : weapon === "gun" ? 1500 : 1000;
    this.addScore(
      base,
      e.kind === "ace"
        ? "ACE DESTROYED"
        : weapon === "gun"
          ? "GUN KILL"
          : weapon === "wingman"
            ? "SQUADRON KILL"
            : "MISSILE KILL",
    );
    if (e.pos.distanceTo(this.player.pos) < 350 && weapon !== "wingman")
      this.addScore(500, "CLOSE RANGE");
    this.emit("kill", e.name, weapon);
    if (e.kind === "scout") {
      this.scoutsDown++;
      this.say(
        "JOKER 2",
        this.scoutsDown === 3
          ? "All scouts destroyed."
          : "Scout down. Transmission interrupted.",
      );
    }
    if (e.kind === "fighter" && ["scouts", "dogfight"].includes(this.phase)) {
      this.dataTime += 15;
      this.notify("ESCORT DESTROYED  ·  +15 SEC");
    }
    if (e.kind === "drone") {
      this.trainingKills++;
      this.droneSpawned = 0;
    }
    if (e.kind === "ace") {
      this.aceKilled = true;
      if (this.aceComboStart > 0 && !this.aceComboBroken)
        this.addScore(5000, "UNBROKEN COMBO");
    }
    if (e.id === this.targetId) this.selectTarget();
  }
  fail(reason: string) {
    if (this.phase === "failed" || this.phase === "clear") return;
    this.failReason = reason;
    this.enter("failed");
  }
  enter(phase: Phase) {
    this.phase = phase;
    this.phaseTime = 0;
    if (phase === "clear" || phase === "failed")
      this.missionEndTime = this.time;
    this.phaseHistory.push(phase);
    this.emit("phase", phase);
    switch (phase) {
      case "launch":
        this.say(
          "OVERLORD",
          "We’re almost safe. Keep the skies clear until we reach the coast.",
        );
        this.announce("JOKER’S RUN", "MISSION 01  /  HALCYON COAST", 3.5);
        break;
      case "tutorial":
        this.nextGate();
        break;
      case "drones":
        this.gate = null;
        this.announce(
          "HOT START ×" + this.hotStart.toFixed(2),
          "WEAPONS CHECK · DESTROY 3 TRAINING DRONES",
        );
        this.spawnDrone();
        break;
      case "warning":
        this.spawnAttack();
        this.announce("WARNING", "UNKNOWN AIRCRAFT APPROACHING", 6);
        this.say("OVERLORD", "Multiple contacts. Those aren’t ours.");
        break;
      case "scouts": {
        this.dataTime = 90;
        this.noDamageStart = this.damageTaken;
        this.announce("STOP THE SCOUTS", "DESTROY THEM BEFORE THEY TRANSMIT");
        if (!this.alive("scout").length) this.spawnAttack();
        this.targetId = this.alive("scout")[0].id;
        this.lock = 0;
        this.say("OVERLORD", "Three recon aircraft. Don’t let them transmit!");
        break;
      }
      case "dogfight":
        this.selectTarget();
        this.announce("HOSTILE SKIES", "CLEAR THE ESCORTS");
        this.say("JOKER 3", "Two on your six! Scouts are going low.");
        this.dataTime = Math.max(75, this.dataTime);
        break;
      case "chase": {
        const s = this.alive("scout").sort(
          (a, b) =>
            a.pos.distanceTo(this.player.pos) -
            b.pos.distanceTo(this.player.pos),
        )[0];
        if (!s) {
          this.enter("ace");
          return;
        }
        this.chaseId = s.id;
        this.chaseTime = 65;
        this.chaseStart.copy(this.player.pos);
        this.chaseOrigin = this.player.pos.clone();
        this.chaseOrigin.y = 0;
        this.chaseYaw = this.player.yaw;
        this.chaseWaypoint = 0;
        this.targetId = s.id;
        this.lock = 0;
        s.pos.copy(this.routePoint(0, 170, 3500));
        s.pos.y = Math.max(170, this.ground(s.pos.x, s.pos.z) + 100);
        s.yaw = this.player.yaw;
        this.announce(
          "INTERCEPT THE LEAD SCOUT",
          "CLOSE THE DISTANCE. USE YOUR GUNS.",
        );
        this.say("JOKER 2", "Scout breaking east! Follow it through the gap.");
        break;
      }
      case "ace": {
        this.aceComboStart = this.combo;
        this.aceComboBroken = false;
        this.player.boost = Math.max(70, this.player.boost);
        const ace = this.spawn(
          "ace",
          "UNKNOWN ACE",
          this.ahead(2500, 120, 1000),
          { yaw: this.player.yaw + Math.PI },
        );
        this.targetId = ace.id;
        this.lock = 0;
        this.announce(
          "ENEMY ACE APPROACHING",
          "HIGH-SPEED CONTACT · ABOVE",
          4.5,
        );
        this.later(2, "JOKER 3", "That one’s different.");
        break;
      }
      case "final": {
        const s = this.alive("scout")[0];
        if (!s) {
          this.enter("clear");
          return;
        }
        this.finalId = s.id;
        this.finalTime = 25;
        this.finalStart.copy(this.player.pos);
        this.player.boost = 100;
        s.pos.copy(this.ahead(2400, 0, -Math.max(0, this.player.pos.y - 240)));
        s.pos.y = Math.max(160, terrainHeight(s.pos.x, s.pos.z) + 100);
        s.yaw = this.player.yaw;
        this.targetId = s.id;
        this.lock = 0;
        this.announce(
          "FINAL TARGET ESCAPING",
          "25 SECONDS. EVERYTHING YOU’VE GOT.",
          4,
        );
        this.say(
          "OVERLORD",
          "Last scout is making a run for it. Break off and intercept!",
        );
        break;
      }
      case "clear":
        this.projectiles = [];
        this.gate = null;
        this.targetId = -1;
        this.lock = 0;
        if (this.damageTaken === 0) this.addScore(5000, "NO DAMAGE BONUS");
        this.announce("MISSION CLEAR", "TRANSMISSION STOPPED", 6);
        this.say("JOKER 2", "All scouts destroyed.");
        this.later(3.5, "OVERLORD", "Carrier is still safe.");
        this.later(9, "OVERLORD", "Enemy forces were closer than expected.");
        this.later(14, "RADAR", "We may have been detected anyway.");
        this.emit("complete", "Mission clear");
        break;
      case "failed":
        this.announce("MISSION FAILED", this.failReason, 99);
        this.emit("failed", this.failReason);
        break;
    }
  }
  private spawnAttack() {
    for (let i = 0; i < 3; i++)
      this.spawn(
        "scout",
        "SCOUT 0" + (i + 1),
        this.ahead(4200 + i * 1250, (i - 1) * 750, 150 + i * 100),
        { route: i },
      );
    for (let i = 0; i < 6; i++)
      this.spawn(
        "fighter",
        "BANDIT 0" + (i + 1),
        this.ahead(
          2300 + i * 600,
          (i % 2 ? 1 : -1) * (850 + i * 350),
          180 + i * 80,
        ),
      );
  }
  private spawnDrone() {
    if (this.droneSpawned || this.trainingKills >= 3) return;
    this.droneSpawned = 1;
    const n = this.trainingKills;
    const drone = this.spawn(
      "drone",
      ["DRONE 01 · LOCK ON", "DRONE 02 · GUNS ONLY", "DRONE 03 · EVASIVE"][n],
      this.ahead(n === 0 ? 2100 : 2500, 0, 20),
      {
        gunOnly: n === 1,
        evasive: n === 2,
        hp: n === 1 ? 100 : 80,
        maxHp: n === 1 ? 100 : 80,
      },
    );
    this.targetId = drone.id;
    this.lock = 0;
    this.notify(
      n === 0
        ? "KEEP THE DRONE IN SIGHT. E TO FIRE A MISSILE."
        : n === 1
          ? "CLOSE IN. HOLD SPACE TO FIRE GUNS."
          : "STAY ON ITS TAIL. HOLD X FOR PURSUIT ASSIST.",
    );
  }
  private nextGate() {
    if (this.tutorialIndex >= 5) {
      this.hotStart = 1 + this.tutorialPassed * 0.1 + this.cleanGates * 0.05;
      this.announce(
        "HOT START ×" + this.hotStart.toFixed(2),
        "FLIGHT CHECK COMPLETE",
      );
      this.enter("drones");
      return;
    }
    const actions = ["CLIMB", "BANK LEFT", "BOOST", "BRAKE", "ROLL"];
    const keys = ["W / ↑", "A / ←", "SHIFT", "CTRL / C", "Q"];
    const pos = this.ahead(
      this.tutorialIndex === 0 ? 1050 : 1650,
      this.tutorialIndex === 1 ? -350 : 0,
      this.tutorialIndex === 0 ? 190 : 0,
    );
    pos.y = Math.max(pos.y, terrainHeight(pos.x, pos.z) + 400);
    this.gate = {
      pos,
      normal: this.forward(),
      action: actions[this.tutorialIndex],
      key: keys[this.tutorialIndex],
      done: false,
      executed: false,
      age: 0,
    };
    this.tutorialAction = 0;
  }
  private updateTutorial(dt: number, input: Input) {
    const g = this.gate;
    if (!g) return;
    g.age += dt;
    const good =
      g.action === "CLIMB"
        ? input.pitch > 0.2
        : g.action === "BANK LEFT"
          ? input.turn < -0.2
          : g.action === "BOOST"
            ? input.boost
            : g.action === "BRAKE"
              ? input.brake
              : false;
    if (good) this.tutorialAction += dt;
    if (this.tutorialAction > 0.25) g.executed = true;
    const segment = this.player.pos.clone().sub(this.player.prev);
    const v = g.pos.clone().sub(this.player.prev);
    const t = MathUtils.clamp(
      v.dot(segment) / Math.max(segment.lengthSq(), 0.01),
      0,
      1,
    );
    const distance = this.player.prev
      .clone()
      .addScaledVector(segment, t)
      .distanceTo(g.pos);
    const passed = this.player.pos.clone().sub(g.pos).dot(g.normal) > 240;
    if (distance < 275 || passed || g.age > 13) {
      if (distance < 275) {
        this.cleanGates++;
        this.addScore(250, "CLEAN CHECKPOINT");
      }
      if (g.executed) {
        this.tutorialPassed++;
        this.addScore(
          g.age < 7 ? 500 : 250,
          g.age < 7 ? "HOT START" : "MANEUVER COMPLETE",
        );
      } else this.notify("CHECKPOINT MISSED · KEEP FLYING");
      this.tutorialIndex++;
      this.nextGate();
    }
  }
  update(dt: number, input: Input = emptyInput()) {
    if (
      this.paused ||
      this.phase === "standby" ||
      this.phase === "failed" ||
      (this.phase === "clear" && this.phaseTime >= 22)
    )
      return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.phaseTime += dt;
    for (const item of this.pendingRadio.filter((r) => r.at <= this.time))
      this.say(item.speaker, item.text);
    this.pendingRadio = this.pendingRadio.filter((r) => r.at > this.time);
    for (const fx of this.effects) fx.age += dt;
    this.effects = this.effects.filter((f) => f.age < f.life);
    if (this.phase === "clear") {
      this.player.pitch = MathUtils.damp(this.player.pitch, 0.035, 1.5, dt);
      this.player.speed = MathUtils.damp(this.player.speed, 220, 1, dt);
      this.player.pos.y = Math.max(
        150,
        this.ground(this.player.pos.x, this.player.pos.z) + 120,
        this.player.pos.y,
      );
      this.player.yaw += MathUtils.clamp(
        angleDelta(
          this.player.yaw,
          Math.atan2(-this.player.pos.x, this.time * 17 - this.player.pos.z),
        ),
        -dt * 0.18,
        dt * 0.18,
      );
      this.player.roll = MathUtils.damp(this.player.roll, 0.15, 2, dt);
      this.player.pos.addScaledVector(this.forward(), this.player.speed * dt);
      return;
    }
    this.updatePlayer(dt, input);
    if (!this.playing()) return;
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateWingmen(dt);
    if (this.comboTime > 0) {
      this.comboTime -= dt;
      if (this.comboTime <= 0) {
        this.combo = 0;
        this.aceComboBroken = true;
      }
    }
    if (this.phase === "ace" && this.combo === 0) this.aceComboBroken = true;
    if (!this.target) this.selectTarget();
    this.updateLock(dt);
    if (this.phase === "launch" && this.phaseTime >= 4) this.enter("tutorial");
    else if (this.phase === "tutorial") this.updateTutorial(dt, input);
    else if (this.phase === "drones") {
      if (this.trainingKills >= 3) {
        if (!this.trainingCompleteAt) {
          this.trainingCompleteAt = this.time;
          this.announce("COMBO ×3", "TRAINING COMPLETE", 4);
          this.say("JOKER 2", "Not bad. Looks like you remember how to shoot.");
        } else if (this.time - this.trainingCompleteAt > 4.5)
          this.enter("warning");
      } else this.spawnDrone();
    } else if (this.phase === "warning" && this.phaseTime > 6)
      this.enter("scouts");
    else if (this.phase === "scouts") {
      const scouts = this.alive("scout");
      if (!scouts.some((s) => s.interrupted > 0)) this.dataTime -= dt;
      for (const s of scouts)
        if (s.interrupted <= 0)
          s.upload = Math.max(0, Math.min(100, 100 * (1 - this.dataTime / 90)));
      if (this.dataTime <= 0 || scouts.some((s) => s.upload >= 100)) {
        this.fail("A scout transmitted the fleet’s position.");
        return;
      }
      if (this.scoutsDown >= 1) this.enter("dogfight");
    } else if (this.phase === "dogfight") {
      if (this.alive("fighter").length <= 1 || this.phaseTime > 115) {
        if (this.damageTaken === this.noDamageStart)
          this.addScore(2000, "NO DAMAGE BONUS");
        this.enter(this.alive("scout").length ? "chase" : "ace");
      }
    } else if (this.phase === "chase") {
      this.chaseTime -= dt;
      const s = this.enemies.find((e) => e.id === this.chaseId);
      if (!s || s.dead) {
        this.announce("TRANSMISSION STOPPED", "LEAD SCOUT DESTROYED");
        this.enter("ace");
      } else {
        s.upload = 100 * (1 - this.chaseTime / 65);
        if (this.chaseTime <= 0)
          this.fail("The lead scout escaped beyond the coast.");
      }
    } else if (this.phase === "ace") {
      const ace = this.alive("ace")[0];
      if (ace && ace.hp < ace.maxHp * 0.5 && !this.aceEnraged) {
        this.aceEnraged = true;
        this.announce("ACE ENRAGED", "WATCH FOR HEAD-ON PASSES");
      }
      if (!ace || this.phaseTime > 145)
        this.enter(this.alive("scout").length ? "final" : "clear");
    } else if (this.phase === "final") {
      this.finalTime -= dt;
      const remaining = this.alive("scout");
      if (!remaining.length) this.enter("clear");
      else if (this.finalTime <= 0)
        this.fail("The final scout escaped. The fleet has been detected.");
      else
        for (const s of remaining) s.upload = 100 * (1 - this.finalTime / 25);
    }
    if (
      ["scouts", "dogfight", "ace"].includes(this.phase) &&
      this.time - this.chatter > 24
    ) {
      this.chatter = this.time;
      this.say(
        "JOKER " + (2 + (Math.floor(this.time) % 3)),
        [
          "Two on your six!",
          "Keep that pressure on.",
          "Don’t let them transmit!",
        ][Math.floor(this.time) % 3],
      );
    }
  }
  private updatePlayer(dt: number, input: Input) {
    const p = this.player;
    p.prev.copy(p.pos);
    for (const k of [
      "missileCD",
      "rollCD",
      "flareCD",
      "invincible",
      "gunCD",
    ] as const)
      p[k] = Math.max(0, p[k] - dt);
    let turn = input.turn,
      pitch = input.pitch;
    const pursuit = input.pursuit && (this.target || this.gate);
    if (pursuit) {
      const pos = this.target
        ? this.target.pos.clone().addScaledVector(this.target.vel, 0.25)
        : this.gate!.pos;
      const d = pos.clone().sub(p.pos);
      const yaw = Math.atan2(d.x, d.z),
        elev = Math.atan2(d.y, Math.hypot(d.x, d.z));
      turn = MathUtils.clamp(-angleDelta(p.yaw, yaw) * 2.8, -1, 1);
      pitch = MathUtils.clamp((elev - p.pitch) * 3, -1, 1);
    }
    if (this.phase === "launch") {
      p.speed = MathUtils.damp(p.speed, 210, 1.1, dt);
      p.pitch = 0.12;
      p.pos.addScaledVector(this.forward(), p.speed * dt);
      return;
    }
    const boosting = input.boost && p.boost > 0 && !input.brake;
    const speed = boosting ? 390 : input.brake ? 120 : 220;
    p.speed = MathUtils.damp(p.speed, speed, 2, dt);
    p.boost = MathUtils.clamp(p.boost + (boosting ? -6 : 10) * dt, 0, 100);
    p.yaw -= turn * dt * (input.brake ? 1.15 : boosting ? 0.57 : 0.85);
    p.pitch = MathUtils.clamp(p.pitch + pitch * dt * 0.64, -1.25, 1.25);
    if (Math.abs(pitch) < 0.02) p.pitch = MathUtils.damp(p.pitch, 0, 0.18, dt);
    const bank = -turn * 0.92;
    p.roll = MathUtils.damp(p.roll, bank, 6, dt);
    if (p.rollTime > 0) p.rollTime = Math.max(0, p.rollTime - dt);
    p.pos.addScaledVector(this.forward(), p.speed * dt);
    // Keep terrain collisions forgiving once, but preserve real damage and failure.
    const ground = this.ground(p.pos.x, p.pos.z);
    const rp = this.toRoute(p.pos);
    if (
      this.chaseOrigin &&
      Math.abs(rp.z - 6800) < 48 &&
      Math.abs(rp.x) < 1500 &&
      p.pos.y > 280 &&
      p.pos.y < 350
    ) {
      p.pos.y = 351;
      p.pitch = 0.3;
      this.damagePlayer(34, "TERRAIN COLLISION");
    }
    const bridgeUnder =
      ((Math.abs(p.pos.z - 12100) < 55 && Math.abs(p.pos.x) < 1450) ||
        (this.chaseOrigin &&
          Math.abs(rp.z - 6800) < 55 &&
          Math.abs(rp.x) < 1450)) &&
      p.pos.y < 280;
    if (p.pos.y < (bridgeUnder ? 18 : ground + 18)) {
      p.pos.y = bridgeUnder ? 18 : ground + 18;
      p.pitch = Math.max(0.18, p.pitch);
      this.damagePlayer(34, "TERRAIN COLLISION");
      this.notify("PULL UP");
    }
    if (p.pos.y > 3400) {
      p.pitch = Math.min(p.pitch, -0.08);
      this.notify("ALTITUDE LIMIT");
    }
    p.heat = Math.max(0, p.heat - dt * 24);
    if (p.overheated && p.heat < 28) p.overheated = false;
    if (input.gun && !p.overheated && p.gunCD <= 0) {
      p.gunCD = 0.085;
      p.heat += 4.5;
      let dir = this.forward();
      const t = this.target;
      if (t) {
        const d = t.pos.clone().sub(p.pos);
        if (d.length() < 900 && d.normalize().dot(dir) > 0.988)
          dir = t.pos
            .clone()
            .addScaledVector(t.vel, t.pos.distanceTo(p.pos) / 1700)
            .sub(p.pos)
            .normalize();
      }
      this.projectiles.push({
        id: ++this.serial,
        pos: p.pos.clone().addScaledVector(dir, 30),
        prev: p.pos.clone(),
        vel: dir.multiplyScalar(1700 + p.speed),
        life: 0.5,
        type: "bullet",
        target: t?.id ?? -1,
        damage: 5,
      });
      this.emit("gun", "Gun fired");
      if (p.heat >= 100) {
        p.overheated = true;
        this.notify("GUN OVERHEAT · RELEASE TO COOL");
      }
    }
  }
  private updateLock(dt: number) {
    const t = this.target;
    if (!t) {
      this.lock = 0;
      return;
    }
    const d = t.pos.clone().sub(this.player.pos);
    const distance = d.length(),
      dot = d.normalize().dot(this.forward());
    if (distance < 1900 && dot > 0.96 && !t.gunOnly) {
      const was = this.lock;
      this.lock = Math.min(
        1,
        this.lock + dt / (this.player.speed > 300 ? 2.3 : 1.1),
      );
      if (was < 1 && this.lock >= 1) this.emit("lock", "Target locked");
    } else this.lock = Math.max(0, this.lock - dt * 2);
  }
  private updateEnemies(dt: number) {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.interrupted = Math.max(0, e.interrupted - dt);
      e.dodge = Math.max(0, e.dodge - dt);
      let destination = new Vector3(),
        speed = 180,
        turnRate = 1.0;
      const age = this.time - e.born;
      if (e.kind === "drone") {
        speed = e.evasive ? 205 : 185;
        const f = direction(e.yaw, 0);
        destination = e.pos.clone().addScaledVector(f, 1000);
        destination.y = Math.max(
          220,
          p.pos.y +
            Math.sin(age * (e.evasive ? 1.1 : 0.35)) * (e.evasive ? 160 : 20),
        );
        if (e.evasive) destination.x += Math.sin(age * 0.7) * 650;
        if (e.pos.distanceTo(p.pos) > 2600) {
          destination.copy(p.pos).addScaledVector(this.forward(), 700);
          speed = 145;
        }
      } else if (e.kind === "scout") {
        const running =
          (this.phase === "chase" && e.id === this.chaseId) ||
          this.phase === "final";
        if (running) {
          speed = this.phase === "final" ? 285 : 270;
          turnRate = 0.85;
          if (this.phase === "chase" && this.chaseOrigin) {
            const points = [
              [0, 180, 4300],
              [120, 155, 5500],
              [0, 170, 7000],
              [-180, 200, 9300],
              [0, 260, 22000],
            ];
            const point =
              points[Math.min(this.chaseWaypoint, points.length - 1)];
            destination = this.routePoint(point[0], point[1], point[2]);
            if (e.pos.distanceTo(destination) < 350) this.chaseWaypoint++;
          } else {
            const f = direction(e.yaw, 0);
            destination = e.pos.clone().addScaledVector(f, 2000);
            destination.x += Math.sin(age * 0.19) * 120;
            destination.y = 160 + Math.sin(age * 0.23) * 55;
          }
        } else if (this.phase === "scouts" || this.phase === "warning") {
          speed = 210;
          destination = e.pos
            .clone()
            .addScaledVector(direction(e.yaw, 0), 2000);
          destination.y = 550 + e.route * 80;
        } else {
          speed = 170;
          const a = age * 0.035 + e.route * 2;
          destination = p.pos
            .clone()
            .add(new Vector3(Math.sin(a) * 2600, 200, Math.cos(a) * 2600));
          destination.y = 550 + e.route * 90;
        }
      } else {
        const ace = e.kind === "ace",
          enraged = ace && this.aceEnraged;
        speed = ace ? (enraged ? 310 : 275) : 200;
        turnRate = ace ? (enraged ? 1.55 : 1.12) : 0.85;
        const pass = Math.floor(age / (ace ? 11 : 15)) % 2;
        const d = e.pos.distanceTo(p.pos);
        if ((pass === 0 && d > 300) || enraged) {
          destination
            .copy(p.pos)
            .addScaledVector(this.forward(), (d / 550) * p.speed * 0.3);
        } else {
          const a = age * (ace ? 0.45 : 0.22) + e.id;
          destination
            .copy(p.pos)
            .add(new Vector3(Math.sin(a) * 1100, 0, Math.cos(a) * 1100));
          destination.y =
            p.pos.y +
            (ace ? Math.sin(age * 0.36) * 650 : 150 * Math.sin(age * 0.3));
        }
        if (ace && age < 4) {
          destination.copy(p.pos);
          speed = 390;
        }
        const toPlayer = p.pos.clone().sub(e.pos);
        if (
          this.time > e.shot &&
          d < 3200 &&
          toPlayer.normalize().dot(direction(e.yaw, e.pitch)) > 0.6
        ) {
          e.shot = this.time + (ace ? 5 : 9) + (e.id % 3);
          this.projectiles.push({
            id: ++this.serial,
            pos: e.pos.clone(),
            prev: e.pos.clone(),
            vel: toPlayer.multiplyScalar(340),
            life: 9,
            type: "hostile",
            target: -1,
            damage: ace ? 16 : 10,
          });
          this.emit("incoming", "Missile inbound");
        }
      }
      destination.y = Math.max(
        destination.y,
        this.ground(destination.x, destination.z) + 130,
      );
      const delta = destination.sub(e.pos);
      const desiredYaw = Math.atan2(delta.x, delta.z),
        desiredPitch = Math.atan2(delta.y, Math.hypot(delta.x, delta.z));
      const da = angleDelta(e.yaw, desiredYaw);
      e.yaw += MathUtils.clamp(da, -turnRate * dt, turnRate * dt);
      e.pitch = MathUtils.damp(
        e.pitch,
        MathUtils.clamp(desiredPitch, -0.8, 0.8),
        2,
        dt,
      );
      e.roll = MathUtils.damp(e.roll, MathUtils.clamp(da, -0.9, 0.9), 4, dt);
      e.vel.copy(direction(e.yaw, e.pitch)).multiplyScalar(speed);
      e.pos.addScaledVector(e.vel, dt);
      e.pos.y = Math.max(e.pos.y, this.ground(e.pos.x, e.pos.z) + 60);
    }
  }
  private updateProjectiles(dt: number) {
    for (const m of this.projectiles) {
      m.life -= dt;
      if (m.life <= 0) continue;
      m.prev.copy(m.pos);
      if (m.type === "missile" || m.type === "friendly") {
        const t = this.enemies.find((e) => e.id === m.target && !e.dead);
        if (t) {
          if (
            m.type === "missile" &&
            t.kind === "ace" &&
            !this.aceEnraged &&
            t.dodge <= 0 &&
            m.pos.distanceTo(t.pos) < 230
          ) {
            m.life = 0;
            t.dodge = 8;
            this.effect(t.pos, "flare", 5);
            this.notify("ACE EVADED · KEEP THE PRESSURE ON");
            continue;
          }
          const desired = t.pos
            .clone()
            .addScaledVector(t.vel, 0.12)
            .sub(m.pos)
            .normalize();
          m.vel.lerp(desired.multiplyScalar(600), 1 - Math.exp(-dt * 4.2));
        }
      } else if (m.type === "hostile") {
        if (this.player.rollTime > 0.05) {
          m.life = 0;
          this.addScore(100, "MISSILE EVADED");
          continue;
        }
        const desired = this.player.pos
          .clone()
          .sub(m.pos)
          .normalize()
          .multiplyScalar(370);
        m.vel.lerp(desired, 1 - Math.exp(-dt * 0.75));
      }
      m.pos.addScaledVector(m.vel, dt);
      const seg = m.pos.clone().sub(m.prev);
      const len = seg.lengthSq();
      if (m.type === "hostile") {
        const t = MathUtils.clamp(
          this.player.pos.clone().sub(m.prev).dot(seg) / Math.max(1, len),
          0,
          1,
        );
        if (
          m.prev.clone().addScaledVector(seg, t).distanceTo(this.player.pos) <
          28
        ) {
          m.life = 0;
          this.damagePlayer(m.damage);
          this.effect(m.pos, "explosion", 0.8);
        }
      } else
        for (const e of this.enemies) {
          if (e.dead) continue;
          const t = MathUtils.clamp(
            e.pos.clone().sub(m.prev).dot(seg) / Math.max(1, len),
            0,
            1,
          );
          const radius = e.kind === "scout" ? 36 : e.kind === "ace" ? 28 : 25;
          if (
            m.prev.clone().addScaledVector(seg, t).distanceTo(e.pos) < radius
          ) {
            m.life = 0;
            this.hit(
              e,
              m.damage,
              m.type === "bullet"
                ? "gun"
                : m.type === "friendly"
                  ? "wingman"
                  : "missile",
            );
            break;
          }
        }
    }
    this.projectiles = this.projectiles.filter((m) => m.life > 0);
  }
  private updateWingmen(dt: number) {
    const right = new Vector3(
      -Math.cos(this.player.yaw),
      0,
      Math.sin(this.player.yaw),
    );
    const active = ["scouts", "dogfight", "chase", "ace", "final"].includes(
      this.phase,
    );
    this.wingmen.forEach((wing, index) => {
      const kind =
        this.order === "scouts" || (this.order === "split" && index === 0)
          ? "scout"
          : "fighter";
      const candidates = active
        ? this.alive(kind)
            .filter((e) => e.pos.distanceTo(this.player.pos) < 5000)
            .sort((a, b) => a.pos.distanceTo(wing) - b.pos.distanceTo(wing))
        : [];
      const target = candidates[index % Math.max(1, candidates.length)];
      this.wingTargets[index] = target?.id ?? -1;
      const destination = target
        ? target.pos
            .clone()
            .addScaledVector(direction(target.yaw, target.pitch), -250)
            .addScaledVector(right, (index - 1) * 130)
        : this.player.pos
            .clone()
            .addScaledVector(this.forward(), -90 - index * 65)
            .addScaledVector(right, (index % 2 ? 1 : -1) * (95 + index * 30));
      destination.y = Math.max(
        destination.y + 25,
        this.ground(destination.x, destination.z) + 90,
      );
      const delta = destination.sub(wing);
      if (delta.lengthSq() > 1)
        this.wingHeadings[index] = Math.atan2(delta.x, delta.z);
      const distance = delta.length();
      wing.addScaledVector(
        delta.normalize(),
        Math.min(distance, dt * (target ? 350 : 440)),
      );
    });
    if (!active) return;
    this.wingAttack -= dt;
    if (this.wingAttack > 0) return;
    this.wingAttack = 1.3;
    const index = this.wingTurn++ % 3;
    const target = this.enemies.find(
      (e) => e.id === this.wingTargets[index] && !e.dead,
    );
    const origin = this.wingmen[index];
    if (target && target.pos.distanceTo(origin) < 2800) {
      this.projectiles.push({
        id: ++this.serial,
        pos: origin.clone(),
        prev: origin.clone(),
        vel: target.pos.clone().sub(origin).normalize().multiplyScalar(600),
        life: 6,
        type: "friendly",
        target: target.id,
        damage: 3,
      });
      this.emit("wingman", target.name, "JOKER " + (index + 2));
    }
  }
  routePoint(x: number, y: number, z: number) {
    return new Vector3(
      x * Math.cos(this.chaseYaw) + z * Math.sin(this.chaseYaw),
      y,
      -x * Math.sin(this.chaseYaw) + z * Math.cos(this.chaseYaw),
    ).add(this.chaseOrigin ?? new Vector3());
  }
  toRoute(pos: Vector3) {
    const p = pos.clone().sub(this.chaseOrigin ?? new Vector3());
    return new Vector3(
      p.x * Math.cos(this.chaseYaw) - p.z * Math.sin(this.chaseYaw),
      p.y,
      p.x * Math.sin(this.chaseYaw) + p.z * Math.cos(this.chaseYaw),
    );
  }
  ground(x: number, z: number) {
    let h = terrainHeight(x, z);
    if (this.chaseOrigin) {
      const p = this.toRoute(new Vector3(x, 0, z));
      for (const i of chaseIslands) {
        const d = Math.sqrt(
          ((p.x - i.x) / i.rx) ** 2 + ((p.z - i.z) / i.rz) ** 2,
        );
        if (d < 1)
          h = Math.max(
            h,
            i.h * Math.min(1, (1 - d) * 5) * (0.77 + 0.23 * (1 - d)),
          );
      }
    }
    return h;
  }
  get objective() {
    switch (this.phase) {
      case "launch":
        return "LAUNCH FROM THE CARRIER";
      case "tutorial":
        return (
          "FLIGHT CHECK  /  " + Math.min(5, this.tutorialIndex + 1) + " OF 5"
        );
      case "drones":
        return "DESTROY 3 DRONES  /  " + this.trainingKills + " OF 3";
      case "warning":
        return "IDENTIFY INCOMING CONTACTS";
      case "scouts":
        return "DESTROY THE SCOUTS BEFORE THEY ESCAPE";
      case "dogfight":
        return (
          "CLEAR THE ESCORTS  /  " + this.alive("fighter").length + " REMAIN"
        );
      case "chase":
        return "INTERCEPT THE LEAD SCOUT";
      case "ace":
        return "ENGAGE THE UNKNOWN ACE";
      case "final":
        return "STOP THE FINAL TRANSMISSION";
      case "clear":
        return "RETURN TO THE FLEET";
      case "failed":
        return "FLEET COMPROMISED";
      default:
        return "KEEP THE SKIES CLEAR";
    }
  }
  snapshot() {
    return {
      phase: this.phase,
      missionEndTime: this.missionEndTime,
      time: +this.time.toFixed(2),
      phaseTime: +this.phaseTime.toFixed(2),
      paused: this.paused,
      score: this.score,
      combo: this.combo,
      hotStart: this.hotStart,
      player: {
        pos: this.player.pos.toArray(),
        yaw: this.player.yaw,
        pitch: this.player.pitch,
        speed: this.player.speed,
        hp: this.player.hp,
        boost: this.player.boost,
        heat: this.player.heat,
      },
      target: this.targetId,
      lock: this.lock,
      tutorialIndex: this.tutorialIndex,
      tutorialPassed: this.tutorialPassed,
      cleanGates: this.cleanGates,
      trainingKills: this.trainingKills,
      scoutsDown: this.scoutsDown,
      aceEnraged: this.aceEnraged,
      aceKilled: this.aceKilled,
      dataTime: this.dataTime,
      chaseTime: this.chaseTime,
      finalTime: this.finalTime,
      order: this.order,
      wingTargets: this.wingTargets,
      enemies: this.alive().map((e) => ({
        id: e.id,
        kind: e.kind,
        name: e.name,
        pos: e.pos.toArray(),
        hp: e.hp,
        upload: e.upload,
      })),
      projectiles: this.projectiles.length,
      phases: this.phaseHistory,
      failReason: this.failReason,
    };
  }
}

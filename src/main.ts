import "./style.css";
import { Game, emptyInput } from "./core";
import { World } from "./world";
import { HUD, markup } from "./hud";
import { AudioSystem } from "./audio";

const errors: string[] = [];
window.addEventListener("error", (event) =>
  errors.push(event.message + " at " + event.filename + ":" + event.lineno),
);
window.addEventListener("unhandledrejection", (event) =>
  errors.push(String(event.reason)),
);
const root = document.querySelector<HTMLDivElement>("#app")!;
root.innerHTML = markup;
const game = new Game(),
  hud = new HUD(),
  sound = new AudioSystem();
let world: World;
try {
  world = new World(document.querySelector<HTMLCanvasElement>("#world")!);
} catch (error) {
  root.innerHTML =
    '<section class="modal"><div class="modal-inner"><h2>WEBGL REQUIRED</h2><p>This flight needs WebGL. Enable hardware acceleration in your browser, then reload.</p><button class="primary" onclick="location.reload()">TRY AGAIN</button></div></section>';
  throw error;
}
window.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") {
    hud.touch = true;
    ($("touch-mode") as HTMLInputElement).checked = true;
  }
});
const keys = new Set<string>();
const touch = emptyInput();
let mouseSteering = false,
  mouseX = 0,
  mouseY = 0,
  mouseActive = false;
let last = performance.now(),
  accumulator = 0,
  lastEventId = 0;
const frames: number[] = [];
let autoPaused = false;
const $ = (id: string) => document.getElementById(id)!;
const controls = new Set([
  "KeyW",
  "KeyS",
  "KeyA",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "KeyC",
  "Space",
  "KeyE",
  "KeyQ",
  "KeyF",
  "KeyX",
  "KeyR",
  "Tab",
  "Escape",
]);
function clearInput() {
  keys.clear();
  Object.assign(touch, emptyInput());
  mouseX = mouseY = 0;
  mouseActive = false;
  $("stick-knob").style.transform = "";
}
function pause(value: boolean) {
  if (["standby", "failed", "clear"].includes(game.phase)) return;
  game.paused = value;
  clearInput();
  sound.pause(value);
  if (!value) autoPaused = false;
}
function start() {
  clearInput();
  game.start();
  lastEventId = 0;
  accumulator = 0;
  sound.init();
  sound.reset();
  sound.pause(false);
  autoPaused = false;
  (document.activeElement as HTMLElement)?.blur();
}
$("launch").addEventListener("click", start);
$("replay").addEventListener("click", start);
$("restart").addEventListener("click", start);
$("pause").addEventListener("click", () => pause(!game.paused));
$("resume").addEventListener("click", () => pause(false));
$("sound").addEventListener("click", () => {
  sound.init();
  const enabled = sound.toggle();
  $("sound").textContent = enabled ? "SOUND ON" : "SOUND OFF";
  $("sound").setAttribute(
    "aria-label",
    enabled ? "Mute audio" : "Enable audio",
  );
  if (game.paused) sound.pause(true);
});
($("mouse-steer") as HTMLInputElement).addEventListener("change", (e) => {
  mouseSteering = (e.target as HTMLInputElement).checked;
  mouseX = mouseY = 0;
});
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
world.reducedMotion = reduced;
($("reduce-motion") as HTMLInputElement).checked = reduced;
($("touch-mode") as HTMLInputElement).checked = hud.touch;
$("touch-mode").addEventListener(
  "change",
  (e) => (hud.touch = (e.target as HTMLInputElement).checked),
);
$("reduce-motion").addEventListener(
  "change",
  (e) => (world.reducedMotion = (e.target as HTMLInputElement).checked),
);
$("low-quality").addEventListener("change", (e) =>
  world.setQuality((e.target as HTMLInputElement).checked),
);
$("voice").addEventListener("change", (e) => {
  sound.voice = (e.target as HTMLInputElement).checked;
  if (!sound.voice && "speechSynthesis" in window) speechSynthesis.cancel();
});
window.addEventListener("keydown", (e) => {
  if (controls.has(e.code) && game.phase !== "standby") e.preventDefault();
  if (e.code === "Enter" && game.phase === "standby") {
    start();
    return;
  }
  if (e.repeat) return;
  if (e.code === "Escape") {
    pause(!game.paused);
    return;
  }
  if (!game.playing()) return;
  keys.add(e.code);
  if (e.code === "KeyE") game.missile();
  if (e.code === "KeyQ") game.roll();
  if (e.code === "KeyF") game.flare();
  if (e.code === "Tab") game.selectTarget(true);
  if (e.code === "KeyR") game.cycleOrder();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
const canvas = $("world");
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => {
  if (!game.playing() || e.pointerType === "touch") return;
  if (e.button === 0) keys.add("Space");
  if (e.button === 2) game.missile();
});
window.addEventListener("pointerup", () => keys.delete("Space"));
window.addEventListener("pointercancel", clearInput);
canvas.addEventListener("pointermove", (e) => {
  if (!mouseSteering || !game.playing() || e.pointerType === "touch") return;
  mouseActive = true;
  mouseX = Math.max(-1, Math.min(1, (e.clientX / innerWidth - 0.5) * 3));
  mouseY = Math.max(-1, Math.min(1, (0.5 - e.clientY / innerHeight) * 3));
});
canvas.addEventListener("pointerleave", () => {
  mouseX = mouseY = 0;
  mouseActive = false;
  keys.delete("Space");
});
window.addEventListener("blur", () => {
  clearInput();
  if (game.playing()) {
    autoPaused = true;
    pause(true);
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.playing()) {
    autoPaused = true;
    pause(true);
  }
});
let stickPointer = -1;
const stick = $("stick"),
  knob = $("stick-knob");
function moveStick(e: PointerEvent) {
  const r = stick.getBoundingClientRect();
  const dx = Math.max(-40, Math.min(40, e.clientX - r.left - r.width / 2)),
    dy = Math.max(-40, Math.min(40, e.clientY - r.top - r.height / 2));
  touch.turn = dx / 40;
  touch.pitch = -dy / 40;
  knob.style.transform = "translate(" + dx + "px," + dy + "px)";
}
stick.addEventListener("pointerdown", (e) => {
  stickPointer = e.pointerId;
  stick.setPointerCapture(e.pointerId);
  moveStick(e);
});
stick.addEventListener("pointermove", (e) => {
  if (e.pointerId === stickPointer) moveStick(e);
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
  stick.addEventListener(event, () => {
    stickPointer = -1;
    touch.turn = touch.pitch = 0;
    knob.style.transform = "";
  });
document
  .querySelectorAll<HTMLButtonElement>("[data-hold]")
  .forEach((button) => {
    const key = button.dataset.hold as "boost" | "brake" | "gun" | "pursuit";
    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      touch[key] = true;
    });
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(event, () => (touch[key] = false));
  });
document
  .querySelectorAll<HTMLButtonElement>("[data-action]")
  .forEach((button) =>
    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      switch (button.dataset.action) {
        case "missile":
          game.missile();
          break;
        case "roll":
          game.roll();
          break;
        case "target":
          game.selectTarget(true);
          break;
        case "flare":
          game.flare();
          break;
        case "order":
          game.cycleOrder();
          break;
      }
    }),
  );
function input() {
  const held = (...codes: string[]) => codes.some((c) => keys.has(c));
  return {
    turn:
      touch.turn ||
      (mouseActive
        ? mouseX
        : (held("KeyD", "ArrowRight") ? 1 : 0) -
          (held("KeyA", "ArrowLeft") ? 1 : 0)),
    pitch:
      touch.pitch ||
      (mouseActive
        ? mouseY
        : (held("KeyW", "ArrowUp") ? 1 : 0) -
          (held("KeyS", "ArrowDown") ? 1 : 0)),
    boost: touch.boost || held("ShiftLeft", "ShiftRight"),
    brake: touch.brake || held("KeyC", "ControlLeft", "ControlRight"),
    gun: touch.gun || held("Space"),
    pursuit: touch.pursuit || held("KeyX"),
  };
}
function events() {
  for (const e of game.events) {
    if (e.id <= lastEventId) continue;
    sound.event(e);
    if (e.type === "damage") {
      hud.damage = 1;
      world.shake = 0.9;
    }
    if (e.type === "kill") world.shake = 0.5;
    if (e.type === "hit") hud.onHit(game.time);
    lastEventId = e.id;
  }
}
function frame(now: number) {
  const elapsed = Math.min((now - last) / 1000, 0.15);
  last = now;
  frames.push(elapsed * 1000);
  if (frames.length > 600) frames.shift();
  accumulator += elapsed;
  while (accumulator >= 1 / 60) {
    game.update(1 / 60, input());
    accumulator -= 1 / 60;
  }
  events();
  sound.update(game);
  world.update(game, game.paused ? 0 : elapsed);
  hud.update(game, world, elapsed);
  requestAnimationFrame(frame);
}
window.addEventListener("resize", () => {
  world.resize();
  hud.resize();
});
requestAnimationFrame(frame);
// Read-only telemetry supports runtime verification without adding gameplay shortcuts.
Object.defineProperty(window, "joker", {
  value: {
    snapshot: () => game.snapshot(),
    errors: () => errors.slice(),
    events: () => game.events.slice(-80),
    performance: () => {
      const sorted = [...frames].sort((a, b) => a - b);
      return {
        sampleCount: sorted.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        render: world.stats,
      };
    },
    input: () => ({ keys: [...keys], touch: { ...touch }, autoPaused }),
    get ready() {
      return true;
    },
  },
});

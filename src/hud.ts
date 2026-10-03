import { Game } from "./core";
import { World } from "./world";

const planeIcon =
  '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="m20 3 4 14 13 10v3l-14-5v7l5 4-8-2-8 2 5-4v-7L3 30v-3l13-10z" fill="currentColor"/></svg>';
export const markup =
  '<canvas id="world" aria-label="Third-person flight combat view"></canvas><canvas id="overlay" aria-hidden="true"></canvas>' +
  '<div id="vignette"></div><div id="damage-flash"></div><div id="speed-lines"></div>' +
  '<section id="start-screen"><header class="title-header"><div class="squadron-mark">' +
  planeIcon +
  '<span>JOKER<br><b>SQUADRON</b></span></div><span class="build-stamp">CAMPAIGN DEMO<br><b>MISSION 01</b></span></header>' +
  '<div class="title-copy"><div class="operation"><span></span> HALCYON COAST · 06:40</div><h1>JOKER’S<br>RUN<span class="title-period">.</span></h1><p>Your fleet is running out of ocean.<br>Keep the skies clear.</p><button id="launch" class="primary">LAUNCH MISSION <span>↗</span></button><div class="launch-note">8–10 MINUTES <i></i> ONE MISSION. BRING THEM HOME.</div></div>' +
  '<div class="start-controls"><span><kbd>W A S D</kbd> FLY</span><span><kbd>SPACE</kbd> GUNS</span><span><kbd>E</kbd> MISSILE</span><span><kbd>SHIFT</kbd> BOOST</span></div><div class="title-coordinate">36° 14′ N<br>THE NEUTRAL LINE</div></section>' +
  '<main id="hud" class="hidden"><div class="objective"><div class="mission-tag"><span class="live-dot"></span> MISSION 01 <span class="slash">/</span> JOKER’S RUN</div><h2 id="objective"></h2><div id="phase-track"></div><div id="tutorial" class="hidden"><span id="tutorial-key"></span><strong id="tutorial-action"></strong><small>FLY THROUGH THE CHECKPOINT</small></div></div>' +
  '<div class="compass"><span>W</span><div id="heading">000</div><span>N</span><i></i></div>' +
  '<div class="score-block"><div class="small-label">SCORE</div><strong id="score">000000</strong><div id="combo">HOT START ×1.00</div><div class="combo-track"><i id="combo-fill"></i></div></div>' +
  '<div id="ace-meter" class="hidden"><div><span id="ace-stage">UNKNOWN ACE</span><span id="ace-percent">100%</span></div><div class="ace-track"><i id="ace-fill"></i></div></div>' +
  '<div id="timer" class="hidden"><small id="timer-label">DATA TRANSMISSION</small><strong id="timer-value">01:30</strong></div>' +
  '<div id="announcement" class="hidden"><h2 id="announcement-title"></h2><p id="announcement-sub"></p></div>' +
  '<div id="toast"></div><div id="incoming" class="hidden">△ MISSILE INBOUND <span>F · FLARES / Q · ROLL</span></div>' +
  '<div class="flight-instrument speed"><small>SPD</small><strong id="speed">000</strong><span>KNOTS</span><div class="vertical-ticks"></div></div><div class="flight-instrument altitude"><small>ALT</small><strong id="altitude">0000</strong><span>METERS</span><div class="vertical-ticks"></div></div>' +
  '<div class="radar-block"><canvas id="radar" width="360" height="360" aria-label="Radar showing nearby contacts"></canvas><div class="radar-caption"><span>AWACS</span><span>5 KM</span></div><div class="wingmen"><span>◆ ◆ ◆</span> JOKER FLIGHT <b id="wing-order">COVER</b></div></div>' +
  '<div class="systems"><div class="airframe"><span>F / A — 27</span><strong id="health-label">100 <small>HULL</small></strong></div><div class="hull-track"><i id="health-fill"></i></div><div class="system-line"><span>MSL</span><strong id="missile-state">STANDBY</strong><small>E</small></div><div class="system-line"><span>GUN</span><div class="meter"><i id="heat-fill"></i></div><small>SPACE</small></div><div class="system-line"><span>BST</span><div class="meter"><i id="boost-fill"></i></div><small>SHIFT</small></div><div class="counter-line"><span id="flare-state">FLARES READY</span><span id="roll-state">ROLL READY</span></div></div>' +
  '<div id="radio" class="hidden"><div class="radio-signal"><i></i><i></i><i></i><i></i><i></i></div><div><span id="radio-speaker"></span><p id="radio-text"></p></div></div>' +
  '<footer class="control-strip"><span><kbd>WASD</kbd> FLY</span><span><kbd>X</kbd> HOLD: PURSUIT</span><span><kbd>TAB</kbd> TARGET</span><span><kbd>R</kbd> WINGMEN</span><span><kbd>Q</kbd> ROLL</span><span><kbd>C</kbd> BRAKE</span></footer></main>' +
  '<div class="utility"><button id="sound" aria-label="Mute audio" title="Toggle audio">SOUND ON</button><button id="pause" aria-label="Pause mission" title="Pause and controls">Ⅱ <span>ESC</span></button></div>' +
  '<section id="pause-screen" class="modal hidden"><div class="modal-inner"><div class="operation">JOKER FLIGHT · HOLDING</div><h2>PAUSED</h2><p>Take a breath. The fleet can wait.</p><button id="resume" class="primary">RESUME FLIGHT <span>↗</span></button><div class="controls-grid"><div><kbd>W / S</kbd><span>Climb / dive</span></div><div><kbd>A / D</kbd><span>Bank and turn</span></div><div><kbd>SPACE / CLICK</kbd><span>Guns</span></div><div><kbd>E / RIGHT CLICK</kbd><span>Locked missile</span></div><div><kbd>SHIFT / C</kbd><span>Boost / brake</span></div><div><kbd>X (HOLD)</kbd><span>Pursuit assist</span></div><div><kbd>Q / F</kbd><span>Roll / flares</span></div><div><kbd>TAB / R</kbd><span>Target / wingmen</span></div></div><div class="settings"><label><input id="mouse-steer" type="checkbox"> Mouse steering</label><label><input id="reduce-motion" type="checkbox"> Reduced motion</label><label><input id="low-quality" type="checkbox"> Low graphics</label><label><input id="touch-mode" type="checkbox"> Touch controls</label><label><input id="voice" type="checkbox" checked> Radio voice</label></div><button id="restart" class="secondary">RESTART MISSION</button></div></section>' +
  '<section id="results" class="modal hidden"><div class="modal-inner"><div class="operation" id="result-eyebrow">HALCYON COAST · DEBRIEF</div><h2 id="result-title">MISSION CLEAR</h2><p id="result-description">Carrier is still safe.</p><div class="result-stats"><div><span>FINAL SCORE</span><strong id="result-score">0</strong></div><div><span>RANK</span><strong id="result-rank">A</strong></div><div><span>BEST COMBO</span><strong id="result-combo">×0</strong></div></div><div id="result-best"></div><div id="next-mission"><span>NEXT MISSION</span><strong>BREAKOUT</strong><p>We may have been detected anyway.</p></div><button id="replay" class="primary">FLY AGAIN <span>↗</span></button></div></section>' +
  '<div id="touch-controls" class="hidden"><div id="stick" aria-label="Flight joystick"><div id="stick-knob"></div></div><div class="touch-actions"><button data-hold="pursuit">CHASE</button><button data-hold="boost">BOOST</button><button data-action="missile">MSL</button><button data-hold="gun" class="touch-fire">FIRE</button><button data-action="roll">ROLL</button><button data-action="target">TARGET</button><button data-hold="brake">BRAKE</button><button data-action="flare">FLARE</button><button data-action="order">WING</button></div></div>';

const $ = (id: string) => document.getElementById(id)!;
const text = (id: string, value: string) => {
  const el = $(id);
  if (el.textContent !== value) el.textContent = value;
};
const hide = (id: string, value: boolean) =>
  $(id).classList.toggle("hidden", value);
export class HUD {
  overlay = $("overlay") as HTMLCanvasElement;
  ctx = this.overlay.getContext("2d")!;
  radar = ($("radar") as HTMLCanvasElement).getContext("2d")!;
  width = 0;
  height = 0;
  damage = 0;
  best = 0;
  private saved = false;
  touch = matchMedia("(pointer: coarse)").matches;
  private lastHit = -1;
  constructor() {
    try {
      this.best = Number(localStorage.getItem("jokers-run-best") || 0);
    } catch {}
    this.resize();
  }
  resize() {
    this.width = innerWidth;
    this.height = innerHeight;
    const d = Math.min(devicePixelRatio, 2);
    this.overlay.width = this.width * d;
    this.overlay.height = this.height * d;
    this.overlay.style.width = this.width + "px";
    this.overlay.style.height = this.height + "px";
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  update(g: Game, w: World, dt: number) {
    const standby = g.phase === "standby",
      result =
        g.phase === "failed" || (g.phase === "clear" && g.phaseTime > 19);
    hide("start-screen", !standby);
    hide("hud", standby || result || g.paused);
    hide("pause-screen", !g.paused);
    hide("results", !result);
    hide("pause", standby || result);
    hide("touch-controls", !this.touch || standby || result || g.paused);
    document.body.classList.toggle("in-flight", !standby);
    document.body.classList.toggle(
      "cinematic",
      g.phase === "clear" && g.phaseTime > 7,
    );
    document.body.classList.toggle("is-touch", this.touch);
    if (!result) this.saved = false;
    if (result) {
      this.results(g);
      this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }
    if (standby || g.paused) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }
    text("objective", g.objective);
    text("score", String(g.score).padStart(6, "0"));
    text(
      "combo",
      g.combo > 1 ? "COMBO ×" + g.combo : "HOT START ×" + g.hotStart.toFixed(2),
    );
    $("combo-fill").style.width = (g.comboTime / 24) * 100 + "%";
    text(
      "heading",
      String(
        Math.round(((((g.player.yaw * 180) / Math.PI) % 360) + 360) % 360),
      ).padStart(3, "0"),
    );
    text("speed", String(Math.round(g.player.speed * 1.944)).padStart(3, "0"));
    text("altitude", String(Math.round(g.player.pos.y)).padStart(4, "0"));
    text("health-label", Math.round(g.player.hp) + " HULL");
    $("health-fill").style.width = g.player.hp + "%";
    $("health-fill").style.background = g.player.hp < 35 ? "#ff745c" : "";
    $("heat-fill").style.width = g.player.heat + "%";
    $("heat-fill").classList.toggle("danger", g.player.overheated);
    $("boost-fill").style.width = g.player.boost + "%";
    text(
      "missile-state",
      g.player.missileCD > 0
        ? "RELOAD " + g.player.missileCD.toFixed(1)
        : g.lock >= 1
          ? "LOCKED"
          : g.target
            ? "LOCK " + Math.floor(g.lock * 100) + "%"
            : "STANDBY",
    );
    $("missile-state").classList.toggle("locked", g.lock >= 1);
    text(
      "flare-state",
      g.player.flareCD > 0
        ? "FLARES " + Math.ceil(g.player.flareCD) + "s"
        : "FLARES READY",
    );
    text(
      "roll-state",
      g.player.rollCD > 0
        ? "ROLL " + Math.ceil(g.player.rollCD) + "s"
        : "ROLL READY",
    );
    text("wing-order", g.order.toUpperCase());
    const phases = [
      "tutorial",
      "drones",
      "scouts",
      "dogfight",
      "chase",
      "ace",
      "final",
    ];
    const ix = phases.indexOf(g.phase);
    const track = phases
      .map((_, i) => '<i class="' + (i <= ix ? "complete" : "") + '"></i>')
      .join("");
    if ($("phase-track").innerHTML !== track)
      $("phase-track").innerHTML = track;
    hide("tutorial", !g.gate);
    if (g.gate) {
      text("tutorial-action", g.gate.action);
      text(
        "tutorial-key",
        this.touch
          ? (
              {
                CLIMB: "STICK ↑",
                "BANK LEFT": "STICK ←",
                BOOST: "BOOST",
                BRAKE: "BRAKE",
                ROLL: "ROLL",
              } as Record<string, string>
            )[g.gate.action]
          : g.gate.key,
      );
      $("tutorial").classList.toggle("executed", g.gate.executed);
    }
    const timed = ["tutorial", "scouts", "chase", "final"].includes(g.phase);
    hide("timer", !timed);
    if (timed) {
      const t = Math.max(
        0,
        g.phase === "tutorial"
          ? 13 - (g.gate?.age ?? 0)
          : g.phase === "scouts"
            ? g.dataTime
            : g.phase === "chase"
              ? g.chaseTime
              : g.finalTime,
      );
      text(
        "timer-value",
        Math.floor(Math.ceil(t) / 60)
          .toString()
          .padStart(2, "0") +
          ":" +
          (Math.ceil(t) % 60).toString().padStart(2, "0"),
      );
      text(
        "timer-label",
        g.phase === "tutorial"
          ? "HOT START WINDOW"
          : g.phase === "scouts"
            ? "DATA TRANSMISSION"
            : "ESCAPE BOUNDARY",
      );
      $("timer").classList.toggle(
        "urgent",
        g.phase === "tutorial" ? t < 4 : t <= 15,
      );
    }
    const ace = g.alive("ace")[0];
    hide("ace-meter", g.phase !== "ace" || !ace);
    if (ace) {
      $("ace-fill").style.width = (ace.hp / ace.maxHp) * 100 + "%";
      text("ace-percent", Math.ceil((ace.hp / ace.maxHp) * 100) + "%");
      text("ace-stage", g.aceEnraged ? "ACE ENRAGED" : "UNKNOWN ACE");
    }
    hide("announcement", g.announcement.until < g.time);
    text("announcement-title", g.announcement.title);
    text("announcement-sub", g.announcement.sub);
    $("announcement").classList.toggle(
      "warning",
      ["warning", "final"].includes(g.phase),
    );
    text("toast", g.toast.until > g.time ? g.toast.text : "");
    hide("radio", g.radio.until < g.time);
    text("radio-speaker", g.radio.speaker);
    text("radio-text", g.radio.text);
    const incoming = g.projectiles.some(
      (m) => m.type === "hostile" && m.pos.distanceTo(g.player.pos) < 2000,
    );
    hide("incoming", !incoming);
    this.damage = Math.max(0, this.damage - dt * 1.8);
    $("damage-flash").style.opacity = String(this.damage * 0.6);
    $("speed-lines").style.opacity = w.reducedMotion
      ? "0"
      : String(Math.max(0, (g.player.speed - 290) / 250));
    this.drawOverlay(g, w);
    this.drawRadar(g);
  }
  onHit(time: number) {
    this.lastHit = time;
  }
  private results(g: Game) {
    const clear = g.phase === "clear";
    text("result-title", clear ? "MISSION CLEAR" : "MISSION FAILED");
    text(
      "result-description",
      clear ? "All scouts destroyed. Carrier is still safe." : g.failReason,
    );
    text("result-score", g.score.toLocaleString());
    text("result-combo", "×" + g.maxCombo);
    text(
      "result-rank",
      clear
        ? g.score > 43000
          ? "S"
          : g.score > 28000
            ? "A"
            : g.score > 16000
              ? "B"
              : "C"
        : "—",
    );
    hide("next-mission", !clear);
    if (clear && !this.saved) {
      this.best = Math.max(this.best, g.score);
      try {
        localStorage.setItem("jokers-run-best", String(this.best));
      } catch {}
      this.saved = true;
    }
    text(
      "result-best",
      "PERSONAL BEST  " +
        this.best.toLocaleString() +
        "   /   FLIGHT TIME  " +
        Math.floor(g.missionEndTime / 60) +
        ":" +
        Math.floor(g.missionEndTime % 60)
          .toString()
          .padStart(2, "0"),
    );
  }
  private drawOverlay(g: Game, w: World) {
    const c = this.ctx,
      W = this.width,
      H = this.height;
    c.clearRect(0, 0, W, H);
    if (g.phase === "clear") return;
    const f = g.forward();
    const aim = w.screen(g.player.pos.clone().addScaledVector(f, 1500));
    const ax = aim.x,
      ay = aim.y;
    c.strokeStyle = "rgba(228,247,230,.75)";
    c.lineWidth = 1.3;
    c.beginPath();
    c.arc(ax, ay, 23, 0, Math.PI * 2);
    c.moveTo(ax - 38, ay);
    c.lineTo(ax - 13, ay);
    c.moveTo(ax + 13, ay);
    c.lineTo(ax + 38, ay);
    c.moveTo(ax, ay - 34);
    c.lineTo(ax, ay - 15);
    c.moveTo(ax, ay + 15);
    c.lineTo(ax, ay + 28);
    c.stroke();
    c.fillStyle = "#efffe5";
    c.fillRect(ax - 1.5, ay - 1.5, 3, 3);
    if (g.time - this.lastHit < 0.15) {
      c.strokeStyle = "#ffe2a2";
      c.lineWidth = 2;
      c.beginPath();
      for (const s of [-1, 1])
        for (const v of [-1, 1]) {
          c.moveTo(ax + s * 27, ay + v * 27);
          c.lineTo(ax + s * 37, ay + v * 37);
        }
      c.stroke();
    }
    c.font = "11px ui-monospace, Menlo, monospace";
    c.textAlign = "center";
    if (g.gate) {
      const s = w.screen(g.gate.pos);
      if (s.visible) {
        c.fillStyle = "#ffe0a1";
        c.fillText(
          Math.round(g.gate.pos.distanceTo(g.player.pos)) + " M",
          s.x,
          s.y + 35,
        );
      }
    }
    for (const e of g.alive()) {
      const selected = e.id === g.targetId,
        s = w.screen(e.pos),
        distance = e.pos.distanceTo(g.player.pos);
      if (distance > 16000 && !selected) continue;
      const color =
        e.kind === "drone"
          ? "#f9d294"
          : e.kind === "scout"
            ? "#ffd697"
            : e.kind === "ace"
              ? "#ff8d78"
              : "#ff8e7a";
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineWidth = selected ? 1.8 : 1;
      if (s.visible) {
        const r = selected ? 28 : 12;
        const x = s.x,
          y = s.y;
        c.beginPath();
        if (selected) {
          const corner = 9;
          for (const dx of [-1, 1])
            for (const dy of [-1, 1]) {
              c.moveTo(x + dx * (r - corner), y + dy * r);
              c.lineTo(x + dx * r, y + dy * r);
              c.lineTo(x + dx * r, y + dy * (r - corner));
            }
        } else {
          c.moveTo(x, y - r);
          c.lineTo(x + r, y);
          c.lineTo(x, y + r);
          c.lineTo(x - r, y);
          c.closePath();
        }
        c.stroke();
        if (selected || e.kind === "scout") {
          c.shadowColor = "#173945";
          c.shadowBlur = 5;
          c.fillText(e.name, x, y - r - 16);
          c.fillText((distance / 1000).toFixed(2) + " KM", x, y + r + 18);
          c.shadowBlur = 0;
          c.fillStyle = "rgba(11,34,45,.7)";
          c.fillRect(x - 30, y - r - 8, 60, 3);
          c.fillStyle = color;
          c.fillRect(x - 30, y - r - 8, (60 * e.hp) / e.maxHp, 3);
          if (e.kind === "scout") {
            c.fillText("UPLOAD " + Math.round(e.upload) + "%", x, y + r + 33);
            c.fillStyle = "rgba(11,34,45,.65)";
            c.fillRect(x - 32, y + r + 39, 64, 3);
            c.fillStyle = color;
            c.fillRect(x - 32, y + r + 39, e.upload * 0.64, 3);
          }
        }
        if (selected && g.lock > 0) {
          c.strokeStyle = g.lock >= 1 ? "#eafab1" : color;
          c.beginPath();
          c.arc(x, y, 39, -Math.PI / 2, -Math.PI / 2 + g.lock * Math.PI * 2);
          c.stroke();
          if (g.lock >= 1) {
            c.fillStyle = "#eafab1";
            c.fillText("LOCKED", x, y + 65);
          }
        }
      } else if (selected) {
        const dx = (s.x - W / 2) * (s.behind ? -1 : 1),
          dy = (s.y - H / 2) * (s.behind ? -1 : 1);
        const a = Math.atan2(dy, dx);
        const radius = Math.min(W * 0.37, H * 0.35);
        const x = W / 2 + Math.cos(a) * radius,
          y = H / 2 + Math.sin(a) * radius;
        c.save();
        c.translate(x, y);
        c.rotate(a);
        c.beginPath();
        c.moveTo(13, 0);
        c.lineTo(-7, -8);
        c.lineTo(-3, 0);
        c.lineTo(-7, 8);
        c.closePath();
        c.fill();
        c.restore();
        c.fillText(e.name.replace(/ ·.*/, ""), x, y + 25);
        c.fillText(
          (distance / 1000).toFixed(1) + " KM" + (s.behind ? " · BEHIND" : ""),
          x,
          y + 40,
        );
      }
    }
    // A small flight-path ladder, leaving the aircraft and the shooting line clear.
    c.strokeStyle = "rgba(225,242,225,.25)";
    c.lineWidth = 1;
    for (const y of [-65, 65]) {
      c.beginPath();
      c.moveTo(ax - 110, ay + y);
      c.lineTo(ax - 66, ay + y);
      c.moveTo(ax + 66, ay + y);
      c.lineTo(ax + 110, ay + y);
      c.stroke();
    }
  }
  private drawRadar(g: Game) {
    const c = this.radar;
    c.clearRect(0, 0, 360, 360);
    c.save();
    c.translate(180, 180);
    c.fillStyle = "rgba(11,39,50,.30)";
    c.beginPath();
    c.arc(0, 0, 156, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "rgba(179,223,217,.23)";
    c.lineWidth = 1.5;
    for (const r of [52, 104, 156]) {
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(-156, 0);
    c.lineTo(156, 0);
    c.moveTo(0, -156);
    c.lineTo(0, 156);
    c.stroke();
    c.strokeStyle = "rgba(166,224,204,.4)";
    const sweep = g.time * 0.6;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.sin(sweep) * 156, Math.cos(sweep) * 156);
    c.stroke();
    const draw = (
      x: number,
      z: number,
      color: string,
      size: number,
      selected = false,
    ) => {
      const dx = x - g.player.pos.x,
        dz = z - g.player.pos.z;
      const side = -dx * Math.cos(g.player.yaw) + dz * Math.sin(g.player.yaw),
        forward = dx * Math.sin(g.player.yaw) + dz * Math.cos(g.player.yaw);
      const dist = Math.hypot(side, forward),
        scale = Math.min(0.03, 147 / Math.max(dist, 1));
      const px = side * scale,
        py = -forward * scale;
      c.fillStyle = color;
      c.fillRect(px - size / 2, py - size / 2, size, size);
      if (selected) {
        c.strokeStyle = color;
        c.strokeRect(px - 9, py - 9, 18, 18);
      }
    };
    for (const e of g.alive())
      draw(
        e.pos.x,
        e.pos.z,
        e.kind === "drone"
          ? "#ebd492"
          : e.kind === "scout"
            ? "#ffd28e"
            : "#ff826a",
        e.kind === "scout" ? 8 : 6,
        e.id === g.targetId,
      );
    for (const w of g.wingmen) draw(w.x, w.z, "#9cdacd", 5);
    draw(0, g.time * 17, "#b7dbe1", 8);
    c.fillStyle = "#e8f4d8";
    c.beginPath();
    c.moveTo(0, -10);
    c.lineTo(7, 9);
    c.lineTo(0, 5);
    c.lineTo(-7, 9);
    c.closePath();
    c.fill();
    c.restore();
  }
}

import type { Game, GameEvent } from "./core";

export class AudioSystem {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  engine: OscillatorNode | null = null;
  engineGain: GainNode | null = null;
  filter: BiquadFilterNode | null = null;
  enabled = true;
  voice = true;
  private beat = 0;
  private nextBeat = 0;
  private lastGun = 0;
  private noise: AudioBuffer | null = null;
  init() {
    if (this.context) {
      void this.context.resume();
      return;
    }
    const ctx = new AudioContext();
    this.context = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(ctx.destination);
    this.engine = ctx.createOscillator();
    this.engine.type = "sawtooth";
    this.engine.frequency.value = 45;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0.025;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 150;
    this.engine.connect(this.filter);
    this.filter.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.engine.start();
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.master && this.context)
      this.master.gain.setTargetAtTime(
        this.enabled ? 0.55 : 0,
        this.context.currentTime,
        0.05,
      );
    if (!this.enabled && "speechSynthesis" in window) speechSynthesis.cancel();
    return this.enabled;
  }
  pause(paused: boolean) {
    if (this.context) {
      if (paused) void this.context.suspend();
      else void this.context.resume();
    }
    if ("speechSynthesis" in window) {
      if (paused) speechSynthesis.cancel();
    }
  }
  reset() {
    this.beat = 0;
    this.nextBeat = 0;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
  private tone(
    freq: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
    end?: number,
  ) {
    const ctx = this.context;
    if (!ctx || !this.master || !this.enabled) return;
    const o = ctx.createOscillator(),
      g = ctx.createGain(),
      now = ctx.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    if (end) o.frequency.exponentialRampToValueAtTime(end, now + duration);
    g.gain.setValueAtTime(volume, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.connect(g);
    g.connect(this.master);
    o.start();
    o.stop(now + duration + 0.01);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  private hiss(duration: number, volume: number, frequency: number) {
    const ctx = this.context;
    if (!ctx || !this.master || !this.noise || !this.enabled) return;
    const s = ctx.createBufferSource(),
      f = ctx.createBiquadFilter(),
      g = ctx.createGain();
    s.buffer = this.noise;
    s.loop = true;
    f.type = "lowpass";
    f.frequency.value = frequency;
    g.gain.setValueAtTime(volume, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    s.connect(f);
    f.connect(g);
    g.connect(this.master);
    s.start();
    s.stop(ctx.currentTime + duration);
    s.onended = () => {
      s.disconnect();
      g.disconnect();
      f.disconnect();
    };
  }
  event(event: GameEvent) {
    if (!this.enabled) return;
    switch (event.type) {
      case "gun":
        if (event.time - this.lastGun > 0.08) {
          this.hiss(0.065, 0.14, 2000);
          this.lastGun = event.time;
        }
        break;
      case "hit":
        this.tone(550, 0.055, 0.08, "triangle", 220);
        break;
      case "missile":
        this.hiss(0.6, 0.16, 1100);
        this.tone(180, 0.32, 0.065, "sawtooth", 650);
        break;
      case "lock":
        this.tone(880, 0.18, 0.08);
        break;
      case "incoming":
        this.tone(430, 0.22, 0.06, "square", 650);
        break;
      case "kill":
        this.hiss(1, 0.25, 500);
        this.tone(80, 0.4, 0.1, "sine", 25);
        break;
      case "damage":
        this.hiss(0.3, 0.2, 750);
        break;
      case "flare":
        this.hiss(0.6, 0.1, 6000);
        break;
      case "score":
        this.tone(660, 0.08, 0.035, "triangle", 990);
        break;
      case "radio":
        this.tone(1250, 0.05, 0.025);
        if (this.voice && "speechSynthesis" in window) {
          speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(event.text);
          utterance.lang = "en-US";
          utterance.rate = 1.12;
          utterance.pitch = 0.84;
          utterance.volume = 0.65;
          speechSynthesis.speak(utterance);
        }
        break;
      case "phase":
        if (event.text === "warning" || event.text === "ace") {
          this.tone(165, 1.2, 0.15, "sawtooth", 82);
        }
        break;
    }
  }
  update(game: Game) {
    if (!this.context || !this.enabled || game.paused) return;
    const now = this.context.currentTime;
    this.engine?.frequency.setTargetAtTime(
      36 + game.player.speed * 0.2,
      now,
      0.2,
    );
    this.filter?.frequency.setTargetAtTime(
      100 + game.player.speed * 1.5,
      now,
      0.2,
    );
    if (game.phase === "clear" || game.phase === "failed") {
      this.engineGain?.gain.setTargetAtTime(0.012, now, 0.3);
      return;
    }
    this.engineGain?.gain.setTargetAtTime(0.027, now, 0.1);
    const combat = [
      "warning",
      "scouts",
      "dogfight",
      "chase",
      "ace",
      "final",
    ].includes(game.phase);
    const interval = combat ? 0.25 : 0.5;
    if (game.time >= this.nextBeat) {
      this.nextBeat = game.time + interval;
      const bass = [55, 55, 65.4, 55, 73.4, 65.4, 49, 49][
        Math.floor(this.beat / 4) % 8
      ];
      if (this.beat % 2 === 0)
        this.tone(bass, 0.26, combat ? 0.08 : 0.035, "triangle");
      if (combat) {
        if (this.beat % 4 === 0) this.tone(100, 0.15, 0.14, "sine", 28);
        if (this.beat % 4 === 2) this.hiss(0.12, 0.055, 1700);
        this.hiss(0.035, 0.024, 7000);
        if (this.beat % 2 === 1)
          this.tone(
            [220, 261.6, 293.7, 329.6][Math.floor(this.beat / 2) % 4],
            0.2,
            0.017,
            "triangle",
          );
      }
      this.beat++;
    }
  }
}

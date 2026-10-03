// Paste into the browser console, launch, then call __stepFlight(600) repeatedly.
// Drives normal keyboard handlers and fixed-step simulation. Does not edit game state.
(() => {
  const dispatch = (code, type) =>
    window.dispatchEvent(
      new KeyboardEvent(type, { code, key: code, bubbles: true }),
    );
  let clock = performance.now();
  let pendingFrame = null;
  window.requestAnimationFrame = (callback) => {
    pendingFrame = callback;
    return 0;
  };
  const held = new Set();
  const report = { phases: [], finished: false, state: null, errors: [] };
  window.__integration = report;
  let lastPhase = "",
    gate = -1,
    gateAt = 0;
  const tick = () => {
    const state = window.joker.snapshot();
    if (state.phase !== lastPhase) {
      lastPhase = state.phase;
      report.phases.push({
        phase: state.phase,
        time: state.time,
        hp: state.player.hp,
      });
    }
    if (state.phase === "clear" || state.phase === "failed") {
      for (const code of held) dispatch(code, "keyup");
      held.clear();

      report.finished = true;
      report.state = state;
      report.errors = window.joker.errors();
      return;
    }
    if (state.paused || state.phase === "standby") return;
    const desired = new Set(["KeyX"]);
    if (state.phase === "tutorial") {
      if (gate !== state.tutorialIndex) {
        gate = state.tutorialIndex;
        gateAt = state.time;
      }
      if (state.time - gateAt < 0.45) {
        desired.delete("KeyX");
        desired.add(["KeyW", "KeyA", "ShiftLeft", "KeyC", "KeyQ"][gate]);
      }
      if (gate === 2) desired.add("ShiftLeft");
      if (gate === 3) desired.add("KeyC");
    }
    const target = state.enemies.find((e) => e.id === state.target);
    if (target) {
      const distance = Math.hypot(
        ...target.pos.map((v, i) => v - state.player.pos[i]),
      );
      if (distance < 1800) desired.add("Space");
      if (
        (state.phase === "final" ||
          state.phase === "chase" ||
          distance > 2100) &&
        state.player.boost > 8
      )
        desired.add("ShiftLeft");
      if (distance < 340) desired.add("KeyC");
      if (state.lock >= 1) {
        dispatch("KeyE", "keydown");
        dispatch("KeyE", "keyup");
      }
    }
    if (!document.getElementById("incoming").classList.contains("hidden")) {
      dispatch("KeyF", "keydown");
      dispatch("KeyF", "keyup");
      dispatch("KeyQ", "keydown");
      dispatch("KeyQ", "keyup");
    }
    for (const code of held)
      if (!desired.has(code)) {
        dispatch(code, "keyup");
        held.delete(code);
      }
    for (const code of desired)
      if (!held.has(code)) {
        dispatch(code, "keydown");
        held.add(code);
      }
  };
  window.__stepFlight = (frames = 600) => {
    if (!pendingFrame) return { waiting: true };
    for (let i = 0; i < frames; i++) {
      tick();
      const callback = pendingFrame;
      pendingFrame = null;
      clock = Math.max(clock + 100, performance.now());
      callback(clock);
      const state = window.joker.snapshot();
      if (
        (state.phase === "clear" && state.phaseTime >= 22) ||
        state.phase === "failed"
      )
        break;
    }
    return {
      report,
      state: window.joker.snapshot(),
      errors: window.joker.errors(),
    };
  };
  return "Keyboard integration pilot installed; __stepFlight(600) drives captured render callbacks.";
})();

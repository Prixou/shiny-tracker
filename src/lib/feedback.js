// Retours tactiles et sonores (réglages « Vibrations » et « Sons »).
let audioCtx = null;
export const feedback = {
  enabledHaptics: true,
  enabledSound: false,
  /** @param {number | number[]} [pattern] Durée(s) en ms. */
  vibrate(pattern = 12) {
    if (this.enabledHaptics && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch { /* ignoré */ }
    }
  },
  /**
   * @param {number} [freq]
   * @param {number} [duration] En secondes.
   * @param {boolean} [force] Même si le réglage « Sons » est coupé.
   */
  beep(freq = 880, duration = 0.05, force = false) {
    if (!this.enabledSound && !force) return;
    try {
      audioCtx ||= new (window.AudioContext || /** @type {any} */ (window).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch { /* ignoré */ }
  },
  tap() { this.vibrate(10); this.beep(880, 0.04); },
  undo() { this.vibrate([6, 40, 6]); this.beep(440, 0.05); },
  success() { this.vibrate([30, 60, 30, 60, 120]); this.beep(1320, 0.25); },
  /** Confirmation dans les écouteurs (compteur à distance), toujours audible : l'écran est éteint. */
  remote(up = true) { this.vibrate(up ? 10 : [6, 40, 6]); this.beep(up ? 1046 : 392, up ? 0.06 : 0.12, true); }
};

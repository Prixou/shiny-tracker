// Retours tactiles et sonores (réglages « Vibrations » et « Sons »).
let audioCtx = null;
export const feedback = {
  enabledHaptics: true,
  enabledSound: false,
  vibrate(pattern = 12) {
    if (this.enabledHaptics && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch { /* ignoré */ }
    }
  },
  beep(freq = 880, duration = 0.05) {
    if (!this.enabledSound) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
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
  success() { this.vibrate([30, 60, 30, 60, 120]); this.beep(1320, 0.25); }
};

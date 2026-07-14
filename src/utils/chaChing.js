export function playChaChing() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [
      [1046.5, 0, 0.09],
      [1568, 0.07, 0.14],
      [2093, 0.16, 0.22]
    ];
    notes.forEach(([freq, delay, dur]) => {
      const start = now + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
    setTimeout(() => {
      try {
        ctx.close();
      } catch (e) {}
    }, 700);
  } catch (err) {
    /* audio unavailable */
  }
}

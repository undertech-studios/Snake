// ─────────────────────────────────────────────────────────────────────────────
// sound.js  —  Snake Zen · Sistema de Audio
// ─────────────────────────────────────────────────────────────────────────────

// ── Música de fondo ──────────────────────────────────────────────────────────
const ControlAudio = (() => {
  const audio = new Audio('Music.mp3');
  audio.loop   = true;
  audio.volume = 0.20;

  let started = false;

  function play() {
    if (started) return;
    audio.play().catch(() => {
      // Autoplay bloqueado por el navegador — se reintentará en la
      // siguiente interacción del usuario.
    });
    started = true;
  }

  // Arranca la música en la primera pulsación de tecla del usuario
  // (necesario por las políticas de autoplay de los navegadores modernos).
  document.addEventListener('keydown', function _startOnce() {
    play();
    document.removeEventListener('keydown', _startOnce);
  });

  return { play };
})();


// ── Sonido de muerte — tono grave descendente ─────────────────────────────────
function sonidoMuerte() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.65);

    gain.gain.setValueAtTime(0.50, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.70);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.70);
    osc.onended = () => ctx.close();
  } catch (e) {
    console.warn('sonidoMuerte: Web Audio API no disponible.', e);
  }
}


// ── Sonido al comer — pop agudo ───────────────────────────────────────────────
function sonidoComer() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.11);
    osc.onended = () => ctx.close();
  } catch (e) { /* silencio */ }
}
// Web Audio API Sound Synthesizer for RPG Dice
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a realistic dice roll tumbling sound effect using synthesized noise and impacts
 */
export function playDiceRollSound(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create 3 to 5 rapid small wooden/plastic dice click impacts
    const clickCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < clickCount; i++) {
      const timeOffset = i * (0.05 + Math.random() * 0.04);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // High wooden/die resonant pitch
      osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 600, now + timeOffset);
      osc.frequency.exponentialRampToValueAtTime(80 + Math.random() * 50, now + timeOffset + 0.04);

      gain.gain.setValueAtTime(0.15, now + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.05);
    }
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Plays a fanfare / critical hit chime (e.g., Natural 20 or max roll)
 */
export function playCriticalSound(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  } catch (e) {
    console.warn('Audio critical play error:', e);
  }
}

/**
 * Plays a mysterious inversion pulse sound when the secret d6 rolls a 6
 */
export function playInversionSound(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {
    console.warn('Audio inversion error:', e);
  }
}

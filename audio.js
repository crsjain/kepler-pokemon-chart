import { state, getStageInfo } from './state.js';

let audioCtx = null;

export function playSound(type) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    const volumeMultiplier = 0.5; // Fixed comfortable volume

    if (type === 'check') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.05 * volumeMultiplier, now);
      gain.gain.exponentialRampToValueAtTime(0.01 * volumeMultiplier, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'uncheck') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12); // A2
      gain.gain.setValueAtTime(0.05 * volumeMultiplier, now);
      gain.gain.exponentialRampToValueAtTime(0.01 * volumeMultiplier, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'levelUp') {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      osc.type = 'triangle';
      notes.forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      });
      gain.gain.setValueAtTime(0.1 * volumeMultiplier, now);
      gain.gain.exponentialRampToValueAtTime(0.01 * volumeMultiplier, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'badge') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.08 * volumeMultiplier, now);
      gain.gain.exponentialRampToValueAtTime(0.01 * volumeMultiplier, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn('Audio playback failed or blocked:', e);
  }
}



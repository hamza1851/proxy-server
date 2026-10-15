import { useRef, useCallback } from 'react';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export interface AudioControls {
  playBeep: (freq?: number, duration?: number, type?: OscillatorType) => void;
  playAlarm: () => void;
}

export function useAudio(enabled = true): AudioControls {
  const ctxRef = useRef<AudioContext | null>(null);

  const initCtx = useCallback(() => {
    if (!ctxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctxRef.current = new AudioCtx();
      }
    }
  }, []);

  const playBeep = useCallback(
    (freq = 800, duration = 0.06, type: OscillatorType = 'sine') => {
      if (!enabled) return;
      initCtx();
      if (!ctxRef.current) return;
      try {
        const ctx = ctxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio playback suppressed safely
      }
    },
    [enabled, initCtx]
  );

  const playAlarm = useCallback(() => {
    if (!enabled) return;
    initCtx();
    if (!ctxRef.current) return;
    try {
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Alarm audio suppressed safely
    }
  }, [enabled, initCtx]);

  return { playBeep, playAlarm };
}

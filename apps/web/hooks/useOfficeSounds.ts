'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useOfficeSounds() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(false);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) => {
    if (!enabledRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, [getCtx]);

  const sounds = {
    taskAssigned: () => {
      playTone(523, 0.15, 'sine', 0.06);
      setTimeout(() => playTone(659, 0.15, 'sine', 0.06), 120);
    },
    taskCompleted: () => {
      playTone(523, 0.1, 'sine', 0.07);
      setTimeout(() => playTone(659, 0.1, 'sine', 0.07), 100);
      setTimeout(() => playTone(784, 0.2, 'sine', 0.07), 200);
    },
    taskFailed: () => {
      playTone(300, 0.2, 'sawtooth', 0.05);
      setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.05), 180);
    },
    approvalRequested: () => {
      playTone(880, 0.1, 'sine', 0.08);
      setTimeout(() => playTone(880, 0.1, 'sine', 0.08), 200);
      setTimeout(() => playTone(1046, 0.2, 'sine', 0.08), 400);
    },
    workflowStarted: () => {
      [523, 587, 659, 784].forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.15, 'sine', 0.06), i * 100);
      });
    },
    workflowCompleted: () => {
      [523, 659, 784, 1046].forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, 'sine', 0.08), i * 120);
      });
    },
  };

  const enable = useCallback(() => {
    enabledRef.current = true;
    getCtx().resume();
  }, [getCtx]);

  const disable = useCallback(() => {
    enabledRef.current = false;
  }, []);

  const isEnabled = () => enabledRef.current;

  return { sounds, enable, disable, isEnabled };
}

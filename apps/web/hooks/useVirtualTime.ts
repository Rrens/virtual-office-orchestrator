import { useState, useEffect } from 'react';

export interface VirtualTime {
  hours: number;
  minutes: number;
  formatted: string;
  phase: 'dawn' | 'day' | 'dusk' | 'night' | 'midnight';
  skyColor: string;
  sunPosition: [number, number, number];
  ambientIntensity: number;
  officeLightsOn: boolean;
}

const CYCLE_DURATION_MS = 10 * 60 * 1000;
const VIRTUAL_DAY_MINUTES = 24 * 60;

function calculateVirtualTime(elapsed: number): VirtualTime {
  const cycleProgress = (elapsed % CYCLE_DURATION_MS) / CYCLE_DURATION_MS;
  const virtualMinutes = Math.floor(cycleProgress * VIRTUAL_DAY_MINUTES);
  const hours = Math.floor(virtualMinutes / 60);
  const minutes = virtualMinutes % 60;
  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  let phase: VirtualTime['phase'] = 'day';
  let skyColor = '#87ceeb';
  let sunPosition: [number, number, number] = [100, 70, 70];
  let ambientIntensity = 0.8;
  let officeLightsOn = false;

  if (hours >= 5 && hours < 7) {
    phase = 'dawn';
    skyColor = '#ff9a8b';
    sunPosition = [120, 20, 100];
    ambientIntensity = 0.5;
    officeLightsOn = true;
  } else if (hours >= 7 && hours < 17) {
    phase = 'day';
    skyColor = '#87ceeb';
    sunPosition = [100, 70, 70];
    ambientIntensity = 0.8;
    officeLightsOn = false;
  } else if (hours >= 17 && hours < 19) {
    phase = 'dusk';
    skyColor = '#ff6b6b';
    sunPosition = [120, 15, -100];
    ambientIntensity = 0.55;
    officeLightsOn = true;
  } else if (hours >= 19 && hours < 23) {
    phase = 'night';
    skyColor = '#2d4a7a';
    sunPosition = [-50, 10, -80];
    ambientIntensity = 0.45;
    officeLightsOn = true;
  } else {
    phase = 'midnight';
    skyColor = '#1a2f55';
    sunPosition = [-50, 5, -80];
    ambientIntensity = 0.38;
    officeLightsOn = true;
  }

  return { hours, minutes, formatted, phase, skyColor, sunPosition, ambientIntensity, officeLightsOn };
}

export function useVirtualTime(): VirtualTime {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return calculateVirtualTime(elapsed);
}

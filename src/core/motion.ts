import type { UiState, UiViewport } from './contracts';

export type MotionMode = 'STILL' | 'MICRO' | 'ACTIVE' | 'ALERT';
export interface UiMotionFrame { readonly mode: MotionMode; readonly phase: number; readonly intensity: number; readonly reducedMotionSafe: boolean; }

export function motionFrame(state: UiState, tick: number, viewport: UiViewport, reducedMotion = false): UiMotionFrame {
  const mode: MotionMode = reducedMotion ? 'STILL' : state === 'ERROR' ? 'ALERT' : state === 'ACTIVE' ? 'ACTIVE' : 'MICRO';
  const phase = reducedMotion ? 0 : Math.abs(Math.trunc(tick)) % Math.max(1, viewport.density === 'OPERATOR' ? 16 : 8);
  const intensity = mode === 'ALERT' ? 1 : mode === 'ACTIVE' ? 0.75 : mode === 'MICRO' ? 0.25 : 0;
  return Object.freeze({ mode, phase, intensity, reducedMotionSafe: true });
}

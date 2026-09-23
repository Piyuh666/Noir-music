import type { UiState } from './contracts';

export type UiEvent = 'ACTIVATE' | 'PAUSE' | 'RESUME' | 'BUSY' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'RECOVER' | 'STALE' | 'RESET' | 'LOCK';

const transitions: Readonly<Record<UiState, Partial<Record<UiEvent, UiState>>>> = {
  IDLE: { ACTIVATE: 'ACTIVE', BUSY: 'BUSY', LOCK: 'LOCKED' },
  READY: { ACTIVATE: 'ACTIVE', BUSY: 'BUSY', LOCK: 'LOCKED' },
  ACTIVE: { PAUSE: 'READY', BUSY: 'BUSY', WARNING: 'WARNING', ERROR: 'ERROR', STALE: 'STALE', LOCK: 'LOCKED' },
  BUSY: { SUCCESS: 'READY', WARNING: 'WARNING', ERROR: 'ERROR', RECOVER: 'READY', STALE: 'STALE' },
  SUCCESS: { ACTIVATE: 'ACTIVE', RESET: 'READY', ERROR: 'ERROR' },
  WARNING: { RECOVER: 'READY', ACTIVATE: 'ACTIVE', ERROR: 'ERROR', STALE: 'STALE' },
  ERROR: { RECOVER: 'READY', RESET: 'IDLE', LOCK: 'LOCKED' },
  STALE: { RECOVER: 'READY', RESET: 'IDLE', ERROR: 'ERROR' },
  EMPTY: { ACTIVATE: 'ACTIVE', RESET: 'IDLE' },
  LOCKED: { RESET: 'IDLE', RECOVER: 'READY' },
};

export function canTransition(from: UiState, event: UiEvent): boolean { return Boolean(transitions[from]?.[event]); }
export function transition(from: UiState, event: UiEvent): UiState { return transitions[from]?.[event] ?? from; }

export interface UiStateSnapshot { readonly current: UiState; readonly previous: UiState; readonly event: UiEvent | null; readonly sequence: number; readonly changed: boolean; }

export function evolveState(previous: UiStateSnapshot, event: UiEvent): UiStateSnapshot {
  const next = transition(previous.current, event);
  return Object.freeze({ current: next, previous: previous.current, event, sequence: previous.sequence + 1, changed: next !== previous.current });
}

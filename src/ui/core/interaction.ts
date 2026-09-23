import type { UiAction, UiState } from './contracts';

export interface UiInteractionContext { readonly state: UiState; readonly version: number; readonly actorId: string; readonly issuedAt: number; }
export interface UiInteractionGuard { readonly accepted: boolean; readonly reason?: string; }

export function guardInteraction(action: UiAction, context: UiInteractionContext, expectedVersion: number): UiInteractionGuard {
  if (!action.enabled) return Object.freeze({ accepted: false, reason: action.reason ?? 'ACTION DISABLED' });
  if (context.version !== expectedVersion) return Object.freeze({ accepted: false, reason: 'STALE INTERACTION' });
  if (context.state === 'LOCKED') return Object.freeze({ accepted: false, reason: 'UI LOCKED' });
  return Object.freeze({ accepted: true });
}

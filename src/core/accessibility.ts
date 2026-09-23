import type { UiAction, UiCoreInput, UiViewport } from './contracts';
import { frame } from './glyph';

export interface UiA11yNode { readonly id: string; readonly label: string; readonly role: 'BUTTON' | 'STATUS' | 'PROGRESS' | 'NAVIGATION'; readonly focusable: boolean; readonly disabled: boolean; }
export interface UiAccessibilityResult { readonly nodes: readonly UiA11yNode[]; readonly focusable: number; readonly lines: readonly string[]; }

export function accessibilitySurface(input: UiCoreInput, viewport: UiViewport): UiAccessibilityResult {
  const nodes: UiA11yNode[] = [
    { id: 'player-status', label: `Playback ${input.player.title}`, role: 'STATUS', focusable: false, disabled: false },
    { id: 'progress', label: `Playback progress ${Math.round(input.player.durationMs ? input.player.positionMs / input.player.durationMs * 100 : 0)} percent`, role: 'PROGRESS', focusable: false, disabled: false },
    ...input.actions.map((action: UiAction) => ({ id: action.id, label: action.label, role: 'BUTTON' as const, focusable: true, disabled: !action.enabled })),
  ];
  const focusable = nodes.filter((node) => node.focusable && !node.disabled).length;
  const lines = frame('ACCESSIBILITY MATRIX', [`NODES ${nodes.length} · FOCUSABLE ${focusable}`, `PLAYER ${input.player.state} · ACTIONS ${input.actions.length}`, 'SCREEN READER STATE · LIVE', `FOCUS ORDER ${nodes.filter((node) => node.focusable).map((node) => node.id).join(' → ')}`], viewport.width, 'OPERATOR');
  return Object.freeze({ nodes: Object.freeze(nodes), focusable, lines: Object.freeze(lines) });
}

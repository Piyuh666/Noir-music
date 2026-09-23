import type { UiViewport } from './contracts';
import { frame, stateGlyph } from './glyph';
import { fitText } from './responsive';

export type UiRoute = 'PLAYER' | 'QUEUE' | 'COMMANDS' | 'EFFECTS' | 'TELEMETRY' | 'SETTINGS' | 'HELP';
export interface UiNavItem { readonly route: UiRoute; readonly label: string; readonly enabled: boolean; readonly active: boolean; readonly badge?: string; }
export interface UiNavigation { readonly lines: readonly string[]; readonly active: UiRoute; readonly available: number; }

export function navigationSurface(items: readonly UiNavItem[], active: UiRoute, viewport: UiViewport): UiNavigation {
  const usable = items.filter((item) => item.enabled);
  const rows = usable.map((item) => `${item.active ? stateGlyph('ACTIVE') : stateGlyph('IDLE')} ${fitText(item.label, Math.max(8, viewport.width - 20))}${item.badge ? ` · ${item.badge}` : ''}`);
  return Object.freeze({ lines: frame(`NAVIGATION · ${active}`, rows.length ? rows : ['NO ROUTES AVAILABLE'], viewport.width, 'DENSE'), active, available: usable.length });
}

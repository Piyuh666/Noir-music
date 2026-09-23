import type { UiDensity, UiViewport } from './contracts';

export interface UiLayoutBlock { readonly id: string; readonly minWidth: number; readonly preferredRows: number; readonly priority: number; readonly collapsible: boolean; }
export interface UiLayoutPlan { readonly columns: number; readonly rows: number; readonly blocks: readonly string[]; readonly deferred: readonly string[]; readonly density: UiDensity; }

const weights: Record<UiDensity, number> = { MINI: 1, COMPACT: 2, STANDARD: 3, DENSE: 4, OPERATOR: 5 };

export function planLayout(viewport: UiViewport, blocks: readonly UiLayoutBlock[]): UiLayoutPlan {
  const sorted = [...blocks].sort((a, b) => b.priority - a.priority);
  let rows = 0; const selected: string[] = []; const deferred: string[] = [];
  for (const block of sorted) {
    const affordable = rows + block.preferredRows <= viewport.maxRows;
    if (affordable || selected.length === 0) { selected.push(block.id); rows += block.preferredRows; }
    else if (block.collapsible && weights[viewport.density] >= 3 && rows + Math.max(1, Math.ceil(block.preferredRows / 2)) <= viewport.maxRows) { selected.push(block.id); rows += Math.max(1, Math.ceil(block.preferredRows / 2)); }
    else deferred.push(block.id);
  }
  return Object.freeze({ columns: viewport.columns, rows, blocks: Object.freeze(selected), deferred: Object.freeze(deferred), density: viewport.density });
}

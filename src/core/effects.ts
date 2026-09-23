import type { UiViewport, UiCoreSurface } from "./contracts";
import { bar, frame } from "./glyph";

export interface UiEffect { readonly id: string; readonly label: string; readonly enabled: boolean; readonly value?: number; }
export function effectsSurface(effects: readonly UiEffect[], viewport: UiViewport): UiCoreSurface {
  const shown = effects.slice(0, 16);
  const rows = shown.length ? shown.map((effect) => `${effect.enabled ? "◆" : "◇"} ${effect.label.padEnd(18, " ")} ${effect.value === undefined ? "OFF" : `${Math.round(Math.max(0, Math.min(100, effect.value)))}% ${bar(Math.max(0, Math.min(100, effect.value)) / 100, Math.max(6, viewport.width - 30))}`}`) : ["NO EFFECTS REGISTERED"];
  rows.push(`ACTIVE ${shown.filter((x) => x.enabled).length}/${shown.length}`);
  return Object.freeze({ surface: "EFFECTS", lines: frame("EFFECT MATRIX", rows, viewport.width, "SIGNAL"), rows: rows.length + 4, priority: 50 });
}

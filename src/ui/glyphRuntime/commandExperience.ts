/** NOIR MUSIC // GLYPH-V48.6 COMMAND EXPERIENCE — visual command comprehension surfaces. */
import { uiText } from "../surface";
import { pixelMeter } from "../pixel";
import { glyphPanelAdvanced } from "../layout";
export interface CommandExperienceSpec { name: string; category: string; description: string; example?: string; aliases?: readonly string[]; state?: "READY" | "BUSY" | "LOCKED" | "ERROR"; usage?: number; width?: number; }
const stateGlyph = { READY: "●", BUSY: "◐", LOCKED: "▣", ERROR: "×" } as const;
const clean = (s: string, n: number) => s.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
export function commandHero(spec: CommandExperienceSpec): string {
  const w = Math.max(28, Math.min(72, Math.trunc(spec.width ?? 56)));
  const state = spec.state ?? "READY";
  const lines = [ `${stateGlyph[state]} /${clean(spec.name, 30)}`, `CATEGORY ${clean(spec.category, 24)}`, clean(spec.description, w - 4) ];
  if (spec.example) lines.push(`$ ${clean(spec.example, w - 6)}`);
  if (spec.aliases?.length) lines.push(`ALIASES ${spec.aliases.slice(0, 6).map((a) => `/${clean(a, 18)}`).join("  ")}`);
  return glyphPanelAdvanced(lines, { width: w, title: "COMMAND EXPERIENCE", tone: state === "ERROR" ? "OPERATOR" : "OPERATOR", maxLines: 8 });
}
export function commandTelemetry(spec: CommandExperienceSpec): string {
  const w = Math.max(28, Math.min(72, Math.trunc(spec.width ?? 56)));
  const usage = Math.max(0, Math.min(100, Math.trunc(spec.usage ?? 0)));
  return `${stateGlyph[spec.state ?? "READY"]} ${clean(spec.name, 24)}  ${pixelMeter(usage, Math.max(8, w - 30))} ${usage}%`;
}
export function commandFooter(spec: CommandExperienceSpec): string { return uiText(`◆ /${spec.name}  ·  ${spec.category}  ·  GLYPH-V48.6`, "").slice(0, Math.max(28, Math.min(72, Math.trunc(spec.width ?? 56)))); }

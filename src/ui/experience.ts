/**
 * NOIR MUSIC // GLYPH-19 EXPERIENCE ORCHESTRATOR
 * Presentation-only orchestration for dense Discord surfaces.
 * No command, audio, database, or provider behavior lives here.
 */
import { normalizeGlyphText, pixelMeter, pixelSpark, matrix, pixelBadge } from "./pixel";
import { kernelFrame, type KernelTone } from "./visualKernel";
import { compactNumber, divider, fitButtonLabel, fitFieldName, fitFieldValue, uiText } from "./surface";


export type ExperienceDensity = "MINI" | "COMPACT" | "STANDARD" | "DENSE" | "OPERATOR";
export type ExperiencePhase = "IDLE" | "LOADING" | "READY" | "BUSY" | "SUCCESS" | "WARNING" | "ERROR" | "STALE" | "EMPTY" | "LOCKED";
export type ExperienceTone = "VOID" | "PANEL" | "DENSE" | "OPERATOR" | "ALERT";

/** Canonical compatibility aliases; no generation suffixes. */
export type ExperienceState = ExperiencePhase;
export interface ExperienceTrack { title: string; artist?: string; source?: string; positionMs?: number; durationMs?: number; state?: import("./visualGlyphs").VisualState; }

export interface ExperienceAction {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  destructive?: boolean;
  shortcut?: string;
}

export interface ExperienceMetric {
  label: string;
  value: string | number;
  hint?: string;
  ratio?: number;
  phase?: ExperiencePhase;
}

export interface ExperienceSection {
  title: string;
  lines: readonly string[];
  tone?: ExperienceTone;
}

export interface ExperienceScreen {
  title: string;
  eyebrow?: string;
  phase: ExperiencePhase;
  density?: ExperienceDensity;
  tone?: ExperienceTone;
  sections: readonly ExperienceSection[];
  metrics?: readonly ExperienceMetric[];
  actions?: readonly ExperienceAction[];
  footer?: string;
}

const GLYPHS: Record<ExperiencePhase, string> = {
  IDLE: "◇",
  LOADING: "◐",
  READY: "●",
  BUSY: "◑",
  SUCCESS: "◆",
  WARNING: "△",
  ERROR: "×",
  STALE: "◇",
  EMPTY: "○",
  LOCKED: "▣",
};

const TONE_GLYPH: Record<ExperienceTone, KernelTone> = {
  VOID: "VOID",
  PANEL: "PANEL",
  DENSE: "DENSE",
  OPERATOR: "OPERATOR",
  ALERT: "ALERT",
};

const DENSITY: Record<ExperienceDensity, { width: number; lines: number; columns: number; actions: number }> = {
  MINI: { width: 28, lines: 5, columns: 1, actions: 2 },
  COMPACT: { width: 40, lines: 7, columns: 1, actions: 3 },
  STANDARD: { width: 56, lines: 10, columns: 2, actions: 5 },
  DENSE: { width: 64, lines: 14, columns: 2, actions: 7 },
  OPERATOR: { width: 72, lines: 18, columns: 3, actions: 10 },
};

function clean(value: unknown, fallback: string, max = 120): string {
  return uiText(typeof value === "string" ? value : String(value ?? ""), fallback, max);
}

function phaseGlyph(phase: ExperiencePhase): string { return GLYPHS[phase]; }

export function experienceHeader(title: string, phase: ExperiencePhase, density: ExperienceDensity = "STANDARD", eyebrow = "NOIR MUSIC") {
  const d = DENSITY[density];
  const label = clean(title, "SURFACE", d.width);
  const top = `${phaseGlyph(phase)} ${clean(eyebrow, "NOIR MUSIC", 28)} // ${label.toUpperCase()}`;
  return kernelFrame([top], { width: d.width, tone: TONE_GLYPH["PANEL"], weight: "HEAVY" });
}

export function experiencePhaseLine(phase: ExperiencePhase, message?: string, width = 56): string {
  const text = clean(message, phase, width - 12).toUpperCase();
  return `${phaseGlyph(phase)} ${text}`.padEnd(Math.min(width, 72), " ");
}

export function experienceActionLine(action: ExperienceAction, width = 56): string {
  const prefix = action.disabled ? "○" : action.destructive ? "×" : "◆";
  const shortcut = action.shortcut ? ` [${clean(action.shortcut, "", 12)}]` : "";
  const label = uiText(action.label, "BUTTON", Math.max(8, width - shortcut.length - 5));
  const hint = action.hint ? ` // ${clean(action.hint, "", 40)}` : "";
  return uiText(`${prefix} ${label}${shortcut}${hint}`, "○ ACTION", width);
}

export function experienceActions(actions: readonly ExperienceAction[], density: ExperienceDensity = "STANDARD"): string {
  const d = DENSITY[density];
  const visible = actions.slice(0, d.actions);
  const lines = visible.map((action) => experienceActionLine(action, d.width));
  if (actions.length > visible.length) lines.push(`+${actions.length - visible.length} MORE ACTIONS`);
  return kernelFrame(lines, { width: d.width, tone: TONE_GLYPH["PANEL"], weight: "REGULAR" });
}

export function experienceMetrics(metrics: readonly ExperienceMetric[], density: ExperienceDensity = "STANDARD"): string {
  const d = DENSITY[density];
  const rows = metrics.slice(0, d.lines).map((metric) => {
    const label = uiText(metric.label, "—", Math.floor(d.width * 0.38));
    const value = uiText(String(metric.value), "—", Math.floor(d.width * 0.28));
    const suffix = metric.hint ? ` // ${clean(metric.hint, "", 24)}` : "";
    const meter = metric.ratio === undefined ? "" : ` ${pixelMeter(metric.ratio * 100, 8)}`;
    return `${label.padEnd(Math.floor(d.width * 0.38), " ")} ${value.padStart(Math.floor(d.width * 0.28), " ")}${meter}${suffix}`;
  });
  return kernelFrame(rows, { width: d.width, tone: TONE_GLYPH["DENSE"], weight: "REGULAR" });
}

export function experienceSections(sections: readonly ExperienceSection[], density: ExperienceDensity = "STANDARD"): string {
  const d = DENSITY[density];
  const out: string[] = [];
  let remaining = d.lines;
  for (const section of sections) {
    if (remaining <= 0) break;
    out.push(`${phaseGlyph(section.tone === "ALERT" ? "ERROR" : section.tone === "OPERATOR" ? "LOCKED" : "READY")} ${clean(section.title, "SECTION", 48).toUpperCase()}`);
    remaining--;
    for (const line of section.lines) {
      if (remaining <= 0) break;
      out.push(uiText(`  ${normalizeGlyphText(line)}`, "  —", d.width));
      remaining--;
    }
  }
  return out.join("\n");
}

export function experienceSignal(values: readonly number[], width = 56): string {
  const normalized = values.map((value) => Number.isFinite(value) ? value : 0).slice(-width);
  return kernelFrame([pixelSpark(normalized, Math.max(8, Math.min(width - 4, 48)))], { width, tone: "DENSE", weight: "HEAVY" });
}

export function experienceMatrix(seed: number, width = 56, height = 4): string {
  return kernelFrame(matrix(Math.min(width - 4, 68), Math.max(1, Math.min(height, 8)), "·", Math.max(1, Math.floor(seed))).split("\n"), { width, tone: "OPERATOR", weight: "LIGHT" });
}

export function experienceBadge(phase: ExperiencePhase, label?: string): string {
  return pixelBadge(phase, `${phaseGlyph(phase)} ${clean(label, phase, 24)}`);
}

export function experienceFooter(phase: ExperiencePhase, footer?: string, width = 56): string {
  return `${divider(width, "·")}\n${experiencePhaseLine(phase, footer, width)}`;
}

export function composeExperience(screen: ExperienceScreen): string {
  const density = screen.density ?? "STANDARD";
  const d = DENSITY[density];
  const tone = screen.tone ?? "PANEL";
  const blocks: string[] = [experienceHeader(screen.title, screen.phase, density, screen.eyebrow ?? "NOIR MUSIC")];
  blocks.push(experienceBadge(screen.phase, screen.phase));
  if (screen.metrics?.length) blocks.push(experienceMetrics(screen.metrics, density));
  if (screen.sections.length) blocks.push(experienceSections(screen.sections, density));
  if (screen.actions?.length) blocks.push(experienceActions(screen.actions, density));
  if (screen.footer) blocks.push(experienceFooter(screen.phase, screen.footer, d.width));
  const body = blocks.join("\n");
  return kernelFrame(body.split("\n"), { width: d.width, tone: TONE_GLYPH[tone], weight: "BLOCK" });
}

export function accessibilitySummary(screen: ExperienceScreen): string {
  const metrics = screen.metrics?.length ? ` ${screen.metrics.length} metrics.` : "";
  const actions = screen.actions?.length ? ` ${screen.actions.length} actions.` : " No actions.";
  return `${clean(screen.title, "NOIR MUSIC", 80)}. State: ${screen.phase.toLowerCase()}.${metrics}${actions}`;
}

export function experienceTelemetry(screen: ExperienceScreen): Record<string, string | number> {
  return {
    phase: screen.phase,
    density: screen.density ?? "STANDARD",
    sections: screen.sections.length,
    metrics: screen.metrics?.length ?? 0,
    actions: screen.actions?.length ?? 0,
    titleLength: screen.title.length,
    signal: compactNumber(screen.metrics?.length ?? 0),
  };
}

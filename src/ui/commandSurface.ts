/** NOIR MUSIC // GLYPH-CANONICAL COMMAND SURFACES — presentation only. */
import { experienceActions, experienceBadge, experienceHeader, experienceMetrics, experienceSections, type ExperienceAction, type ExperienceDensity, type ExperiencePhase } from "./experience";
import { pixelText, matrix } from "./pixel";
import { kernelFrame } from "./visualKernel";
import { uiText } from "./surface";

export interface CommandSurfaceSpec {
  name: string;
  category: string;
  description: string;
  example?: string;
  aliases?: readonly string[];
  phase?: ExperiencePhase;
  density?: ExperienceDensity;
  commandCount?: number;
  groupCount?: number;
  actions?: readonly ExperienceAction[];
}

export function commandHero(spec: CommandSurfaceSpec): string {
  const phase = spec.phase ?? "READY";
  return `${experienceHeader(spec.name, phase, spec.density ?? "STANDARD", `NOIR MUSIC // ${uiText(spec.category, "COMMAND", 24)}`)}\n${experienceBadge(phase, spec.category)}`;
}

export function commandIdentity(spec: CommandSurfaceSpec): string {
  const lines = [
    `◆ NAME     ${uiText(spec.name, "COMMAND", 48)}`,
    `◆ CATEGORY ${uiText(spec.category, "GENERAL", 32)}`,
    `◆ DESC     ${uiText(spec.description, "NO DESCRIPTION", 72)}`,
  ];
  if (spec.example) lines.push(`◆ EXAMPLE  ${uiText(spec.example, "", 72)}`);
  if (spec.aliases?.length) lines.push(`◆ ALIASES  ${spec.aliases.map((a) => uiText(a, "", 18)).join(" · ")}`);
  return kernelFrame(lines, { width: 72, tone: "PANEL", weight: "REGULAR" });
}

export function commandMatrix(specs: readonly CommandSurfaceSpec[], width = 72): string {
  const lines = specs.slice(0, 18).map((spec, index) => {
    const phase = spec.phase ?? "READY";
    return `${String(index + 1).padStart(2, "0")} ${phase === "READY" ? "●" : "◐"} ${uiText(spec.name, "COMMAND", 28).padEnd(28)} ${uiText(spec.category, "GENERAL", 16).padEnd(16)} ${String(spec.commandCount ?? 0).padStart(4)}`;
  });
  return kernelFrame(lines, { width, tone: "OPERATOR", weight: "HEAVY" });
}

export function commandTelemetry(spec: CommandSurfaceSpec): string {
  return experienceMetrics([
    { label: "COMMANDS", value: spec.commandCount ?? 0, ratio: Math.min(1, (spec.commandCount ?? 0) / 100) },
    { label: "GROUPS", value: spec.groupCount ?? 0, ratio: Math.min(1, (spec.groupCount ?? 0) / 25) },
    { label: "ALIASES", value: spec.aliases?.length ?? 0 },
  ], spec.density ?? "STANDARD");
}

export function commandActions(spec: CommandSurfaceSpec): string {
  return experienceActions(spec.actions ?? [], spec.density ?? "STANDARD");
}

export function commandWall(specs: readonly CommandSurfaceSpec[], seed = 19): string {
  return `${commandMatrix(specs)}\n${kernelFrame([pixelText(`GLYPH-CANONICAL // COMMAND WALL // ${seed.toString(16).toUpperCase()}`, "█", " ", 72)], { width: 72, tone: "DENSE", weight: "HEAVY" })}\n${kernelFrame(matrix(68, 3, "·", seed).split("\n"), { width: 72, tone: "OPERATOR", weight: "LIGHT" })}`;
}

export function commandDetail(spec: CommandSurfaceSpec): string {
  return [commandHero(spec), commandIdentity(spec), commandTelemetry(spec), commandActions(spec)].filter(Boolean).join("\n");
}

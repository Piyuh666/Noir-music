/** NOIR MUSIC // GLYPH-CANONICAL PLAYER EXPERIENCE — visual composition only. */
import { composeExperience, experienceSignal, experienceMatrix, experienceBadge, type ExperienceDensity, type ExperiencePhase } from "./experience";
import { pixelMeter } from "./pixel";
import { kernelFrame } from "./visualKernel";
import { compactNumber } from "./surface";

export interface PlayerSurface {
  title: string;
  artist?: string;
  positionMs: number;
  durationMs: number;
  volume: number;
  queueLength: number;
  latencyMs?: number;
  source?: string;
  phase?: ExperiencePhase;
  density?: ExperienceDensity;
  signal?: readonly number[];
}

export function playerProgress(positionMs: number, durationMs: number, width = 52): string {
  const ratio = durationMs > 0 ? Math.max(0, Math.min(1, positionMs / durationMs)) : 0;
  const elapsed = Math.max(0, Math.floor(positionMs / 1000));
  const total = Math.max(0, Math.floor(durationMs / 1000));
  const meter = pixelMeter(ratio, Math.max(10, width - 20));
  return `${String(elapsed).padStart(4, "0")}s ${meter} ${String(total).padStart(4, "0")}s`;
}

export function playerExperience(spec: PlayerSurface): string {
  const phase = spec.phase ?? "READY";
  const density = spec.density ?? "STANDARD";
  const ratio = spec.durationMs > 0 ? spec.positionMs / spec.durationMs : 0;
  return composeExperience({
    title: spec.title,
    eyebrow: `NOIR MUSIC // PLAYER${spec.source ? ` · ${spec.source}` : ""}`,
    phase,
    density,
    tone: phase === "ERROR" ? "ALERT" : "PANEL",
    metrics: [
      { label: "PROGRESS", value: playerProgress(spec.positionMs, spec.durationMs, 52), ratio },
      { label: "VOLUME", value: `${Math.max(0, Math.min(100, Math.round(spec.volume)))}%`, ratio: Math.max(0, Math.min(1, spec.volume / 100)) },
      { label: "QUEUE", value: compactNumber(spec.queueLength) },
      { label: "LATENCY", value: spec.latencyMs === undefined ? "—" : `${Math.max(0, Math.round(spec.latencyMs))}ms` },
    ],
    sections: [
      { title: "TRACK", lines: [spec.title, spec.artist ?? "UNKNOWN ARTIST", spec.source ? `SOURCE // ${spec.source}` : "SOURCE // UNKNOWN"] },
      { title: "SIGNAL", lines: [experienceBadge(phase, phase), "AUDIO SURFACE // GLYPH-CANONICAL"] },
    ],
    actions: [
      { id: "prev", label: "PREVIOUS", shortcut: "←" },
      { id: "toggle", label: phase === "BUSY" ? "PAUSE" : "PLAY", shortcut: "SPACE" },
      { id: "next", label: "NEXT", shortcut: "→" },
      { id: "queue", label: "QUEUE" },
      { id: "volume", label: "VOLUME" },
    ],
    footer: "PIXEL PLAYER // CONTROL SURFACE",
  });
}

export function playerSignal(values: readonly number[], width = 58): string {
  return `${kernelFrame([experienceSignal(values, width)], { width, tone: "DENSE", weight: "HEAVY" })}\n${experienceMatrix(values.length * 19 + 7, width, 3)}`;
}

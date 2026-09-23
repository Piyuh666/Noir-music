import type { UiCoreInput, UiCoreSurface } from "./contracts";
import { bar, frame } from "./glyph";

export function telemetrySurface(input: UiCoreInput): UiCoreSurface {
  const p = input.player.durationMs > 0 ? Math.max(0, Math.min(1, input.player.positionMs / input.player.durationMs)) : 0;
  const enabled = input.actions.filter((a) => a.enabled).length;
  const rows = [
    `STATE      ${input.player.state}`,
    `PROGRESS   ${Math.round(p * 100)}% ${bar(p, Math.max(8, input.width - 22))}`,
    `VOLUME     ${input.player.volume}% ${bar(input.player.volume / 100, Math.max(8, input.width - 22))}`,
    `QUEUE      ${input.player.queueSize}`,
    `ACTIONS    ${enabled}/${input.actions.length} ENABLED`,
    `EFFECTS    ${input.effects.filter((e) => e.enabled).length}/${input.effects.length} ACTIVE`,
  ];
  return Object.freeze({ surface: "TELEMETRY", lines: frame("RUNTIME TELEMETRY", rows, input.width, "PANEL"), rows: rows.length + 4, priority: 40 });
}

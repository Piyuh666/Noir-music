import type { UiAction, UiPlayerState, UiViewport, UiCoreSurface, UiMetric } from "./contracts";
import { bar, frame, stateGlyph } from "./glyph";
import { fitText } from "./responsive";
import { designControlRail, glyphMatrixSignal, type UiDesign } from "./design";

const time = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

export function playerSurface(player: UiPlayerState, viewport: UiViewport, actions: readonly UiAction[] = [], design: UiDesign = "OPERATOR"): UiCoreSurface {
  const progress = player.durationMs > 0 ? Math.max(0, Math.min(1, player.positionMs / player.durationMs)) : 0;
  const metrics: UiMetric[] = [
    { label: "POSITION", value: time(player.positionMs) },
    { label: "DURATION", value: time(player.durationMs) },
    { label: "VOLUME", value: `${player.volume}%`, ratio: player.volume / 100 },
    { label: "QUEUE", value: String(player.queueSize) },
  ];
  const rows = [
    `${stateGlyph(player.state)} ${fitText(player.title, viewport.width - 12)}`,
    `${stateGlyph("READY")} ${fitText(player.artist, viewport.width - 12)}`,
    glyphMatrixSignal("SOURCE", player.source, viewport.width),
    glyphMatrixSignal("REQUESTER", player.requester, viewport.width),
    `TIME      ${time(player.positionMs)} / ${time(player.durationMs)}`,
    `PROGRESS  ${bar(progress, viewport.width - 20)} ${Math.round(progress * 100).toString().padStart(3, "0")}%`,
    ...metrics.map((m) => `${m.label.padEnd(9)} ${m.value}${m.ratio === undefined ? "" : ` ${bar(m.ratio, Math.max(8, viewport.width - 28))}`}`),
    `MODE      LOOP ${player.loop} · SHUFFLE ${player.shuffle ? "ON" : "OFF"} · AUTOPLAY ${player.autoplay ? "ON" : "OFF"}`,
    actions.length ? `CONTROL   ${designControlRail(actions.map((action) => ({ label: action.label, enabled: action.enabled, active: action.id === "playpause" && player.state === "ACTIVE" })), Math.max(30, viewport.width - 4), design)}` : "CONTROL   · NO ACTIONS",
  ];
  return Object.freeze({ surface: "PLAYER", lines: frame("NOW PLAYING", rows, viewport.width, player.state === "ERROR" ? "ALERT" : "SIGNAL"), rows: rows.length + 4, priority: 100 });
}

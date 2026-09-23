import type { UiTrack, UiViewport, UiCoreSurface } from "./contracts";
import { frame, stateGlyph } from "./glyph";
import { fitText } from "./responsive";

const time = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
export function queueSurface(queue: readonly UiTrack[], viewport: UiViewport, page = 1, pageSize = 8): UiCoreSurface {
  const pages = Math.max(1, Math.ceil(queue.length / pageSize));
  const current = Math.max(1, Math.min(pages, Math.trunc(page)));
  const start = (current - 1) * pageSize;
  const shown = queue.slice(start, start + pageSize);
  const rows = shown.length ? shown.map((track) => `${track.active ? stateGlyph("ACTIVE") : stateGlyph("IDLE")} ${String(track.index).padStart(2, "0")}  ${fitText(track.title, Math.max(12, viewport.width - 32))} · ${fitText(track.artist, 18)} · ${time(track.durationMs)}`) : ["QUEUE EMPTY"];
  rows.push(`◆ PAGE ${current}/${pages} · ${queue.length} TRACKS · VISIBLE ${shown.length}`);
  return Object.freeze({ surface: "QUEUE", lines: frame("QUEUE MATRIX", rows, viewport.width, "DENSE"), rows: rows.length + 4, priority: 80 });
}

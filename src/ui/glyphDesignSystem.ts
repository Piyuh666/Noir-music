import { NOIR_UI_VERSION } from "./uiVersion";
/**
 * NOIR MUSIC // GLYPH MATRIX SUPREME DESIGN SYSTEM V48.6
 * Presentation-only. No command IDs, state ownership, persistence, or audio semantics.
 * Strict visual grammar: glyphs + pixel text only.
 */
import { normalizeGlyphText, pixelMeter, pixelText } from "./pixel";
import { uiText } from "./surface";

export const GLYPH_PIXEL_CONTRACT = NOIR_UI_VERSION;

const G = Object.freeze({
  block: "█", light: "░", mid: "▓", dot: "·", active: "◆", idle: "◇",
  warn: "◐", on: "●", off: "○", arrow: "›", back: "‹", scan: "⌁",
  square: "▣", corner: "┌", cornerR: "┐", cornerB: "└", cornerBR: "┘",
  h: "─", v: "│", cross: "×", play: "▶", pause: "Ⅱ", stop: "■",
  next: "»", prev: "«", search: "⌕", up: "↑", down: "↓",
});

export type GlyphTone = "ACTIVE" | "IDLE" | "WARN" | "ERROR" | "INFO";

export function glyphFor(tone: GlyphTone): string {
  switch (tone) {
    case "ACTIVE": return G.active;
    case "WARN": return G.warn;
    case "ERROR": return G.off;
    case "INFO": return G.square;
    default: return G.idle;
  }
}

export function pixelLabel(label: unknown, value?: unknown, width = 18): string {
  const left = normalizeGlyphText(label, Math.max(4, width)).padEnd(Math.max(4, width), " ");
  return value === undefined ? `${G.active} ${left}` : `${G.active} ${left} ${G.arrow} ${normalizeGlyphText(value, 48)}`;
}

export function pixelButton(label: unknown, glyph: string = G.active, max = 70): string {
  return uiText(`${glyph} ${String(label ?? "ACTION").toUpperCase()}`, "ACTION", max);
}

export function pixelSection(title: unknown, width = 48): string {
  const w = Math.max(12, Math.min(72, Math.floor(width)));
  const text = normalizeGlyphText(title, w - 4).trim();
  return `${G.corner}${G.h.repeat(w - 2)}${G.cornerR}\n${G.v} ${G.square} ${text.padEnd(w - 6, " ")} ${G.v}\n${G.cornerB}${G.h.repeat(w - 2)}${G.cornerBR}`;
}

export function pixelFrameLines(lines: readonly unknown[], width = 48, maxLines = 10): string {
  const w = Math.max(12, Math.min(72, Math.floor(width)));
  const inner = w - 4;
  const body = lines.slice(0, Math.max(1, maxLines)).map((line) => {
    const text = normalizeGlyphText(line, inner);
    return `${G.v} ${text.padEnd(inner, " ")} ${G.v}`;
  });
  return [`${G.corner}${G.h.repeat(w - 2)}${G.cornerR}`, ...body, `${G.cornerB}${G.h.repeat(w - 2)}${G.cornerBR}`].join("\n");
}

export function pixelWriting(lines: readonly unknown[], width = 48, maxLines = 10): string {
  const w = Math.max(12, Math.min(72, Math.floor(width)));
  return lines.slice(0, maxLines).map((line) => {
    const text = normalizeGlyphText(line, w - 4);
    return `${G.v} ${text.padEnd(w - 4, " ")} ${G.v}`;
  }).join("\n");
}

export function pixelTitle(title: unknown, width = 18): string {
  const clean = normalizeGlyphText(title, width).trim() || "NOIR";
  return `${G.square} ${clean} ${G.square}`;
}

export function pixelBrand(width = 22): string {
  const maxChars = Math.max(4, Math.min(8, Math.floor(width / 3)));
  const art = pixelText("NOIR", G.block, " ", maxChars).split("\n");
  return art.map((row) => `${G.active} ${row}`).join("\n");
}

export function pixelRail(items: readonly unknown[], width = 48): string {
  const w = Math.max(12, Math.min(72, Math.floor(width)));
  const safe = items.slice(0, 8).map((item) => normalizeGlyphText(item, w - 6));
  if (!safe.length) safe.push("NO SIGNAL");
  return safe.map((item, index) => `${String(index + 1).padStart(2, "0")} ${index === 0 ? G.active : G.dot} ${item}`).join("\n");
}

export function pixelSignal(state: GlyphTone, label: unknown, detail = ""): string {
  const mark = glyphFor(state);
  const name = normalizeGlyphText(label, 18).padEnd(18, " ");
  const tail = detail ? ` ${G.arrow} ${normalizeGlyphText(detail, 40)}` : "";
  return `${mark} ${name}${tail}`;
}

export function pixelProgress(value: number, width = 24): string {
  const meter = pixelMeter(value, width);
  return `${G.active} ${meter}`;
}

export function pixelControls(labels: readonly string[], width = 48): string {
  const safe = labels.slice(0, 8).map((label, i) => `${i === 0 ? G.active : G.dot} ${normalizeGlyphText(label, 16)}`);
  return pixelFrameLines(safe, width, 8);
}

export function pixelTrack(title: unknown, artist: unknown, position: number, duration: number, volume: number): string {
  const percent = duration > 0 ? Math.max(0, Math.min(100, position / duration * 100)) : 0;
  return pixelFrameLines([
    pixelTitle(title, 34),
    `${G.arrow} ${normalizeGlyphText(artist, 38)}`,
    `${pixelProgress(percent, 22)} ${Math.round(percent)}%`,
    `${G.square} VOL ${Math.round(Math.max(0, Math.min(100, volume)))}% ${G.dot} AUDIO`,
  ], 48, 6);
}

export function pixelFooter(label = "NOIR MUSIC"): string {
  const text = normalizeGlyphText(label, 42);
  return `${G.h.repeat(4)} ${G.active} ${text} ${G.h.repeat(4)}`;
}

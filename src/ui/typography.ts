/** NOIR MUSIC // PIXEL TYPOGRAPHY — text is treated as a visual primitive. */
import { normalizeGlyphText, pixelText } from "./pixel";
import { uiText } from "./surface";
import { UI_TOKENS } from "./theme";
import { pixelLabel as glyphPixelLabel, pixelTitle as glyphPixelTitle, pixelWriting as glyphPixelWriting } from "./glyphDesignSystem";

export function pixelWord(value: unknown, max = 14): string {
  return pixelText(normalizeGlyphText(value, max), UI_TOKENS.glyph.block, " ", max);
}

export function pixelCaption(value: unknown, max = 72): string {
  return normalizeGlyphText(value, max).replace(/\s+/g, " ").trim();
}

export function pixelTitle(value: unknown, max = 28): string {
  return glyphPixelTitle(pixelCaption(value, max), max);
}

export function glyphLabel(label: unknown, value: unknown, width = 12): string {
  return glyphPixelLabel(pixelCaption(label, width), pixelCaption(value, 42), width);
}

export function pixelWriting(lines: readonly unknown[], width = 42): string {
  return glyphPixelWriting(lines.map((line) => uiText(line, "", width)), width, 12);
}

export function terminalLine(label: unknown, value: unknown, width = 48): string {
  const left = normalizeGlyphText(label, 16).padEnd(16, " ");
  const right = pixelCaption(value, Math.max(8, width - 19));
  return `${UI_TOKENS.glyph.dot} ${left} ${UI_TOKENS.glyph.arrow} ${right}`;
}

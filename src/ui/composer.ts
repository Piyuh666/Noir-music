/** NOIR MUSIC // COMPOSITOR — converts small visual primitives into safe Discord surfaces. */
import { fitDescription, fitFieldName, fitFieldValue, DISCORD_LIMITS, packVisualBlocks, uiText } from "./surface";
import { glyphPanelAdvanced, sectionRule, visualStack } from "./layout";
import { pixelCaption, pixelWriting, terminalLine } from "./typography";

export interface VisualField { name: string; value: string; inline?: boolean; }

export function composeGlyphSurface(blocks: readonly string[], opts: { width?: number; maxChars?: number; maxBlocks?: number } = {}): string {
  const width = Math.max(18, Math.min(72, Math.trunc(opts.width ?? 46)));
  const pages = packVisualBlocks(blocks, opts.maxChars ?? DISCORD_LIMITS.description, opts.maxBlocks ?? 12);
  return fitDescription(pages[0]?.join("\n\n") ?? "—");
}

export function composeOperatorSurface(title: string, rows: readonly VisualField[], opts: { width?: number } = {}): string {
  const width = Math.max(24, Math.min(68, Math.trunc(opts.width ?? 52)));
  const lines = rows.slice(0, 14).map((row) => `${fitFieldName(row.name).toUpperCase()} ${row.inline === false ? "" : "·"} ${fitFieldValue(row.value,).replace(/\n/g, " ")}`);
  return visualStack([
    `▣ ${pixelCaption(title, 42).toUpperCase()}`,
    sectionRule("OPERATOR FRAME", width),
    glyphPanelAdvanced(lines.length ? lines : ["○ NO DATA"], { width, tone: "OPERATOR", title: "TELEMETRY", maxLines: 14 }),
  ]);
}

export function composePixelWriting(lines: readonly unknown[], width = 42): string {
  const safeWidth = Math.max(18, Math.min(72, Math.trunc(width)));
  return pixelWriting(lines.slice(0, 14), safeWidth);
}

export function composeTerminal(rows: readonly { label: string; value: unknown }[], width = 48): string {
  const safeWidth = Math.max(24, Math.min(76, Math.trunc(width)));
  return rows.slice(0, 16).map((row) => terminalLine(uiText(row.label, "FIELD", 18), row.value, safeWidth)).join("\n");
}

export function composeFields(fields: readonly VisualField[]): VisualField[] {
  return fields.slice(0, DISCORD_LIMITS.fields).map((field) => ({
    name: fitFieldName(field.name),
    value: fitFieldValue(field.value),
    inline: field.inline !== false,
  }));
}

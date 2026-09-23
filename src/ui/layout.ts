/** NOIR MUSIC // GLYPH LAYOUT ENGINE — deterministic, Discord-safe visual packing. */
import { DISCORD_LIMITS, uiText } from "./surface";
import { UI_TOKENS } from "./theme";

export type PanelTone = "BLACK" | "PANEL" | "DENSE" | "OPERATOR";

const borderFor = (tone: PanelTone): string => tone === "OPERATOR" ? "═" : tone === "DENSE" ? "┄" : "─";

export function glyphPanelAdvanced(lines: readonly unknown[], options: { width?: number; tone?: PanelTone; title?: string; maxLines?: number } = {}): string {
  const width = Math.max(12, Math.min(DISCORD_LIMITS.description - 20, Math.floor(options.width ?? UI_TOKENS.width.standard)));
  const maxLines = Math.max(1, Math.min(UI_TOKENS.limits.panelLines, Math.floor(options.maxLines ?? 10)));
  const border = borderFor(options.tone ?? "PANEL");
  const title = options.title ? ` ${uiText(options.title, "", Math.min(width, 28)).toUpperCase()} ` : "";
  const top = `┌${title}${border.repeat(Math.max(2, width - title.length))}┐`;
  const body = lines.slice(0, maxLines).map((line) => {
    const text = uiText(line, "", width);
    return `│ ${text.padEnd(Math.max(0, width - 2), " ")} │`;
  });
  return [top, ...body, `└${border.repeat(width)}┘`].join("\n");
}

export function sectionRule(label = "", width: number = UI_TOKENS.width.standard): string {
  const w = Math.max(12, Math.min(80, Math.floor(width)));
  const clean = uiText(label, "", Math.min(24, w - 4)).toUpperCase();
  if (!clean) return `┄${"─".repeat(w - 2)}┄`;
  const remaining = Math.max(2, w - clean.length - 4);
  return `┄─ ${clean} ${"─".repeat(remaining)}┄`;
}

export function twoColumn(left: unknown, right: unknown, width = 44): string {
  const w = Math.max(20, Math.min(76, Math.floor(width)));
  const split = Math.floor(w / 2);
  const a = uiText(left, "", split).padEnd(split, " ");
  const b = uiText(right, "", w - split).padStart(w - split, " ");
  return `${a}${UI_TOKENS.glyph.dot}${b}`;
}

export function visualStack(blocks: readonly string[], gap = 1): string {
  return blocks.filter(Boolean).join("\n".repeat(Math.max(1, Math.min(3, gap))));
}

export function safeEmbedDescription(blocks: readonly string[], max = DISCORD_LIMITS.description): string {
  const raw = visualStack(blocks);
  return raw.length <= max ? raw : `${raw.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/** Full-width visual frame that keeps decorative chrome subordinate to content. */
export function glyphFrame(title: string, body: readonly unknown[], opts: { width?: number; tone?: PanelTone; footer?: string } = {}): string {
  const w = Math.max(18, Math.min(76, Math.floor(opts.width ?? UI_TOKENS.width.standard)));
  const tone = opts.tone ?? "PANEL";
  const border = borderFor(tone);
  const cleanTitle = uiText(title, "NOIR MUSIC", Math.max(8, w - 8)).toUpperCase();
  const lines = body.slice(0, UI_TOKENS.limits.panelLines).map((line) => uiText(line, "", w - 4).padEnd(w - 4, " "));
  const top = `╔${border.repeat(2)} ${cleanTitle} ${border.repeat(Math.max(2, w - cleanTitle.length - 5))}╗`;
  const content = lines.map((line) => `║ ${line} ║`);
  const footer = opts.footer ? [`╟${border.repeat(w)}╢`, `║ ${uiText(opts.footer, "", w - 4).padEnd(w - 4, " ")} ║`] : [];
  return [top, ...content, ...footer, `╚${border.repeat(w)}╝`].join("\n");
}

export function splitRail(items: readonly unknown[], columns = 2, width = 48): string {
  const cols = Math.max(1, Math.min(4, Math.floor(columns)));
  const w = Math.max(24, Math.min(80, Math.floor(width)));
  const each = Math.max(8, Math.floor((w - (cols - 1) * 2) / cols));
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += cols) {
    const cells = Array.from({ length: cols }, (_, c) => uiText(items[i + c], "", each).padEnd(each, " "));
    rows.push(cells.join(" · "));
  }
  return rows.join("\n");
}

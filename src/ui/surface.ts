/** NOIR MUSIC UI SURFACE ENGINE — one defensive boundary for all Discord text. */
export const DISCORD_LIMITS = Object.freeze({
  description: 4096, fieldName: 256, fieldValue: 1024, footer: 2048,
  embedTotal: 6000, fields: 25, componentsPerRow: 5, buttonLabel: 80,
  selectOptions: 25, customId: 100,
});

export function uiText(value: unknown, fallback = "—", max = 1024): string {
  const text = String(value ?? fallback)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\r?\n{3,}/g, "\n\n")
    .replace(/[ \t]{3,}/g, "  ")
    .trim();
  return (text || fallback).slice(0, Math.max(1, max));
}

export function uiLines(lines: unknown[], maxLines = 30, maxLine = 180): string {
  return lines.slice(0, Math.max(0, maxLines)).map((line) => uiText(line, "", maxLine)).filter(Boolean).join("\n");
}

export function uiPage<T>(items: readonly T[], page = 1, pageSize = 10): { items: T[]; page: number; pages: number; total: number; start: number; end: number; hasPrevious: boolean; hasNext: boolean } {
  const size = Math.max(1, Math.min(25, Math.floor(pageSize)));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.max(1, Math.min(pages, Number.isFinite(page) ? Math.floor(page) : 1));
  const start = (current - 1) * size;
  const result = items.slice(start, start + size) as T[];
  return { items: result, page: current, pages, total, start, end: start + result.length, hasPrevious: current > 1, hasNext: current < pages };
}

export function fitDescription(value: string, max = DISCORD_LIMITS.description): string {
  const limit = Math.max(1, Math.min(DISCORD_LIMITS.description, Math.floor(max)));
  const safe = uiText(value, "—", Number.MAX_SAFE_INTEGER);
  return safe.length <= limit ? safe : `${safe.slice(0, Math.max(1, limit - 1)).trimEnd()}…`;
}

export function fitFieldName(value: unknown): string { return uiText(value, "—", DISCORD_LIMITS.fieldName); }
export function fitFieldValue(value: unknown): string { return uiText(value, "—", DISCORD_LIMITS.fieldValue); }
export function fitFooter(value: unknown): string { return uiText(value, "", DISCORD_LIMITS.footer); }
export function fitButtonLabel(value: unknown): string { return uiText(value, "BUTTON", DISCORD_LIMITS.buttonLabel); }

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function progress(value: number, width = 20, filled = "█", empty = "░"): string {
  const w = clampInt(width, 4, 40, 20);
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const count = Math.round((v / 100) * w);
  return `${filled.repeat(count)}${empty.repeat(w - count)} ${Math.round(v)}%`;
}

export function divider(width = 32, glyph = "─"): string {
  return glyph.repeat(clampInt(width, 4, 80, 32));
}

export function safeCustomId(value: string): string {
  const clean = uiText(value, "mono:invalid", DISCORD_LIMITS.customId).replace(/\s+/g, "-");
  return clean.slice(0, DISCORD_LIMITS.customId);
}

/**
 * Splits a long list into Discord-safe chunks without cutting a logical line.
 * This is useful for diagnostics, command matrices and audit-like surfaces.
 */
export function chunkLines(lines: readonly string[], maxChars = DISCORD_LIMITS.description, maxLines = 30): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let size = 0;
  for (const raw of lines) {
    const line = uiText(raw, "", Math.min(maxChars, DISCORD_LIMITS.description));
    if (!line) continue;
    const projected = size + line.length + (current.length ? 1 : 0);
    if (current.length >= maxLines || projected > maxChars) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(line);
    size += line.length + (current.length > 1 ? 1 : 0);
  }
  if (current.length) chunks.push(current);
  return chunks;
}

export function compactNumber(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.trunc(n).toString();
}

export function latencyLabel(ms: unknown): string {
  const n = Math.max(0, Number(ms) || 0);
  return n < 1000 ? `${Math.round(n)}ms` : `${(n / 1000).toFixed(2)}s`;
}

/** Packs arbitrary UI blocks into Discord-safe pages while preserving whole blocks. */
export function packVisualBlocks(blocks: readonly string[], maxChars: number = DISCORD_LIMITS.description, maxBlocks: number = 12): string[][] {
  const limit = Math.max(128, Math.min(DISCORD_LIMITS.description, Math.floor(maxChars)));
  const chunks: string[][] = [];
  let current: string[] = [];
  let size = 0;
  for (const raw of blocks) {
    const block = uiText(raw, "", limit);
    if (!block) continue;
    const projected = size + block.length + (current.length ? 2 : 0);
    if (current.length >= maxBlocks || projected > limit) {
      if (current.length) chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(block);
    size += block.length + (current.length > 1 ? 2 : 0);
  }
  if (current.length) chunks.push(current);
  return chunks;
}

export function visualProgress(value: number, width = 20, left = "█", right = "░"): { bar: string; percent: number; filled: number; width: number } {
  const w = clampInt(width, 4, 48, 20);
  const percent = Math.max(0, Math.min(100, Number(value) || 0));
  const filled = Math.round(percent / 100 * w);
  return { bar: `${left.repeat(filled)}${right.repeat(w - filled)}`, percent: Math.round(percent), filled, width: w };
}

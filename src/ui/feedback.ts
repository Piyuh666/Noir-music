/** NOIR MUSIC // GLYPH-14 FEEDBACK — feedback, notices and transient UX copy. */
export type FeedbackTone = "SUCCESS" | "INFO" | "WARNING" | "ERROR" | "PROGRESS";
export interface FeedbackNotice { tone: FeedbackTone; title: string; message: string; detail?: string; action?: string; }
const GLYPH: Record<FeedbackTone, string> = { SUCCESS: "●", INFO: "▣", WARNING: "◐", ERROR: "×", PROGRESS: "⌁" };
function clean(value: unknown): string { return String(value ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim(); }
export function feedbackGlyph(tone: FeedbackTone): string { return GLYPH[tone]; }
export function feedbackNotice(notice: FeedbackNotice, width = 54): string[] {
  const max = Math.max(18, Math.min(96, width)); const title = `${GLYPH[notice.tone]} ${clean(notice.title)}`.slice(0, max - 4);
  const message = clean(notice.message).slice(0, max - 4); const lines = [`┌${"─".repeat(max - 2)}┐`, `│ ${title.padEnd(max - 4)} │`, `│ ${message.padEnd(max - 4)} │`];
  if (notice.detail) lines.push(`│ ${clean(notice.detail).slice(0, max - 4).padEnd(max - 4)} │`);
  if (notice.action) lines.push(`├${"─".repeat(max - 2)}┤`, `│ ◆ ${clean(notice.action).slice(0, max - 6).padEnd(max - 6)} │`);
  lines.push(`└${"─".repeat(max - 2)}┘`); return lines;
}
export function progressFeedback(label: string, value: number, width = 28): string {
  const safe = Math.max(4, Math.min(48, Math.floor(width))); const ratio = Math.max(0, Math.min(1, Number(value) || 0)); const n = Math.round(ratio * safe);
  return `⌁ ${clean(label)} ${"█".repeat(n)}${"░".repeat(safe - n)} ${Math.round(ratio * 100)}%`;
}

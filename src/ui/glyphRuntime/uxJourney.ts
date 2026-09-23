/** NOIR MUSIC // GLYPH-V48.6 UX JOURNEY — explicit interaction journeys, not backend state. */
export type JourneyState = "IDLE" | "DISCOVER" | "CONFIRM" | "EXECUTE" | "RESULT" | "RECOVER";
export type JourneyIntent = "NAVIGATE" | "ACTIVATE" | "CONFIRM" | "CANCEL" | "RETRY" | "REFRESH";
export interface JourneyNode { id: string; label: string; state?: JourneyState; intent?: JourneyIntent; hint?: string; destructive?: boolean; }
export interface JourneySpec { title: string; nodes: readonly JourneyNode[]; current?: string; width?: number; }
const glyph: Record<JourneyState, string> = { IDLE: "○", DISCOVER: "◇", CONFIRM: "△", EXECUTE: "◐", RESULT: "●", RECOVER: "↻" };
const intentGlyph: Record<JourneyIntent, string> = { NAVIGATE: "→", ACTIVATE: "◆", CONFIRM: "✓", CANCEL: "×", RETRY: "↻", REFRESH: "⌁" };
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, Math.trunc(n)));
const clean = (s: string, n: number) => s.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

export function journeyRail(spec: JourneySpec): string {
  const current = spec.current;
  return spec.nodes.slice(0, 10).map((n) => `${n.id === current ? "◆" : glyph[n.state ?? "IDLE"]} ${clean(n.label, 12)}`).join("  ").slice(0, clamp(spec.width ?? 60, 28, 72));
}
export function journey(spec: JourneySpec): string[] {
  const current = spec.current;
  return spec.nodes.slice(0, 12).map((n, i) => {
    const mark = n.id === current ? "◆" : glyph[n.state ?? "IDLE"];
    const action = n.intent ? intentGlyph[n.intent] : "·";
    const danger = n.destructive ? " !" : "";
    return `${mark} ${String(i + 1).padStart(2, "0")} ${action} ${clean(n.label, 28)}${danger}${n.hint ? ` — ${clean(n.hint, 34)}` : ""}`;
  });
}
export function journeySummary(spec: JourneySpec): string {
  const current = spec.nodes.find((n) => n.id === spec.current);
  const state = current?.state ?? "IDLE";
  const intent = current?.intent ?? "NAVIGATE";
  return `${glyph[state]} ${clean(spec.title, 28)}  ${intentGlyph[intent]} ${intent}  [${state}]`;
}
export function journeyAccessibility(spec: JourneySpec): string {
  const current = spec.nodes.find((n) => n.id === spec.current);
  if (!current) return `${clean(spec.title, 60)}. No active step.`;
  return `${clean(spec.title, 60)}. Current step: ${clean(current.label, 80)}. State: ${current.state ?? "IDLE"}. Action: ${current.intent ?? "NAVIGATE"}.`;
}

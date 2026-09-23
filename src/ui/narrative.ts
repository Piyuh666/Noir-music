/** NOIR MUSIC // GLYPH-17 NARRATIVE — pixel-native microcopy that communicates state before detail. */
import { uiText } from "./surface";

export type NarrativeIntent = "DISCOVER" | "CONFIRM" | "PROGRESS" | "RECOVER" | "NAVIGATE" | "EMPTY" | "BLOCKED";

const OPENERS: Record<NarrativeIntent, string> = {
  DISCOVER: "SCAN",
  CONFIRM: "LOCK",
  PROGRESS: "RUN",
  RECOVER: "RESTORE",
  NAVIGATE: "ROUTE",
  EMPTY: "VOID",
  BLOCKED: "GATE",
};

const GLYPHS: Record<NarrativeIntent, string> = {
  DISCOVER: "⌁", CONFIRM: "●", PROGRESS: "◐", RECOVER: "↻", NAVIGATE: "›", EMPTY: "○", BLOCKED: "×",
};

export function narrativeLine(intent: NarrativeIntent, message: string, width = 72): string {
  const prefix = `${GLYPHS[intent]} ${OPENERS[intent]} //`;
  return `${prefix} ${uiText(message, "—", Math.max(8, width - prefix.length - 1))}`;
}

export function narrativeDeck(intent: NarrativeIntent, title: string, details: readonly string[] = [], width = 72): string {
  const rows = [narrativeLine(intent, title, width), ...details.slice(0, 8).map((detail) => `  · ${uiText(detail, "", width - 4)}`)];
  return rows.join("\n");
}

export function narrativeAction(intent: NarrativeIntent, action: string): string {
  return `${GLYPHS[intent]} ${uiText(action, "ACTION", 42)}`;
}

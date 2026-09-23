/** NOIR MUSIC // GLYPH-13 VISUAL STATE KIT. */
import { glyphEmptyFrame, glyphErrorFrame, glyphLoadingFrame } from "./glyphArt";
import { uiText } from "./surface";
import { motionGlyph, pulseLine, scanline } from "./animation";

export type VisualState = "READY" | "LOADING" | "EMPTY" | "WARNING" | "ERROR" | "STALE" | "OFFLINE" | "LOCKED";

export function stateGlyph(state: VisualState): string { return ({READY:"◆",LOADING:"◐",EMPTY:"○",WARNING:"◌",ERROR:"×",STALE:"◇",OFFLINE:"□",LOCKED:"▣"} as Record<VisualState,string>)[state]; }
export function stateLabel(state: VisualState): string { return state.replace(/_/g," "); }
export function stateLine(state: VisualState, title: string, detail = "", frame = 0): string {
  const dynamic = state === "LOADING" ? scanline(frame,28) : state === "READY" ? pulseLine(frame,28) : "";
  return [`${stateGlyph(state)} ${uiText(title,"NOIR MUSIC",56).toUpperCase()}`, detail ? `· ${uiText(detail,"",100)}` : "", dynamic].filter(Boolean).join("\n");
}
export function stateSurface(state: VisualState, title: string, detail = "", action = "", frame = 0, width = 48): string {
  if (state === "LOADING") return glyphLoadingFrame(title,frame,width);
  if (state === "EMPTY") return glyphEmptyFrame(title,action || "OPEN",width);
  if (state === "ERROR" || state === "OFFLINE") return glyphErrorFrame(title,detail || "RECOVER / REFRESH",width);
  return stateLine(state,title,detail,frame);
}
export function stateAnnouncement(state: VisualState, title: string, detail = ""): string { return `${stateLabel(state)}. ${uiText(title,"NOIR MUSIC",100)}.${detail ? ` ${uiText(detail,"",160)}.` : ""}`; }
export function stateColorlessEmphasis(state: VisualState): string { return `${stateGlyph(state)} ${stateLabel(state)}`; }
export function stateMotion(state: VisualState, frame = 0): string { return motionGlyph(state === "LOADING" ? "SCAN" : state === "READY" ? "PULSE" : "STATIC", frame); }

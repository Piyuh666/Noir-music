/** NOIR MUSIC // GLYPH-11 ACCESSIBILITY — text alternatives for glyph-heavy surfaces. */
import { uiText } from "./surface";

export interface AccessibleSurface { visual: string; plain: string; announcement: string; }

export function glyphToPlain(value: unknown): string {
  return String(value ?? "")
    .replace(/[█▓▒░━─═┄┌┐└┘│▣◆◇●○◐›‹↑↓×⌁⌕▶Ⅱ■«»·•]/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n[ ]+/g, "\n")
    .trim();
}

export function accessibleSurface(visual: string, announcement = ""): AccessibleSurface {
  const plain = glyphToPlain(visual);
  return { visual, plain, announcement: uiText(announcement || plain, "", 512) };
}

export function accessibleLabel(label: string, value?: unknown): string {
  const left = uiText(label, "LABEL", 80);
  return value === undefined ? left : `${left}: ${uiText(value, "", 180)}`;
}

export function accessibleStatus(state: string, detail = ""): string {
  return detail ? `${uiText(state, "STATUS", 40)}. ${uiText(detail, "", 180)}` : uiText(state, "STATUS", 40);
}

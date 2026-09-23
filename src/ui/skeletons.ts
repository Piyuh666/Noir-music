/** NOIR MUSIC // GLYPH-13 SKELETONS — loading UX that communicates structure, not filler. */
import { glyphCornerFrame, glyphRail } from "./glyphArt";
import { pixelMeter } from "./pixel";

export function skeletonRows(count = 5, width = 44): string {
  const n = Math.max(1, Math.min(12, Math.trunc(count))); const w = Math.max(20, Math.min(72, Math.trunc(width)));
  return Array.from({length:n},(_,i)=>`${String(i+1).padStart(2,"0")} ${glyphRail(Math.max(8,w - 4), i % 2 ? "·" : "─")}`).join("\n");
}
export function skeletonPlayer(width = 48): string {
  return glyphCornerFrame("PLAYER LOADING", ["◆ TRACK TITLE", "· ARTIST / SOURCE", glyphRail(width - 4,"·"), pixelMeter(42,18), "◐ RESOLVING AUDIO STATE"], {width,tone:"DENSE"});
}
export function skeletonQueue(width = 48): string {
  return glyphCornerFrame("QUEUE LOADING", [skeletonRows(6,width), "◐ INDEXING QUEUE"], {width,tone:"PANEL"});
}
export function skeletonDashboard(width = 48): string {
  return glyphCornerFrame("DASHBOARD LOADING", [glyphRail(width - 4,"·"), glyphRail(width - 4,"─"), glyphRail(width - 4,"·"), "◐ COLLECTING TELEMETRY"], {width,tone:"OPERATOR"});
}

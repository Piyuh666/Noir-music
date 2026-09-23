/** NOIR MUSIC // GLYPH-13 MOTION PRIMITIVES — fake-free deterministic frames for Discord's static surfaces. */
import { matrix, pixelPulse, pixelSpark } from "./pixel";

export type MotionMode = "STATIC" | "PULSE" | "SCAN" | "BREATHE" | "SPIN";
export interface MotionFrame { mode: MotionMode; frame: number; total: number; glyph: string; rail: string; }

export function motionGlyph(mode: MotionMode, frame = 0): string {
  const f = Math.abs(Math.trunc(frame));
  if (mode === "STATIC") return "·";
  if (mode === "PULSE") return ["·","▪","◆","▪"][f % 4];
  if (mode === "SCAN") return ["▸","◆","◂","·"][f % 4];
  if (mode === "BREATHE") return ["○","◌","●","◌"][f % 4];
  return ["◰","◳","◲","◱"][f % 4];
}

export function motionFrame(mode: MotionMode, frame = 0, total = 4, width = 36): MotionFrame {
  const t = Math.max(1, Math.trunc(total));
  const f = ((Math.trunc(frame) % t) + t) % t;
  const glyph = motionGlyph(mode, f);
  const w = Math.max(8, Math.min(72, Math.trunc(width)));
  const cursor = Math.round((f / Math.max(1,t - 1)) * (w - 1));
  const rail = Array.from({length:w},(_,i)=>i === cursor ? glyph : i < cursor ? "━" : "─").join("");
  return { mode, frame:f, total:t, glyph, rail };
}

export function scanline(frame = 0, width = 36): string { return motionFrame("SCAN",frame,4,width).rail; }
export function pulseLine(frame = 0, width = 36): string { return `${motionFrame("PULSE",frame,4,width).rail} ${pixelPulse(frame,8)}`; }
export function breatheLine(frame = 0, width = 36): string { return `${motionFrame("BREATHE",frame,4,width).rail} ${motionGlyph("BREATHE",frame)}`; }
export function motionMatrix(frame = 0, width = 18, height = 4): string { return matrix(width,height,"·",0x4d4f4e4f + Math.trunc(frame)); }
export function motionSpectrum(values: readonly number[], frame = 0, width = 36): string {
  const shifted = values.length ? values.map((v,i)=>v + Math.sin((i + frame) * 0.7) * 0.001) : [];
  return pixelSpark(shifted,width);
}

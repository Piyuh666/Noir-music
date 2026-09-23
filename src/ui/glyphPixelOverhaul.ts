/**
 * NOIR MUSIC // GLYPH-PIXEL OVERHAUL V2
 * Strict presentation boundary: glyphs + pixel text only.
 * No command IDs, persistence, audio state ownership, or mutation.
 */
import { normalizeGlyphText, pixelMeter, pixelText } from "./pixel";

export const GLYPH_PIXEL_OVERHAUL_CONTRACT = "NOIR-GLYPH-MATRIX-V48.6" as const;

const G = Object.freeze({
  tl:"╔", tr:"╗", bl:"╚", br:"╝", h:"═", v:"║", mid:"╬",
  active:"◆", ready:"●", idle:"◇", warn:"◐", off:"○", error:"×",
  dot:"·", arrow:"›", back:"‹", scan:"⌁", square:"▣", block:"█", light:"░", midFill:"▓",
  play:"▶", pause:"Ⅱ", stop:"■", next:"»", prev:"«", search:"⌕", up:"↑", down:"↓",
});

export type PixelState = "LIVE" | "READY" | "IDLE" | "BUSY" | "WARN" | "ERROR" | "OFFLINE" | "PAUSED";

const clamp = (n:number,min:number,max:number) => Math.max(min, Math.min(max, Math.trunc(Number(n) || 0)));
const clean = (v:unknown,max:number) => normalizeGlyphText(v,max).replace(/\s+/g," ").trim();

export function pixelGlyph(state: PixelState): string {
  switch(state){
    case "LIVE": case "READY": return G.ready;
    case "BUSY": case "WARN": case "PAUSED": return G.warn;
    case "ERROR": case "OFFLINE": return G.error;
    case "IDLE": default: return G.idle;
  }
}

export function pixelWordmark(label = "NOIR", width = 30): string {
  const safe = clean(label, 8) || "NOIR";
  const art = pixelText(safe, G.block, " ", Math.min(8, safe.length)).split("\n");
  const inner = clamp(width, 20, 72) - 4;
  return art.map(row => `${G.v} ${row.slice(0,inner).padEnd(inner," ")} ${G.v}`).join("\n");
}

export function pixelTitleBar(title:unknown, state:PixelState="READY", width=52): string {
  const w = clamp(width, 24, 72), inner = w - 4;
  const text = `${pixelGlyph(state)} ${clean(title, inner - 3) || "NOIR MUSIC"}`;
  return `${G.tl}${G.h.repeat(w-2)}${G.tr}\n${G.v} ${text.padEnd(inner," ")} ${G.v}\n${G.bl}${G.h.repeat(w-2)}${G.br}`;
}

export function pixelPanel(lines:readonly unknown[], width=52, maxLines=12): string {
  const w = clamp(width, 24, 72), inner = w - 4;
  const body = lines.slice(0,maxLines).map(line => {
    const text = clean(line,inner);
    return `${G.v} ${text.padEnd(inner," ")} ${G.v}`;
  });
  if(!body.length) body.push(`${G.v} ${G.off} NO DATA`.padEnd(w-1," ")+G.v);
  return [`${G.tl}${G.h.repeat(w-2)}${G.tr}`,...body,`${G.bl}${G.h.repeat(w-2)}${G.br}`].join("\n");
}

export function pixelDivider(width=52, glyph:string=G.h): string {
  return glyph.repeat(clamp(width,12,72));
}

export function pixelWriting2X(lines:readonly unknown[], width=52, maxLines=14): string {
  const w=clamp(width,24,72), inner=w-4;
  return lines.slice(0,maxLines).map((line,i)=>`${G.v} ${String(i+1).padStart(2,"0")} ${G.dot} ${clean(line,inner-6).padEnd(inner-6," ")} ${G.v}`).join("\n");
}

export function pixelMetric(label:unknown,value:unknown,state:PixelState="READY",width=52): string {
  const w=clamp(width,24,72), inner=w-8;
  const left=clean(label,Math.floor(inner*.55)).padEnd(Math.floor(inner*.55)," ");
  const right=clean(value,Math.ceil(inner*.45)).padStart(Math.ceil(inner*.45)," ");
  return `${pixelGlyph(state)} ${left} ${G.arrow} ${right}`.slice(0,w);
}

export function pixelMeter2X(value:number,width=24): string {
  const w=clamp(width,8,40), v=Math.max(0,Math.min(100,Number(value)||0));
  const filled=Math.round(v/100*w);
  return `${G.block.repeat(filled)}${G.light.repeat(w-filled)} ${String(Math.round(v)).padStart(3,"0")}%`;
}

export function pixelSignalRail(values:readonly number[],width=52): string {
  const w=clamp(width,16,72); if(!values.length) return `${G.off} NO SIGNAL`;
  const source=values.slice(-w).map(v=>Math.max(0,Math.min(100,Number(v)||0)));
  const chars="▁▂▃▄▅▆▇█";
  return source.map(v=>chars[Math.min(chars.length-1,Math.floor(v/100*chars.length))]).join("");
}

export function pixelActionRail(actions:readonly string[],width=52): string {
  const safe=actions.slice(0,8).map((a,i)=>`${i===0?G.active:G.dot} ${clean(a,16)}`);
  return pixelPanel(safe,width,8);
}

export function pixelTrackCard(opts:{title:unknown;artist:unknown;position:number;duration:number;volume:number;state:PixelState},width=58): string {
  const duration=Math.max(0,Number(opts.duration)||0), position=Math.max(0,Math.min(duration,Number(opts.position)||0));
  const ratio=duration?position/duration*100:0;
  return pixelPanel([
    `${G.square} ${clean(opts.title,Math.max(12,width-12))}`,
    `${G.arrow} ${clean(opts.artist,Math.max(12,width-12))}`,
    `${pixelMeter2X(ratio,Math.min(28,width-24))}`,
    `${pixelGlyph(opts.state)} ${opts.state} ${G.dot} VOL ${clamp(opts.volume,0,100)}%`,
  ],width,6);
}

export function pixelQueueRows(items:readonly {title:unknown;artist?:unknown;active?:boolean}[],width=58): string {
  const w=clamp(width,24,72), inner=w-8;
  const rows=items.slice(0,12).map((item,i)=>`${item.active?G.active:G.dot} ${String(i+1).padStart(2,"0")} ${clean(item.title,Math.floor(inner*.62))}${item.artist?` ${G.arrow} ${clean(item.artist,Math.floor(inner*.30))}`:""}`);
  return pixelPanel(rows.length?rows:[`${G.off} QUEUE EMPTY`],w,12);
}

export function pixelCommandMatrix(categories:readonly string[],total:number,width=58): string {
  const names=categories.slice(0,15).map((c,i)=>`${String(i+1).padStart(2,"0")} ${G.square} ${clean(c,24)}`);
  return pixelPanel([`${G.active} COMMANDS ${Math.max(0,Math.trunc(total))}`,`${G.ready} MODULES  ${categories.length}`,pixelDivider(width-8,G.dot),...names],width,18);
}

export function pixelFooter2X(label="NOIR MUSIC // GLYPH-PIXEL"): string {
  const text=clean(label,48)||"NOIR MUSIC";
  return `${G.h.repeat(3)} ${G.active} ${text} ${G.h.repeat(3)}`;
}

export function pixelCode(seed:unknown,width=32,height=4): string {
  const w=clamp(width,8,48), h=clamp(height,2,8); let s=String(seed??"").split("").reduce((a,c)=>((a*33)^c.charCodeAt(0))>>>0,0x4e4f4952);
  const next=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return s>>>0;};
  return Array.from({length:h},()=>Array.from({length:w},()=>next()%11===0?G.square:next()%5===0?G.dot:G.light).join("")).join("\n");
}

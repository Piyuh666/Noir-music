import { NOIR_UI_VERSION } from "./uiVersion";
/**
 * NOIR MUSIC // GLYPH INTERFACE V4 // 2X ULTRA-ULTRA MATRIX
 * Presentation-only. Strict glyph dialects + pixel writing. No runtime mutation.
 */
import { normalizeGlyphText, pixelMeter, pixelText } from "./pixel";
import { composeGlyphRuntime } from "./glyphRuntime/runtime";

export const GLYPH_INTERFACE_V4_CONTRACT = NOIR_UI_VERSION;
export type GlyphV4Mode = "PLAYER" | "QUEUE" | "COMMAND" | "NODE" | "TELEMETRY" | "SPECTRUM" | "STATE" | "ERROR";
export type GlyphV4Phase = "LIVE" | "READY" | "BUSY" | "PAUSED" | "IDLE" | "WARN" | "ERROR" | "OFFLINE";

const G = Object.freeze({
  tl:"╔",tr:"╗",bl:"╚",br:"╝",h:"═",v:"║",ml:"╠",mr:"╣",
  lt:"╭",rt:"╮",lb:"╰",rb:"╯",sh:"─",sv:"│",
  diamond:"◆",hollow:"◇",square:"▣",ring:"○",dot:"·",arrow:"›",back:"‹",
  pulse:"⌁",cursor:"⌘",fault:"×",left:"◀",right:"▶",play:"▶",pause:"Ⅱ",stop:"■",
  block:"█",mid:"▓",light:"░",wave:"≈",branch:"┼",tick:"✓",slash:"╱",backslash:"╲"
});
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,Math.trunc(Number(n)||0)));
const clean=(v:unknown,max:number,fallback="—")=>{const s=normalizeGlyphText(v,max).replace(/\s+/g," ").trim();return s||fallback;};
const phaseGlyph=(p:GlyphV4Phase)=>p==="LIVE"||p==="READY"?G.diamond:p==="ERROR"?G.fault:p==="OFFLINE"?G.ring:p==="BUSY"||p==="PAUSED"||p==="WARN"?G.pulse:G.hollow;
const modeGlyph=(m:GlyphV4Mode)=>({PLAYER:G.play,QUEUE:G.square,COMMAND:G.cursor,NODE:G.branch,TELEMETRY:G.pulse,SPECTRUM:G.wave,STATE:G.diamond,ERROR:G.fault}[m]);

export function glyphV4Header(mode:GlyphV4Mode,title:unknown,phase:GlyphV4Phase="READY",width=60):string{
  const w=clamp(width,30,72),inner=w-4,left=`${modeGlyph(mode)} ${mode}`,right=`${phaseGlyph(phase)} ${phase}`;
  const t=clean(title,inner-2,"NOIR MUSIC").toUpperCase();
  const gap=Math.max(1,inner-left.length-right.length);
  return `${G.tl}${G.h.repeat(w-2)}${G.tr}\n${G.v} ${left}${" ".repeat(gap)}${right} ${G.v}\n${G.ml}${G.h.repeat(w-2)}${G.mr}\n${G.v} ${G.diamond} ${t.padEnd(inner-2," ")} ${G.v}\n${G.bl}${G.h.repeat(w-2)}${G.br}`;
}

export function glyphV4Panel(lines:readonly unknown[],width=60,maxLines=14):string{
  const w=clamp(width,30,72),inner=w-6;
  const body=lines.slice(0,maxLines).map((line,i)=>`${G.v} ${i%2?G.dot:G.hollow} ${clean(line,inner-4).padEnd(inner-2," ")} ${G.v}`);
  return [`${G.tl}${G.h.repeat(w-2)}${G.tr}`,...(body.length?body:[`${G.v} ${G.ring} NO DATA`.padEnd(w-1," ")+G.v]),`${G.bl}${G.h.repeat(w-2)}${G.br}`].join("\n");
}

export function glyphV4Wordmark(label="NOIR MUSIC",width=60):string{
  const w=clamp(width,30,72),safe=clean(label,16,"NOIR MUSIC");
  const art=pixelText(safe,G.block," ",Math.min(6,Math.max(4,safe.length))).split("\n").slice(0,6);
  return glyphV4Panel(art,w,6);
}

export function glyphV4PixelWriting(lines:readonly unknown[],width=60,maxLines=12):string{
  const w=clamp(width,30,72),inner=w-12;
  return glyphV4Panel(lines.slice(0,maxLines).map((line,i)=>`${String(i+1).padStart(2,"0")} ${G.cursor} ${clean(line,inner)}`),w,maxLines);
}

export function glyphV4Rail(items:readonly string[],width=60,max=10):string{
  const rows=items.slice(0,max).map((item,i)=>`${i===0?G.diamond:G.dot} ${String(i+1).padStart(2,"0")} ${G.arrow} ${clean(item,48)}`);
  return glyphV4Panel(rows.length?rows:[`${G.ring} EMPTY RAIL`],width,max);
}

export function glyphV4Meter(value:number,width=24):string{
  const w=clamp(width,8,42),v=Math.max(0,Math.min(100,Number(value)||0)),filled=Math.round(v/100*w);
  return `${G.block.repeat(filled)}${G.light.repeat(w-filled)} ${String(Math.round(v)).padStart(3,"0")}%`;
}

export function glyphV4Timeline(position:number,duration:number,width=30):string{
  const d=Math.max(0,Number(duration)||0),p=Math.max(0,Math.min(d,Number(position)||0)),pct=d?p/d*100:0;
  const fmt=(ms:number)=>{const s=Math.floor(Math.max(0,ms)/1000),m=Math.floor(s/60),r=s%60;return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`};
  return `${fmt(p)} ${G.arrow} ${glyphV4Meter(pct,width)} ${G.arrow} ${fmt(d)}`;
}

export function glyphV4Player(opts:{title:unknown;artist:unknown;position:number;duration:number;volume:number;queue:number;state:GlyphV4Phase;source?:unknown;requester?:unknown;loop?:unknown;shuffle?:boolean;autoplay?:boolean;width?:number}):string{
  const w=clamp(opts.width??60,30,72);
  const bridge=composeGlyphRuntime({
    pipeline:{title:"PLAYER PIPELINE",width:w,activeIndex:opts.state==="IDLE"?0:2,steps:[
      {id:"queue",label:"QUEUE",phase:"ENTER",complete:opts.queue>0},
      {id:"resolve",label:"RESOLVE",phase:"FOCUS",complete:opts.state!=="IDLE"},
      {id:"play",label:"PLAY",phase:"PROCESS",active:opts.state==="LIVE"},
      {id:"pause",label:"PAUSE",phase:"REST",active:opts.state==="PAUSED"},
      {id:"idle",label:"IDLE",phase:"REST",active:opts.state==="IDLE"},
    ]},
    journey:{title:"PLAYER JOURNEY",current:opts.state==="IDLE"?"idle":opts.state==="PAUSED"?"pause":"play",width:w,nodes:[
      {id:"queue",label:"QUEUE",state:opts.queue>0?"DISCOVER":"IDLE",intent:"NAVIGATE"},
      {id:"play",label:"PLAY",state:opts.state==="LIVE"?"EXECUTE":"RESULT",intent:"ACTIVATE"},
      {id:"pause",label:"PAUSE",state:opts.state==="PAUSED"?"EXECUTE":"IDLE",intent:"ACTIVATE"},
      {id:"idle",label:"IDLE",state:"RESULT",intent:"REFRESH"},
    ]},
    surface:{title:"PLAYER FIELD",sections:[`STATE ${opts.state}`,`QUEUE ${Math.max(0,Math.trunc(opts.queue))}`,`SOURCE ${clean(opts.source,18,"AUTO")}`],actions:["PREVIOUS","PLAY/PAUSE","SKIP","QUEUE"]},
  });
  const bridgeRail=[bridge.pipeline.rail,bridge.journeyRail,...bridge.packed.sections.slice(-2)].join("\n");
  return [glyphV4Header("PLAYER",opts.title,opts.state,w),glyphV4Wordmark("NOIR MUSIC",w),glyphV4Panel([
    `${G.square} ${clean(opts.title,w-12)}`,
    `${G.arrow} ${clean(opts.artist,w-12,"UNKNOWN ARTIST")}`,
    `${G.dot} SRC ${clean(opts.source,18,"AUTO").toUpperCase()} ${G.branch} REQ ${clean(opts.requester,18,"UNKNOWN").toUpperCase()}`,
    glyphV4Timeline(opts.position,opts.duration,Math.min(30,w-30)),
    `${G.pulse} VOL ${glyphV4Meter(opts.volume,18)}`,
  ],w,7),glyphV4Panel([
    `QUEUE ${String(Math.max(0,Math.trunc(opts.queue))).padStart(2,"0")} ${G.branch} LOOP ${clean(opts.loop,10,"OFF").toUpperCase()}`,
    `SHUFFLE ${opts.shuffle?"ON":"OFF"} ${G.branch} AUTOPLAY ${opts.autoplay?"ON":"OFF"}`,
  ],w,4),`${G.lt}${G.sh.repeat(Math.max(12,w-2))}${G.rt}`,bridgeRail,`${phaseGlyph(opts.state)} ${opts.state} ${G.dot} PLAYER FIELD ${G.dot} V4 LOCK`].join("\n");
}

export function glyphV4Queue(items:readonly {title:unknown;artist?:unknown;duration?:unknown;active?:boolean}[],page:number,pages:number,total:number,width=60):string{
  const w=clamp(width,30,72),rows=items.slice(0,12).map((x,i)=>`${x.active?G.diamond:G.dot} ${String(i+1).padStart(2,"0")} ${clean(x.title,w-28)}${x.artist?` ${G.arrow} ${clean(x.artist,16)}`:""}${x.duration?` ${G.dot} ${clean(x.duration,10)}`:""}`);
  const bridge=composeGlyphRuntime({
    pipeline:{title:"QUEUE PIPELINE",width:w,activeIndex:items.length?2:0,steps:[
      {id:"queue",label:"QUEUE",phase:"ENTER",complete:total>0},
      {id:"page",label:"PAGE",phase:"FOCUS",complete:pages>0,active:true},
      {id:"render",label:"RENDER",phase:"COMMIT",complete:true},
    ]},
    journey:{title:"QUEUE JOURNEY",current:"page",width:w,nodes:[
      {id:"queue",label:"QUEUE",state:total?"RESULT":"IDLE",intent:"NAVIGATE"},
      {id:"page",label:"PAGE",state:"CONFIRM",intent:"NAVIGATE"},
      {id:"render",label:"RENDER",state:"RESULT",intent:"REFRESH"},
    ]},
    surface:{title:"QUEUE FIELD",sections:[`PAGE ${page}/${pages}`,`TOTAL ${Math.max(0,total)}`,`VISIBLE ${items.length}`],actions:rows},
  });
  return [glyphV4Header("QUEUE","QUEUE FIELD","READY",w),glyphV4Rail(rows.length?rows:[`${G.ring} QUEUE EMPTY`],w,12),glyphV4Panel([`PAGE ${page}/${pages}`,`TOTAL ${Math.max(0,total)}`,`VISIBLE ${items.length}`],w,4),bridge.pipeline.rail,bridge.journeyRail,`${G.square} QUEUE RAIL ${G.diamond} READY`].join("\n");
}

export function glyphV4Command(category:string,commands:readonly {name:string;description:string}[],page=1,width=60):string{
  const w=clamp(width,30,72),size=10,pages=Math.max(1,Math.ceil(commands.length/size)),p=Math.max(1,Math.min(pages,Math.floor(page))),start=(p-1)*size;
  const bridge=composeGlyphRuntime({
    pipeline:{title:"COMMAND PIPELINE",width:w,activeIndex:1,steps:[
      {id:"discover",label:"DISCOVER",phase:"ENTER",complete:commands.length>0},
      {id:"focus",label:"FOCUS",phase:"FOCUS",active:true},
      {id:"execute",label:"EXECUTE",phase:"PROCESS"},
      {id:"result",label:"RESULT",phase:"COMMIT"},
    ]},
    journey:{title:"COMMAND JOURNEY",current:"focus",width:w,nodes:[
      {id:"discover",label:"DISCOVER",state:"DISCOVER",intent:"NAVIGATE"},
      {id:"focus",label:"FOCUS",state:"CONFIRM",intent:"ACTIVATE"},
      {id:"execute",label:"EXECUTE",state:"EXECUTE",intent:"CONFIRM"},
      {id:"result",label:"RESULT",state:"RESULT",intent:"REFRESH"},
    ]},
    surface:{title:category,sections:[`PAGE ${p}/${pages}`,`TOTAL ${commands.length}`,`VISIBLE ${Math.min(size,Math.max(0,commands.length-start))}`],actions:commands.slice(start,start+size).map(c=>`/${c.name}`)},
    command:{name:category,category,description:"Canonical Noir Music command matrix",state:"READY",usage:commands.length,width:w},
  });
  const bridgeRail=[bridge.pipeline.rail,bridge.journeyRail,bridge.command?.hero??bridge.packed.sections.slice(-2).join("\n")].join("\n");
  const rows=commands.slice(start,start+size).map((c,i)=>`${G.cursor} ${String(start+i+1).padStart(2,"0")} ${G.arrow} /${clean(c.name,26)} ${G.dot} ${clean(c.description,Math.max(12,w-40))}`);
  return [glyphV4Header("COMMAND",category,"READY",w),glyphV4Wordmark("COMMAND FIELD",w),glyphV4Rail(rows.length?rows:[`${G.ring} NO COMMANDS`],w,10),glyphV4Panel([`MODULE ${clean(category,30,"MODULE").toUpperCase()}`,`PAGE ${p}/${pages}`,`TOTAL ${commands.length}`],w,4),bridgeRail,`${G.cursor} COMMAND MATRIX ${G.dot} PIXEL V4`].join("\n");
}

export function glyphV4Data(mode:Extract<GlyphV4Mode,"NODE"|"TELEMETRY"|"SPECTRUM"|"STATE"|"ERROR">,title:string,rows:readonly string[],phase:GlyphV4Phase="READY",width=60):string{
  const w=clamp(width,30,72);
  const bridge=composeGlyphRuntime({
    pipeline:{title:`${mode} PIPELINE`,width:w,activeIndex:phase==="ERROR"?3:1,steps:[
      {id:"input",label:"INPUT",phase:"ENTER",complete:true},
      {id:"process",label:"PROCESS",phase:"PROCESS",active:phase!=="ERROR"},
      {id:"surface",label:"SURFACE",phase:"COMMIT",complete:true},
    ]},
    journey:{title:`${mode} JOURNEY`,current:"surface",width:w,nodes:[
      {id:"input",label:"INPUT",state:"DISCOVER",intent:"NAVIGATE"},
      {id:"process",label:"PROCESS",state:phase==="ERROR"?"RECOVER":"EXECUTE",intent:"ACTIVATE"},
      {id:"surface",label:"SURFACE",state:"RESULT",intent:"REFRESH"},
    ]},
    surface:{title,sections:rows.slice(0,6),actions:[mode,"REFRESH"]},
  });
  return [glyphV4Header(mode,title,phase,w),glyphV4PixelWriting(rows,w,12),glyphV4Meter(rows.length?Math.min(100,rows.length/12*100):0,22),bridge.pipeline.rail,bridge.journeyRail,`${modeGlyph(mode)} ${phase} ${G.arrow} ${clean(title,36).toUpperCase()}`,`${G.hollow} GLYPH FIELD ${G.branch} PIXEL FIELD ${G.branch} DATA SURFACE LOCK`].join("\n");
}

export function glyphV4Spectrum(values:readonly number[],title="SIGNAL SPECTRUM",width=60):string{
  const vals=values.slice(0,24).map(v=>Math.max(0,Math.min(100,Number(v)||0)));
  const rows=vals.map((v,i)=>`${String(i+1).padStart(2,"0")} ${G.wave} ${glyphV4Meter(v,Math.max(8,Math.min(28,width-34)))}`);
  return glyphV4Data("SPECTRUM",title,rows,"LIVE",width);
}

export function glyphV4Footer(mode:GlyphV4Mode,code?:unknown):string{
  const suffix=code===undefined?"":` ${G.dot} ${clean(code,18).toUpperCase()}`;
  return `${G.h.repeat(3)} ${modeGlyph(mode)} NOIR MUSIC ${G.branch} GLYPH MATRIX SUPREME ${G.branch} PIXEL MATRIX${suffix} ${G.h.repeat(3)}`;
}

export function glyphV4Action(label:unknown,index=0):string{
  const marks=[G.diamond,G.square,G.cursor,G.pulse,G.hollow,G.arrow,G.branch,G.wave,G.fault,G.play];
  return `${marks[Math.abs(index)%marks.length]} ${clean(label,48,"ACTION").toUpperCase()}`.slice(0,80);
}


/** Canonical V3 API compatibility surface. All rendering delegates to the V4 engine. */
export type GlyphSurface = GlyphV4Mode;
export type GlyphPhase = GlyphV4Phase;
export function glyphV3Header(surface: GlyphSurface, title: unknown, phase: GlyphPhase = "READY", width = 58): string { return glyphV4Header(surface, title, phase, width); }
export function glyphV3Frame(lines: readonly unknown[], width = 58, maxLines = 14): string { return glyphV4Panel(lines, width, maxLines); }
export function glyphV3Split(width = 58, glyph = "·"): string { return glyph.repeat(Math.max(1, Math.min(width, 120))); }
export function glyphV3Rail(items: readonly string[], width = 58): string { return glyphV4Rail(items, width); }
export function glyphV3Meter(value: number, width = 28): string { return glyphV4Meter(value, width); }
export function glyphV3Timeline(position: number, duration: number, width = 34): string { return glyphV4Timeline(position, duration, width); }
export function glyphV3Wordmark(label = "NOIR MUSIC", width = 54): string { return glyphV4Wordmark(label, width); }
export function glyphV3PixelWriting(lines: readonly unknown[], width = 58, maxLines = 12): string { return glyphV4PixelWriting(lines, width, maxLines); }
export function glyphV3StatusGrid(rows: readonly {label: unknown; value: unknown; phase?: GlyphPhase}[], width = 58): string { return glyphV4Data("STATE", "STATUS", rows.map(r => `${String(r.label)} ${String(r.value)}`), "READY", width); }
export function glyphV3PlayerSurface(opts: {title: unknown; artist: unknown; source?: unknown; state: GlyphPhase; position: number; duration: number; volume: number; queue: number; loop?: unknown; shuffle?: boolean; autoplay?: boolean; requester?: unknown; width?: number}): string { return glyphV4Player({...opts, width: opts.width ?? 58}); }
export function glyphV3QueueSurface(items: readonly {title: unknown; artist?: unknown; duration?: unknown; active?: boolean}[], page: number, pages: number, total: number, width = 58): string { return glyphV4Queue(items, page, pages, total, width); }
export function glyphV3CommandSurface(category: string, commands: readonly {name: string; description: string}[], page = 1, width = 58): string { return glyphV4Command(category, commands, page, width); }
export function glyphV3ControlSurface(title: string, rows: readonly string[], phase: GlyphPhase = "READY", width = 58): string { return glyphV4Data("STATE", title, rows, phase, width); }
export function glyphV3Footer(surface: GlyphSurface, code?: unknown): string { return glyphV4Footer(surface, code); }
export function glyphV3ActionLabel(label: unknown, index = 0): string { return glyphV4Action(label, index); }

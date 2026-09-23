/** NOIR MUSIC PIXEL / GLYPH MATRIX ENGINE — deterministic Discord-safe graphics. */
const FONT: Record<string, string[]> = {
  A:["01110","10001","11111","10001","10001"],B:["11110","10001","11110","10001","11110"],C:["01111","10000","10000","10000","01111"],D:["11110","10001","10001","10001","11110"],E:["11111","10000","11110","10000","11111"],F:["11111","10000","11110","10000","10000"],G:["01111","10000","10111","10001","01111"],H:["10001","10001","11111","10001","10001"],I:["11111","00100","00100","00100","11111"],J:["00111","00010","00010","10010","01100"],K:["10001","10010","11100","10010","10001"],L:["10000","10000","10000","10000","11111"],M:["10001","11011","10101","10001","10001"],N:["10001","11001","10101","10011","10001"],O:["01110","10001","10001","10001","01110"],P:["11110","10001","11110","10000","10000"],Q:["01110","10001","10101","10010","01101"],R:["11110","10001","11110","10010","10001"],S:["01111","10000","01110","00001","11110"],T:["11111","00100","00100","00100","00100"],U:["10001","10001","10001","10001","01110"],V:["10001","10001","10001","01010","00100"],W:["10001","10001","10101","11011","10001"],X:["10001","01010","00100","01010","10001"],Y:["10001","01010","00100","00100","00100"],Z:["11111","00010","00100","01000","11111"],
  "0":["01110","10011","10101","11001","01110"],"1":["00100","01100","00100","00100","01110"],"2":["01110","10001","00010","00100","11111"],"3":["11110","00001","01110","00001","11110"],"4":["00010","00110","01010","11111","00010"],"5":["11111","10000","11110","00001","11110"],"6":["01110","10000","11110","10001","01110"],"7":["11111","00010","00100","01000","01000"],"8":["01110","10001","01110","10001","01110"],"9":["01110","10001","01111","00001","01110"],
  ".":["00000","00000","00000","00000","00100"],"/":["00001","00010","00100","01000","10000"],"-":["00000","00000","11111","00000","00000"],":":["00000","00100","00000","00100","00000"],"_":["00000","00000","00000","00000","11111"],"?":["11110","00001","00110","00000","00100"],"!":["00100","00100","00100","00000","00100"]
};

export function normalizeGlyphText(value: unknown, maxChars = 18): string {
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9.\/:_\-!? ]/g, " ").slice(0, Math.max(1, maxChars));
}

export function pixelText(value: string, on = "█", off = " ", maxChars = 14): string {
  const text = normalizeGlyphText(value, maxChars);
  const rows = Array.from({ length: 5 }, () => "");
  for (const char of text) {
    const glyph = FONT[char] ?? ["00000","00000","00000","00000","00000"];
    for (let row = 0; row < 5; row++) rows[row] += glyph[row].replace(/0/g, off).replace(/1/g, on) + off;
  }
  return rows.join("\n");
}

export function matrix(width = 12, height = 5, fill = "·", seed = 0): string {
  const w = Math.max(4, Math.min(32, Math.floor(width))); const h = Math.max(2, Math.min(12, Math.floor(height)));
  let state = (Number(seed) >>> 0) || 0x6d6f6e6f;
  const next = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return state >>> 0; };
  return Array.from({length:h},()=>Array.from({length:w},()=>{const n=next()%17;return n===0?"▣":n<4?"·":fill;}).join(" ")).join("\n");
}

export function pixelMeter(value: number, width = 16): string {
  const w = Math.max(4, Math.min(40, Math.floor(width))); const v = Math.max(0, Math.min(100, Number(value)||0)); const filled=Math.round((v/100)*w);
  return `${"█".repeat(filled)}${"░".repeat(w-filled)} ${Math.round(v)}%`;
}

export function pixelFrame(width = 24, height = 3, glyph = "·"): string {
  const w=Math.max(4,Math.min(80,Math.floor(width))); const h=Math.max(3,Math.min(10,Math.floor(height))); const inner=Math.max(0,w-2);
  return [`┌${"─".repeat(inner)}┐`,...Array.from({length:h-2},()=>`│${glyph.repeat(inner)}│`),`└${"─".repeat(inner)}┘`].join("\n");
}

export function pixelBadge(label: string, value: string, max = 42): string {
  const clean=normalizeGlyphText(label,18); const data=normalizeGlyphText(value,24); return `[ ${clean.padEnd(18," ")} ] ${data}`.slice(0,Math.max(1,max));
}
export function pixelStatus(ok:boolean,label:string):string { return `${ok?"●":"○"} ${normalizeGlyphText(label,48)}`; }
export function pixelHeader(title:string, seed=0):string { return `${pixelText(title,"█"," ",16)}\n${matrix(16,2,"·",seed)}`; }
export function pixelGrid(values: readonly number[], width=12):string { return values.slice(0,width*4).map((v,i)=>`${String(i+1).padStart(2,"0")} ${pixelMeter(v,Math.max(4,width-5))}`).join("\n"); }
export function pixelSpark(values: readonly number[], width=24):string {
  const glyphs="▁▂▃▄▅▆▇█"; const clean=values.filter(Number.isFinite).slice(-Math.max(4,width)); if(!clean.length)return "";
  const min=Math.min(...clean), max=Math.max(...clean), span=max-min||1; return clean.map(v=>glyphs[Math.max(0,Math.min(glyphs.length-1,Math.round(((v-min)/span)*(glyphs.length-1))))]).join("");
}

/**
 * Builds a compact, deterministic multi-row telemetry strip. Values are
 * normalized before rendering so arbitrary runtime state cannot overflow a
 * Discord embed or introduce control characters into the visual layer.
 */
export function pixelTelemetry(values: { label: string; value: number; max?: number }[], width = 18): string {
  return values.slice(0, 8).map((item) => {
    const max = Math.max(1, Number(item.max) || 100);
    const percent = Math.max(0, Math.min(100, ((Number(item.value) || 0) / max) * 100));
    return `${normalizeGlyphText(item.label, 10).padEnd(10, " ")} ${pixelMeter(percent, width)}`;
  }).join("\n");
}

/** A fixed-width status line used by player, queue, node and system panels. */
export function pixelStatusLine(label: string, state: "OK" | "WARN" | "ERROR" | "OFFLINE" | "BUSY", detail = ""): string {
  const mark = state === "OK" ? "●" : state === "WARN" || state === "BUSY" ? "◐" : "○";
  return `${mark} ${normalizeGlyphText(label, 14).padEnd(14, " ")} ${normalizeGlyphText(state, 8).padEnd(8, " ")} ${normalizeGlyphText(detail, 32)}`;
}

/** Pixel-writing utilities for large, readable monospace surfaces. */
export function pixelBanner(value: string, width = 24): string {
  const text = normalizeGlyphText(value, 16);
  const art = pixelText(text, "█", " ", 16).split("\n");
  const w = Math.max(12, Math.min(80, Math.floor(width)));
  return art.map((row) => row.slice(0, w).padStart(Math.max(0, Math.floor((w - row.length) / 2) + row.length), " ")).join("\n");
}

export function pixelTimeline(position: number, duration: number, width = 28): string {
  const w = Math.max(8, Math.min(48, Math.floor(width)));
  const d = Math.max(0, Number(duration) || 0);
  const p = Math.max(0, Math.min(d || Number.MAX_SAFE_INTEGER, Number(position) || 0));
  const ratio = d ? p / d : 0;
  const cursor = Math.max(0, Math.min(w - 1, Math.round(ratio * (w - 1))));
  return Array.from({ length: w }, (_, i) => i === cursor ? "◆" : i < cursor ? "━" : "─").join("");
}

export function pixelWave(values: readonly number[], width = 32, height = 5): string {
  const w = Math.max(8, Math.min(64, Math.floor(width)));
  const h = Math.max(3, Math.min(9, Math.floor(height)));
  const source = values.filter(Number.isFinite).slice(-w);
  if (!source.length) return "·".repeat(w);
  const max = Math.max(...source.map((v) => Math.abs(v))) || 1;
  const rows = Array.from({ length: h }, () => Array.from({ length: w }, () => " "));
  source.forEach((value, x) => {
    const normalized = Math.max(-1, Math.min(1, value / max));
    const y = Math.max(0, Math.min(h - 1, Math.round(((1 - normalized) / 2) * (h - 1))));
    rows[y][x] = "█";
  });
  return rows.map((row) => row.join("")) .join("\n");
}

export function pixelDots(value: number, width = 16): string {
  const w = Math.max(4, Math.min(40, Math.floor(width)));
  const n = Math.max(0, Math.min(w, Math.round((Number(value) || 0) / 100 * w)));
  return `${"●".repeat(n)}${"·".repeat(w - n)}`;
}

export function pixelCode(value: unknown, width = 12): string {
  let state = 0x4d4f4e4f;
  for (const char of String(value ?? "")) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  return state.toString(16).toUpperCase().padStart(8, "0").slice(0, Math.max(4, Math.min(16, width)));
}

/** Dense multi-line pixel typography with deterministic width control. */
export function pixelParagraph(value: unknown, width = 42, maxLines = 6): string {
  const clean = normalizeGlyphText(value, 512).trim();
  const w = Math.max(8, Math.min(72, Math.floor(width)));
  const words = clean.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > w && current) { lines.push(current); current = word.slice(0, w); }
    else current = next.slice(0, w);
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.join("\n");
}

export function pixelBadgeRow(items: readonly { label: string; value: unknown; state?: "ON" | "OFF" | "WARN" }[], width = 48): string {
  const w = Math.max(24, Math.min(80, Math.floor(width)));
  const rows = items.slice(0, 6).map((item) => {
    const mark = item.state === "OFF" ? "○" : item.state === "WARN" ? "◐" : "●";
    return `${mark} ${normalizeGlyphText(item.label, 12).padEnd(12, " ")} ${normalizeGlyphText(item.value, 24)}`;
  });
  return rows.map((row) => row.slice(0, w)).join("\n");
}

export function pixelTicker(items: readonly unknown[], width = 42, offset = 0): string {
  const source = items.map((item) => normalizeGlyphText(item, 40)).filter(Boolean).join("   ◆   ");
  if (!source) return "";
  const w = Math.max(12, Math.min(96, Math.floor(width)));
  const doubled = `${source}   ◆   ${source}`;
  const start = ((Math.trunc(offset) % source.length) + source.length) % source.length;
  return doubled.slice(start, start + w).padEnd(w, " ");
}

export function pixelPulse(frame = 0, width = 24): string {
  const w = Math.max(8, Math.min(64, Math.floor(width)));
  const phase = Math.abs(Math.trunc(frame)) % 4;
  const glyphs = ["·", "▪", "■", "▪"];
  return Array.from({ length: w }, (_, i) => glyphs[(i + phase) % glyphs.length]).join("");
}

export function pixelClock(seconds: number): string {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor(total % 3600 / 60);
  const s = total % 60;
  return h ? `${String(h).padStart(2, "0")}·${String(m).padStart(2, "0")}·${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}·${String(s).padStart(2, "0")}`;
}

/** GLYPH-13: deterministic binary-style rail used for visual rhythm. */
export function pixelBinary(value: unknown, width = 24): string {
  const w = Math.max(8, Math.min(64, Math.floor(width)));
  let hash = 2166136261 >>> 0;
  for (const char of String(value ?? "")) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return Array.from({ length: w }, (_, i) => ((hash >>> (i % 24)) & 1) ? "█" : "·").join("");
}

export function pixelFramePanel(title: string, lines: readonly unknown[], width = 48, tone: "BLACK" | "PANEL" | "DENSE" | "OPERATOR" = "PANEL"): string {
  const border = tone === "OPERATOR" ? "═" : tone === "DENSE" ? "┄" : "─";
  const w = Math.max(18, Math.min(76, Math.floor(width)));
  const cleanTitle = normalizeGlyphText(title, Math.max(4, w - 6)).toUpperCase();
  const top = `┌─ ${cleanTitle} ${border.repeat(Math.max(2, w - cleanTitle.length - 4))}┐`;
  const body = lines.slice(0, 14).map((line) => `│ ${normalizeGlyphText(line, Math.max(4, w - 4)).padEnd(Math.max(0, w - 2), " ")} │`);
  return [top, ...body, `└${border.repeat(w)}┘`].join("\n");
}

export function pixelGridMeter(values: readonly number[], width = 24, height = 4): string {
  const w = Math.max(8, Math.min(48, Math.floor(width)));
  const h = Math.max(2, Math.min(8, Math.floor(height)));
  const source = values.filter(Number.isFinite).slice(-w);
  if (!source.length) return Array.from({ length: h }, () => "·".repeat(w)).join("\n");
  const max = Math.max(...source.map((v) => Math.abs(v)), 1);
  return Array.from({ length: h }, (_, row) => {
    const threshold = 1 - row / Math.max(1, h - 1);
    return Array.from({ length: w }, (_, col) => {
      const v = Math.abs(source[col] ?? 0) / max;
      return v >= threshold ? "█" : v >= threshold - 0.22 ? "▪" : "·";
    }).join("");
  }).join("\n");
}

export function pixelHash(value: unknown, width = 10): string {
  let hash = 0x811c9dc5;
  for (const char of String(value ?? "")) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash.toString(36).toUpperCase().padStart(width, "0").slice(0, Math.max(4, Math.min(16, width)));
}

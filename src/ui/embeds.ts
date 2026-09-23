import { EmbedBuilder } from "discord.js";
import { matrix, pixelMeter, pixelText } from "./pixel";
import { glyphV3Header, glyphV3Frame, glyphV3PlayerSurface, glyphV3QueueSurface, glyphV3CommandSurface, glyphV3StatusGrid, glyphV3ControlSurface, glyphV3Footer, glyphV3Meter } from "./glyphInterface";
import { fitDescription, uiText } from "./surface";

/** NOIR MUSIC GLYPH-09 — original monochrome/pixel interface system. */
export const MONO = Object.freeze({
  black: 0x050505, panel: 0x101010, panel2: 0x171717, soft: 0x242424, white: 0xf4f4f4,
  muted: 0xa4a4a4, glyph: "▣", on: "●", off: "○", arrow: "›", divider: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  footer: "NOIR MUSIC // GLYPH SYSTEM · PIXEL-09 · AUDIO CORE",
});

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const clean = (v: unknown, fallback = "—", max = 1024) => uiText(v, fallback, max);
const fmt = (ms: number): string => { const sec = Math.max(0, Math.floor((Number(ms) || 0) / 1000)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`; };

export function monoEmbed(accent: number = MONO.panel): EmbedBuilder { return new EmbedBuilder().setColor(accent).setTimestamp().setFooter({ text: MONO.footer }); }

export function glyphPanel(lines: string[], width = 38): string {
  const w = clamp(Math.floor(width), 12, 54);
  const body = lines.slice(0, 14).map((line) => { const text = clean(line, "", w); return `│ ${text.padEnd(w, " ")} │`; });
  return [`┌${"─".repeat(w + 2)}┐`, ...body, `└${"─".repeat(w + 2)}┘`].join("\n");
}

export function glyphHeader(label: string, state = "ONLINE") { return `${MONO.divider}\n${MONO.glyph}  ${clean(label).toUpperCase()}  ·  ${clean(state).toUpperCase()}\n${MONO.divider}`; }
export function progressBar(positionMs: number, durationMs: number, width = 22) { const d = Math.max(0, Number(durationMs) || 0), p = clamp(Number(positionMs) || 0, 0, d || Number.MAX_SAFE_INTEGER), w = clamp(Math.floor(width), 8, 40), filled = d ? Math.round((p / d) * w) : 0; return `${fmt(p)}  ${"▰".repeat(filled)}${"▱".repeat(w - filled)}  ${fmt(d)}`; }

export function nowPlayingEmbed(opts: { title: string; artist: string; album?: string; artworkUrl?: string; positionMs: number; durationMs: number; volume: number; loop: "off" | "track" | "queue"; shuffle: boolean; autoplay: boolean; queuePosition: number; requester: string; paused?: boolean; source?: string; }) {
  const state = opts.paused ? "PAUSED" : "PLAYING";
  const visual = glyphV3PlayerSurface({ title: opts.title, artist: opts.artist, source: opts.source, state: state === "PAUSED" ? "PAUSED" : "LIVE", position: opts.positionMs, duration: opts.durationMs, volume: opts.volume, queue: opts.queuePosition, loop: opts.loop, shuffle: opts.shuffle, autoplay: opts.autoplay, requester: opts.requester, width: 58 });
  const albumLine = opts.album ? `\n${glyphV3Frame([`◇ ALBUM ${clean(opts.album, "—", 46)}`], 58, 2)}` : "";
  return monoEmbed(MONO.black).setAuthor({ name: `${MONO.glyph} NOIR MUSIC / PLAYER FIELD · ${state}` }).setTitle(clean(opts.title, "UNTITLED TRACK", 256)).setDescription(fitDescription(`${visual}${albumLine}`)).setThumbnail(opts.artworkUrl ?? null).setFooter({ text: glyphV3Footer("PLAYER", state) });
}

export function systemDashboard(opts: { guild: string; connected: boolean; playing: boolean; paused: boolean; queueSize: number; volume: number; effects: boolean; autoplay: boolean; source: string; }) {
  const state = opts.playing ? (opts.paused ? "PAUSED" : "PLAYING") : "IDLE";
  const phase = opts.connected ? (opts.playing ? (opts.paused ? "PAUSED" : "LIVE") : "READY") : "OFFLINE";
  const body = glyphV3ControlSurface(opts.guild, [
    `VOICE ${opts.connected ? "CONNECTED" : "OFFLINE"}`,
    `PLAYER ${state}`,
    `QUEUE ${Math.max(0,opts.queueSize)} TRACK(S)`,
    `VOLUME ${glyphV3Meter(opts.volume,18)}`,
    `EFFECTS ${opts.effects ? "ENABLED" : "DISABLED"}`,
    `AUTOPLAY ${opts.autoplay ? "ENABLED" : "DISABLED"}`,
    `SOURCE ${clean(opts.source,"AUTO",32).toUpperCase()}`,
  ], phase === "OFFLINE" ? "OFFLINE" : phase === "PAUSED" ? "PAUSED" : phase === "LIVE" ? "LIVE" : "READY", 58);
  return monoEmbed(MONO.black).setAuthor({ name: `${MONO.glyph} NOIR MUSIC / CONTROL FIELD · LIVE` }).setTitle(clean(opts.guild,"SERVER",256)).setDescription(fitDescription(body)).setFooter({text:glyphV3Footer("STATE",state)});
}

export function commandMatrixEmbed(categories: string[], total: number) {
  const commands = categories.slice(0,15).map((c) => ({ name: c.toUpperCase(), description: "OPEN MODULE" }));
  return monoEmbed(MONO.black).setAuthor({ name: `${MONO.glyph} NOIR MUSIC / COMMAND FIELD · GLYPH V3` }).setTitle("COMMAND MATRIX // PIXEL FIELD").setDescription(fitDescription(glyphV3CommandSurface("COMMAND MATRIX", commands, 1, 58))).setFooter({ text: glyphV3Footer("COMMAND", `${total} COMMANDS`) });
}

export function queueEmbed(title: string, tracks: Array<{ title: string; artist?: string; duration?: number }>, page = 1, pageSize = 10, total = tracks.length) {
  return queueMatrixEmbed(tracks, page, pageSize, total).setTitle(clean(title, "QUEUE", 256));
}

export function queueMatrixEmbed(tracks: Array<{ title: string; artist?: string; duration?: number }>, page = 1, pageSize = 10, total = tracks.length) {
  const safeSize = Math.max(1, Math.min(20, Math.floor(pageSize)));
  const pages = Math.max(1, Math.ceil(Math.max(0, total) / safeSize));
  const safePage = Math.max(1, Math.min(pages, Math.floor(page)));
  const start = (safePage-1)*safeSize;
  const shown = tracks.slice(start, start + safeSize);
  const visual = glyphV3QueueSurface(shown.map((t,i)=>({title:t.title,artist:t.artist,duration:t.duration,active:i===0 && safePage===1})),safePage,pages,total,58);
  return monoEmbed(MONO.panel).setTitle(`${MONO.glyph} QUEUE / GLYPH V3 RAIL`).setDescription(fitDescription(`${visual}\n${glyphV3StatusGrid([{label:"RANGE",value:`${start+1}-${Math.min(start+safeSize,total)}`},{label:"DENSITY",value:glyphV3Meter(total?shown.length/Math.min(total,safeSize)*100:0,18)}],58)}`)).setFooter({text:glyphV3Footer("QUEUE",`${safePage}/${pages}`)});
}

export function helpEmbed(category: string, commands: Array<{ name: string; description: string }>) {
  const body = glyphV3CommandSurface(category, commands, 1, 58);
  return monoEmbed(MONO.panel).setAuthor({ name: `${MONO.glyph} NOIR MUSIC / HELP FIELD · GLYPH V3` }).setTitle(clean(category,"MODULE").toUpperCase()).setDescription(fitDescription(body)).setFooter({text:glyphV3Footer("COMMAND",`${commands.length} COMMANDS`)});
}

export function errorEmbed(title: string, body: string, code: string) { const safe=clean(code,"UNKNOWN",32).toUpperCase(); return monoEmbed(MONO.black).setAuthor({name:`${MONO.glyph} NOIR MUSIC / ERROR FIELD`}).setTitle(`FAULT // ${clean(title).toUpperCase()}`).setDescription(fitDescription(glyphV3ControlSurface(title,[`STATUS ERROR`,`DETAIL ${clean(body,"Unknown error",280)}`,`CODE ERR/${safe}`],"ERROR",58))).setFooter({text:glyphV3Footer("ERROR",safe)}); }

export function statusEmbed(label: string, signal: string = MONO.on) { return monoEmbed(MONO.black).setAuthor({name:`${MONO.glyph} NOIR MUSIC / STATUS FIELD`}).setDescription(fitDescription(glyphV3ControlSurface("SYSTEM STATUS",[`STATUS ${clean(label).toUpperCase()}`,`SIGNAL ${clean(signal)}`],"READY",58))).setFooter({text:glyphV3Footer("STATE")}); }

export function listEmbed(title: string, lines: string[], meta?: string) { return monoEmbed(MONO.panel).setTitle(`${MONO.glyph} ${clean(title).toUpperCase()} // PIXEL FIELD`).setDescription(fitDescription(glyphV3Frame([`${MONO.glyph} ${clean(title,"LIST",40).toUpperCase()}`,...(lines.length?lines.slice(0,22):["NO RECORDS AVAILABLE."]),...(meta?[`META ${clean(meta,"",180)}`]:[])],58,26))).setFooter({text:glyphV3Footer("STATE",`${lines.length} ROWS`)}); }

/** Enterprise telemetry panel: bounded, monochrome and deterministic. */
export function telemetryEmbed(opts: {
  title: string;
  status: string;
  metrics: Array<{ label: string; value: string | number; ok?: boolean }>;
  footer?: string;
}) {
  const rows = opts.metrics.slice(0, 12).map((m) => `${m.ok === undefined ? "◆" : m.ok ? MONO.on : MONO.off} ${clean(m.label, "METRIC", 22).toUpperCase().padEnd(22, " ")} ${clean(m.value, "—", 80)}`);
  return monoEmbed(MONO.panel).setAuthor({ name: `${MONO.glyph} NOIR MUSIC / TELEMETRY MATRIX` }).setTitle(clean(opts.title, "TELEMETRY", 256)).setDescription(fitDescription([
    glyphHeader("SYSTEM TELEMETRY", opts.status),
    glyphPanel(rows.length ? rows : ["NO TELEMETRY AVAILABLE"], 48),
    "",
    `\`${matrix(18, 3, "·", rows.length + String(opts.title).length)}\``,
  ].join("\n"))).setFooter({ text: clean(opts.footer ?? MONO.footer, MONO.footer, 2048) });
}

/** A high-density command-health panel intended for operators and diagnostics. */
export function commandHealthEmbed(opts: { count: number; topLevel: number; remaining: number; categories: number; aliases: number; fingerprint: string }) {
  const pressure = opts.remaining <= 10 ? "WARN" : "NOMINAL";
  return telemetryEmbed({
    title: "COMMAND CORE HEALTH",
    status: pressure,
    metrics: [
      { label: "COMMANDS", value: opts.count, ok: opts.count >= 300 },
      { label: "TOP LEVEL", value: `${opts.topLevel}/100`, ok: opts.topLevel < 100 },
      { label: "REMAINING", value: opts.remaining, ok: opts.remaining >= 10 },
      { label: "MODULES", value: opts.categories, ok: opts.categories > 0 },
      { label: "ALIASES", value: opts.aliases, ok: true },
      { label: "FINGERPRINT", value: opts.fingerprint, ok: true },
    ],
    footer: "NOIR MUSIC // COMMAND CORE · V8 ENTERPRISE MATRIX",
  });
}

/** GLYPH-09 PLAYER COMMAND DECK: identity → timeline → telemetry → signal field. */
export function ultraPlayerEmbed(opts: { title: string; artist: string; album?: string; positionMs: number; durationMs: number; volume: number; queueSize: number; state?: "PLAYING" | "PAUSED" | "IDLE"; source?: string; requester?: string; artworkUrl?: string; }) {
  const state = opts.state ?? "PLAYING";
  const safeTitle = clean(opts.title, "UNTITLED TRACK", 256);
  const percent = opts.durationMs ? Math.max(0, Math.min(100, opts.positionMs / opts.durationMs * 100)) : 0;
  const telemetry = [
    `CORE      ${stateGlyphForEmbed(state)} ${state}`,
    `QUEUE     ${Math.max(0, Math.floor(opts.queueSize))} TRACK(S)`,
    `VOLUME    ${pixelMeter(opts.volume, 18)}`,
    `SOURCE    ${clean(opts.source, "AUTO", 24).toUpperCase()}`,
    `REQUEST   ${clean(opts.requester, "UNKNOWN", 30)}`,
  ];
  const visual = [
    glyphHeader("GLYPH-09 / PLAYER DECK", state),
    "```", pixelText("NOIR MUSIC", "█", " ", 4), "```",
    `▣ ${safeTitle}`,
    `   ${clean(opts.artist, "UNKNOWN ARTIST", 100)}${opts.album ? ` · ${clean(opts.album, "", 70)}` : ""}`,
    "", progressBar(opts.positionMs, opts.durationMs, 28),
    `${Math.round(percent).toString().padStart(3, " ")}%  ${"◆".repeat(Math.max(1, Math.round(percent / 10)))}${"·".repeat(Math.max(0, 10 - Math.round(percent / 10)))}`,
    "", glyphPanel(telemetry, 48), "", matrix(18, 3, "·", Math.round(percent) + opts.queueSize),
  ].join("\n");
  return monoEmbed(MONO.black).setAuthor({ name: `${MONO.glyph} NOIR MUSIC / GLYPH-09 PLAYER DECK` }).setTitle(safeTitle).setDescription(fitDescription(visual)).setThumbnail(opts.artworkUrl ?? null).setFooter({ text: "NOIR MUSIC // GLYPH-09 · PIXEL AUDIO DECK · VISUAL CORE" });
}

function stateGlyphForEmbed(state: string): string { return state === "PLAYING" ? MONO.on : state === "PAUSED" ? "◐" : MONO.off; }

/** High-density queue wall with a visual index rail and page telemetry. */
export function ultraQueueEmbed(tracks: Array<{ title: string; artist?: string; duration?: number }>, opts: { page?: number; pageSize?: number; total?: number; seed?: number } = {}) {
  const size = Math.max(1, Math.min(15, Math.floor(opts.pageSize ?? 8)));
  const total = Math.max(0, Math.floor(opts.total ?? tracks.length));
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.max(1, Math.min(pages, Math.floor(opts.page ?? 1)));
  const start = (page - 1) * size;
  const shown = tracks.slice(0, size);
  const lines = shown.map((track, i) => {
    const n = String(start + i + 1).padStart(2, "0");
    const title = clean(track.title, "UNTITLED", 36);
    const artist = track.artist ? ` · ${clean(track.artist, "", 18)}` : "";
    const duration = track.duration ? ` [${fmt(track.duration)}]` : "";
    return `${n} ${i === 0 && page === 1 ? "◆" : "·"} ${title}${artist}${duration}`;
  });
  const visual = [
    glyphHeader("QUEUE / PIXEL RAIL", shown.length ? "ONLINE" : "IDLE"),
    glyphPanel(lines.length ? lines : ["QUEUE EMPTY", "ADD A TRACK TO INITIALIZE THE RAIL"], 52),
    sectionLine("QUEUE TELEMETRY"), `PAGE      ${page}/${pages}`, `VISIBLE   ${shown.length}/${total}`,
    `DENSITY   ${pixelMeter(total ? shown.length / Math.min(total, size) * 100 : 0, 16)}`,
    "", matrix(20, 3, "·", opts.seed ?? total + page),
  ].join("\n");
  return monoEmbed(MONO.panel).setAuthor({ name: `${MONO.glyph} NOIR MUSIC / QUEUE MATRIX · GLYPH-09` }).setTitle("QUEUE // PIXEL RAIL").setDescription(fitDescription(visual)).setFooter({ text: `NOIR MUSIC // QUEUE ${page}/${pages} · GLYPH-09 PIXEL MATRIX` });
}

function sectionLine(label: string): string { const text = clean(label, "SECTION", 24).toUpperCase(); return `┄─ ${text} ${"─".repeat(Math.max(2, 42 - text.length))}┄`; }

/** Reusable command-browser wall: readable first, dense second, decorative third. */
export function ultraCommandBrowser(category: string, commands: Array<{ name: string; description: string }>, page = 1) {
  const pageSize = 12;
  const pages = Math.max(1, Math.ceil(commands.length / pageSize));
  const current = Math.max(1, Math.min(pages, Math.floor(page)));
  const start = (current - 1) * pageSize;
  const shown = commands.slice(start, start + pageSize);
  const rows = shown.map((command, index) => `${String(start + index + 1).padStart(2, "0")} ${MONO.arrow} /${clean(command.name, "command", 48)}\n    ${clean(command.description, "NO DESCRIPTION", 96)}`);
  return monoEmbed(MONO.panel2).setAuthor({ name: `${MONO.glyph} NOIR MUSIC / COMMAND EXPLORER · GLYPH-09` }).setTitle(`${clean(category, "MODULE", 64).toUpperCase()} // COMMAND WALL`).setDescription(fitDescription([
    "```", pixelText("CORE", "█", " ", 4), "```",
    glyphPanel([`MODULE    ${clean(category, "MODULE", 32).toUpperCase()}`, `COMMANDS  ${commands.length}`, `PAGE      ${current}/${pages}`, `SIGNAL    ${MONO.on} READY`], 46),
    "", sectionLine("COMMAND INDEX"), rows.join("\n\n") || "NO COMMANDS REGISTERED.", "", matrix(16, 2, "·", commands.length + current),
  ].join("\n"))).setFooter({ text: `NOIR MUSIC // COMMAND EXPLORER · ${current}/${pages} · GLYPH-09` });
}

/** Operator-grade status wall for diagnostics and high-signal system surfaces. */
export function ultraStatusWall(opts: { title: string; status: string; rows: Array<{ label: string; value: string | number; ok?: boolean }>; seed?: number }) {
  const rows = opts.rows.slice(0, 14).map((row) => `${row.ok === undefined ? "◆" : row.ok ? "●" : "○"} ${clean(row.label, "METRIC", 18).padEnd(18, " ")} ${clean(row.value, "—", 54)}`);
  const body = [glyphHeader(opts.title, opts.status), glyphPanel(rows.length ? rows : ["NO TELEMETRY AVAILABLE"], 50), "", sectionLine("SIGNAL FIELD"), matrix(22, 4, "·", opts.seed ?? rows.length), "", `FRAME  ${MONO.on} LOCKED · DENSITY  ${pixelMeter(Math.min(100, rows.length / 14 * 100), 14)}`].join("\n");
  return monoEmbed(MONO.black).setAuthor({ name: `${MONO.glyph} NOIR MUSIC / OPERATOR WALL · GLYPH-09` }).setTitle(clean(opts.title, "STATUS", 256)).setDescription(fitDescription(body)).setFooter({ text: "NOIR MUSIC // GLYPH-09 · OPERATOR VISUAL CORE" });
}

import { hudMetricDeck, hudNodeDeck, hudQueueDeck, hudSpectrum, hudTrackDeck } from "./hud";

/** GLYPH-10 / ULTRA HUD — reusable high-density embed surfaces. */
export function glyph10PlayerEmbed(opts: { title: string; artist?: string; positionMs: number; durationMs: number; volume: number; queue: number; latency?: number; state?: string; source?: string; artworkUrl?: string }) {
  const body = hudTrackDeck(opts, { width: 58, seed: Math.floor(opts.positionMs / 1000) });
  return monoEmbed(MONO.panel).setAuthor({ name: "▣ NOIR MUSIC / GLYPH-10 · PLAYER HUD" }).setTitle("NOW PLAYING // PIXEL DECK").setDescription(fitDescription(body)).setThumbnail(opts.artworkUrl ?? null).setFooter({ text: "NOIR MUSIC // GLYPH-10 · PIXEL HUD · AUDIO SURFACE" });
}

export function glyph10QueueEmbed(items: readonly { title: string; artist?: string; durationMs?: number }[], page = 1, pageSize = 8) {
  return monoEmbed(MONO.panel2).setAuthor({ name: "▣ NOIR MUSIC / GLYPH-10 · QUEUE HUD" }).setTitle("QUEUE // PIXEL RAIL").setDescription(fitDescription(hudQueueDeck(items, { page, pageSize, width: 58 }))).setFooter({ text: `NOIR MUSIC // QUEUE HUD · ${page} · GLYPH-10` });
}

export function glyph10NodeEmbed(nodes: readonly { name: string; latencyMs?: number; players?: number; connected?: boolean; state?: string }[]) {
  return monoEmbed(MONO.black).setAuthor({ name: "▣ NOIR MUSIC / GLYPH-10 · NODE FIELD" }).setTitle("NODE FIELD // SIGNAL").setDescription(fitDescription(hudNodeDeck(nodes, { width: 58, seed: nodes.length * 101 }))).setFooter({ text: "NOIR MUSIC // NODE FIELD · GLYPH-10 · SIGNAL CORE" });
}

export function glyph10MetricsEmbed(metrics: readonly { label: string; value: string | number; max?: number; state?: string }[], title = "TELEMETRY") {
  return monoEmbed(MONO.panel2).setAuthor({ name: "▣ NOIR MUSIC / GLYPH-10 · METRIC GRID" }).setTitle(`${clean(title, "TELEMETRY", 64).toUpperCase()} // MATRIX`).setDescription(fitDescription(hudMetricDeck(metrics, { width: 58, title }))).setFooter({ text: "NOIR MUSIC // METRIC GRID · GLYPH-10 · OPERATOR SURFACE" });
}

export function glyph10SpectrumEmbed(values: readonly number[], title = "SIGNAL SPECTRUM") {
  return monoEmbed(MONO.panel).setAuthor({ name: "▣ NOIR MUSIC / GLYPH-10 · SPECTRUM" }).setTitle(`${clean(title, "SPECTRUM", 64).toUpperCase()} // PIXEL WAVE`).setDescription(fitDescription(hudSpectrum(values, { width: 58, title }))).setFooter({ text: "NOIR MUSIC // SPECTRUM · GLYPH-10 · PIXEL SIGNAL" });
}

import { metricDeck, latencyDeck, signalDeck, distributionDeck, quotaDeck, emptyDeck, loadingDeck, errorDeck } from "./uxDataDeck";
import { composition, operatorStrip } from "./composition";

/** GLYPH-18 / DEEP SURFACE — presentation-only embed family. */
export function glyph18MetricEmbed(metrics: readonly { label: string; value: string | number; hint?: string }[], title = "METRIC DECK") {
  return monoEmbed(MONO.panel).setAuthor({ name: "▣ NOIR MUSIC / GLYPH-18 · DATA DECK" }).setTitle(`${clean(title, "METRIC DECK", 64).toUpperCase()} // DEEP MATRIX`).setDescription(fitDescription(metricDeck(metrics, 58))).setFooter({ text: "NOIR MUSIC // GLYPH-18 · DATA DECK · PIXEL TELEMETRY" });
}

export function glyph18LatencyEmbed(samples: readonly number[]) {
  return monoEmbed(MONO.black).setAuthor({ name: "▣ NOIR MUSIC / GLYPH-18 · LATENCY FIELD" }).setTitle("LATENCY // SIGNAL DECK").setDescription(fitDescription(latencyDeck(samples, 58))).setFooter({ text: "NOIR MUSIC // GLYPH-18 · LATENCY · SIGNAL FIELD" });
}

export function glyph18SignalEmbed(values: readonly number[], title = "SIGNAL DECK") {
  return monoEmbed(MONO.panel2).setAuthor({ name: "▣ NOIR MUSIC / GLYPH-18 · SIGNAL FIELD" }).setTitle(`${clean(title, "SIGNAL DECK", 64).toUpperCase()} // PIXEL WAVE`).setDescription(fitDescription(signalDeck(values, 58))).setFooter({ text: "NOIR MUSIC // GLYPH-18 · SIGNAL · PIXEL WAVE" });
}

export function glyph18DistributionEmbed(values: readonly number[], title = "DISTRIBUTION") {
  return monoEmbed(MONO.panel2).setAuthor({ name: "▣ NOIR MUSIC / GLYPH-18 · DISTRIBUTION" }).setTitle(`${clean(title, "DISTRIBUTION", 64).toUpperCase()} // HISTOGRAM`).setDescription(fitDescription(distributionDeck(values, 58))).setFooter({ text: "NOIR MUSIC // GLYPH-18 · DISTRIBUTION · DENSITY FIELD" });
}

export function glyph18QuotaEmbed(used: number, limit: number, label = "CAPACITY") {
  return monoEmbed(MONO.panel).setAuthor({ name: "▣ NOIR MUSIC / GLYPH-18 · RESOURCE FIELD" }).setTitle(`${clean(label, "CAPACITY", 48).toUpperCase()} // QUOTA`).setDescription(fitDescription(quotaDeck(used, limit, label, 58))).setFooter({ text: "NOIR MUSIC // GLYPH-18 · RESOURCE FIELD · LIMIT TELEMETRY" });
}

export function glyph18StateEmbed(phase: "EMPTY" | "LOADING" | "ERROR", title: string, message?: string, progress = -1) {
  const body = phase === "EMPTY" ? emptyDeck(title, message, "REFRESH", 58) : phase === "LOADING" ? loadingDeck(title, progress, 58) : errorDeck(title, message ?? "SURFACE FAILED", "RETRY", 58);
  return monoEmbed(phase === "ERROR" ? MONO.black : MONO.panel).setAuthor({ name: `▣ NOIR MUSIC / GLYPH-18 · ${phase} SURFACE` }).setTitle(`${clean(title, "SURFACE", 64).toUpperCase()} // ${phase}`).setDescription(fitDescription(body)).setFooter({ text: `NOIR MUSIC // GLYPH-18 · ${phase} · PIXEL UX` });
}

export function glyph18ScreenEmbed(spec: Parameters<typeof composition>[0]) {
  const body = composition(spec);
  return monoEmbed(MONO.panel).setAuthor({ name: "▣ NOIR MUSIC / GLYPH-18 · SCREEN COMPOSITOR" }).setTitle(`${clean(spec.title, "SCREEN", 64).toUpperCase()} // SURFACE`).setDescription(fitDescription(body)).setFooter({ text: "NOIR MUSIC // GLYPH-18 · SCREEN COMPOSITOR · PIXEL UX" });
}

export function glyph18OperatorStrip(items: readonly string[]) {
  return operatorStrip(items, 58);
}

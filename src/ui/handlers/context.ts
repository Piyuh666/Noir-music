import type { ButtonInteraction, GuildMember, StringSelectMenuInteraction, ModalSubmitInteraction } from "discord.js";
import type { Player } from "lavalink-client";
import { commandMatrixEmbed, errorEmbed, listEmbed, queueMatrixEmbed, statusEmbed, systemDashboard } from "../embeds";
import { queueControls, volumeControls, dashboardControls, helpControls, helpBackControl, matrixControls } from "../components";
import { GuildSession } from "../../audio/session";
import { DjService } from "../../services/djService";
import { prisma } from "../../database/prisma";
import { config } from "../../config";
import { registry } from "../../commands/registry";
import { readLivePlayerState } from "../player";
import { renderPlayer } from "../renderer";
import { matrixDesignShowcase, matrixDesignLegend, matrixPanel, matrixQueueSurface } from "../glyphMatrixUi";
import { searchLiveCommands } from "../help";
import type { UIInteraction } from "../router";

export const MAX_COMPONENT_AGE_MS = config.bot.componentMaxAgeMs;
const processedComponents = new Map<string, number>();
const COMPONENT_DEDUPE_TTL_MS = 15_000;
const MAX_COMPONENT_DEDUPE = 20_000;

export function isFresh(interaction: UIInteraction): boolean {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return true;
  const created = interaction.message.createdTimestamp;
  return Number.isFinite(created) && Date.now() - created <= MAX_COMPONENT_AGE_MS;
}

export function claimComponent(interaction: UIInteraction): boolean {
  const now = Date.now();
  for (const [id, expiresAt] of processedComponents) {
    if (expiresAt <= now) processedComponents.delete(id);
    if (processedComponents.size <= MAX_COMPONENT_DEDUPE) break;
  }
  if (processedComponents.has(interaction.id)) return false;
  if (processedComponents.size >= MAX_COMPONENT_DEDUPE) {
    const oldest = processedComponents.keys().next().value as string | undefined;
    if (oldest) processedComponents.delete(oldest);
  }
  processedComponents.set(interaction.id, now + COMPONENT_DEDUPE_TTL_MS);
  return true;
}

export function safeTitle(value: unknown): string {
  return String(value ?? "Untitled").replace(/[\r\n]/g, " ").trim().slice(0, 256) || "Untitled";
}

export function sessionFor(interaction: UIInteraction): GuildSession {
  const guildId = interaction.guildId;
  if (!guildId) throw new Error("CMD_GUILD");
  return GuildSession.for(guildId);
}

export function requirePlayer(interaction: UIInteraction): Player {
  const player = sessionFor(interaction).player;
  if (!player) throw new Error("NO_ACTIVE_PLAYER");
  return player;
}

export async function requireControl(interaction: ButtonInteraction, player: Player): Promise<boolean> {
  if (player?.voiceChannelId) {
    const member = interaction.member as GuildMember;
    if (member.voice.channelId !== player.voiceChannelId) {
      await interaction.reply({ embeds: [errorEmbed("Wrong voice channel", "Join the same voice channel as NOIR MUSIC first.", "VOICE_002")], ephemeral: true });
      return false;
    }
  }
  const member = interaction.member as GuildMember;
  const dj = await DjService.isDj(member);
  if (player.getData("playbackLocked") && !dj) {
    await interaction.reply({ embeds: [errorEmbed("Playback locked", "Playback controls are currently restricted to DJs.", "PERM_004")], ephemeral: true });
    return false;
  }
  return true;
}

export function queuePageEmbed(player: Player, requestedPage: number) {
  const tracks = player.queue.tracks ?? [];
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(tracks.length / pageSize));
  const page = Math.max(1, Math.min(pages, Math.floor(Number.isFinite(requestedPage) ? requestedPage : 1)));
  return {
    embed: queueMatrixEmbed(tracks.map((track) => ({ title: safeTitle(track.info?.title), artist: safeTitle(track.info?.author || "Unknown artist"), duration: Number(track.info?.duration ?? 0) })), page, pageSize, tracks.length)
      .setAuthor({ name: "▣ NOIR MUSIC › QUEUE MATRIX" })
      .setDescription(matrixQueueSurface(tracks.slice((page - 1) * pageSize, page * pageSize).map((track) => ({ title: safeTitle(track.info?.title), artist: safeTitle(track.info?.author || "Unknown artist"), duration: Number(track.info?.duration ?? 0) })), page, pages, 60, "MATRIX"))
      .setFooter({ text: `▣ QUEUE · ${page}/${pages} · GLYPH/PIXEL MATRIX` }),
    page,
    pages,
  };
}

export function queuePageFromInteraction(interaction: ButtonInteraction): number {
  const description = interaction.message.embeds[0]?.description ?? "";
  return Number(description.match(/PAGE\s+(\d+)\//)?.[1] ?? 1);
}

export function playerView(guildId: string) {
  return renderPlayer(readLivePlayerState(guildId));
}

const matrixProgressSafe = (value: number, width = 18): string => { const v = Math.max(0, Math.min(100, Number(value) || 0)); const w = Math.max(8, Math.min(30, Math.trunc(width))); const filled = Math.round(v / 100 * w); return `${"█".repeat(filled)}${"░".repeat(w - filled)} ${Math.round(v)}%`; };

export async function showDashboard(interaction: ButtonInteraction): Promise<void> {
  const session = sessionFor(interaction);
  const player = session.player;
  const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
  const connected = Boolean(player?.voiceChannelId);
  const playing = Boolean(player?.playing);
  const paused = Boolean(player?.paused);
  const queueSize = player?.queue?.tracks?.length ?? 0;
  const volume = player?.volume ?? guild?.defaultVolume ?? 70;
  const effects = player?.getData<boolean>("effectsEnabled") ?? guild?.effectsEnabled ?? true;
  const autoplay = player?.getData<boolean>("autoplay") ?? guild?.autoplay ?? false;
  const source = player?.getData<string>("defaultSource") ?? guild?.defaultSource ?? "ytsearch";
  const state = playing ? (paused ? "PAUSED" : "PLAYING") : connected ? "READY" : "OFFLINE";
  const dashboard = matrixPanel("CONTROL MATRIX", [
    `⌘ VOICE ${connected ? "CONNECTED" : "OFFLINE"}`,
    `▶ PLAYER ${state}`,
    `▣ QUEUE ${queueSize} TRACKS`,
    `◐ VOLUME ${matrixProgressSafe(volume, 18)}`,
    `≈ EFFECTS ${effects ? "ENABLED" : "DISABLED"}`,
    `⌁ AUTOPLAY ${autoplay ? "ENABLED" : "DISABLED"}`,
    `◇ SOURCE ${String(source).toUpperCase().slice(0, 28)}`,
  ], 60, "OPERATOR");
  const embed = systemDashboard({ guild: interaction.guild?.name ?? "SERVER", connected, playing, paused, queueSize, volume, effects, autoplay, source });
  embed.setAuthor({ name: "⌘ NOIR MUSIC › OPERATOR CONTROL" });
  embed.setDescription(dashboard);
  embed.setFooter({ text: "⌘ CONTROL · GLYPH/PIXEL ONLY · LIVE STATE" });
  await interaction.update({ embeds: [embed], components: dashboardControls() });
}

export async function showHelpBack(interaction: ButtonInteraction): Promise<void> {
  const categories = registry.categories();
  await interaction.update({ embeds: [statusEmbed("HELP / MODULE SELECT", `${categories.length} MODULES`)], components: helpControls([...categories]) });
}

export async function showMatrix(interaction: ButtonInteraction): Promise<void> {
  const categories = registry.categories();
  const designField = matrixPanel("DESIGN MATRIX", [matrixDesignShowcase(58), `${categories.length} MODULES ${"·"} ${registry.flatCommands().length} COMMANDS`], 58, "MATRIX");
  const profileField = matrixDesignLegend(58, "MATRIX");
  const embed = commandMatrixEmbed([...categories], registry.flatCommands().length);
  embed.setAuthor({ name: "▦ NOIR MUSIC › GLYPH MATRIX CONTROL" });
  embed.setDescription(`${designField}\n\n${profileField}`);
  embed.setFooter({ text: "▦ MATRIX · 6 DESIGNS · GLYPH/PIXEL ONLY" });
  await interaction.update({ embeds: [embed], components: matrixControls() });
}

export function actionFailure(error: unknown) {
  const code = error instanceof Error ? error.message : "UI_PLAYER_ACTION_FAILED";
  const messages: Record<string, [string, string, string]> = {
    NOTHING_QUEUED: ["Nothing queued", "Add a track with /play before starting playback.", "PLAYER_003"],
    NOTHING_TO_SKIP: ["Nothing to skip", "There is no active track.", "PLAYER_003"],
    NO_PREVIOUS_TRACK: ["No previous track", "There is no track in playback history.", "PLAYER_004"],
    QUEUE_TOO_SHORT: ["Queue too short", "Add at least two upcoming tracks before shuffling.", "QUEUE_001"],
    NOTHING_PLAYING: ["Nothing playing", "There is no active track.", "PLAYER_005"],
    TRACK_IDENTITY_MISSING: ["Track identity missing", "This source did not provide a stable track identifier.", "LIB_002"],
    NO_ACTIVE_PLAYER: ["No active player", "Start playback with /play first.", "UI_001"],
  };
  const [title, body, errCode] = messages[code] ?? ["UI action failed", "The control could not be completed. Try refreshing the player panel.", "UI_500"];
  return errorEmbed(title, body, errCode);
}

export async function replyStale(interaction: ButtonInteraction, title: string, body: string): Promise<void> {
  await interaction.reply({ embeds: [errorEmbed(title, body, "UI_410")], ephemeral: true });
}

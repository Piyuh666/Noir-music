import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { fetchJsonBounded } from "../../utils/runtimeGuard";

export const import_: MusicCommand = {
  meta: { id: "music_settings.import", category: "settings", description: "Import server music settings from a JSON file.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addAttachmentOption((o) => o.setName("file").setDescription("Exported settings JSON").setRequired(true)); },
  execute: async (interaction) => {
    const attachment = interaction.options.getAttachment("file", true);
    await interaction.deferReply();
    try {
      if (attachment.size !== undefined && attachment.size > 512_000) throw new Error("SETTINGS_IMPORT_TOO_LARGE");
      const data = await fetchJsonBounded<Record<string, unknown>>(attachment.url, {}, { timeoutMs: 10_000, maxBytes: 512_000, allowedHostSuffixes: ["discordapp.com", "discord.com"] });
      await prisma.guild.upsert({
        where: { discordId: interaction.guildId! },
        update: {
          prefix: typeof data.prefix === "string" ? data.prefix.slice(0, 3) : "/",
          autoplay: Boolean(data.autoplay),
          effectsEnabled: data.effectsEnabled !== false,
          voteSkipRatio: Math.max(0.01, Math.min(Number(data.voteSkipRatio) || 0.5, 1)),
          defaultVolume: Math.max(0, Math.min(Number(data.defaultVolume) || 70, 150)),
          maxQueueSize: Math.max(10, Math.min(Number(data.maxQueueSize) || 500, 2000)),
          maxPlaylistSize: Math.max(10, Math.min(Number(data.maxPlaylistSize) || 1000, 5000)),
          defaultSource: data.defaultSource === "scsearch" ? "scsearch" : "ytsearch",
          duplicateHandling: ["allow", "warn", "block"].includes(String(data.duplicateHandling)) ? String(data.duplicateHandling) as "allow" | "warn" | "block" : "allow",
          explicitFilter: Boolean(data.explicitFilter),
          always247: Boolean(data.always247),
          announceChannelId: typeof data.announceChannelId === "string" ? data.announceChannelId : null,
          playerStyle: ["glyph", "minimal", "compact"].includes(String(data.playerStyle)) ? String(data.playerStyle) as "glyph" | "minimal" | "compact" : "glyph",
          language: typeof data.language === "string" ? data.language.slice(0, 16) : "en",
          idleTimeoutMinutes: Math.max(1, Math.min(Number(data.idleTimeoutMinutes) || 5, 120)),
          historyRetentionDays: Math.max(7, Math.min(Number(data.historyRetentionDays) || 365, 3650)),
        },
        create: { discordId: interaction.guildId! },
      });
      await interaction.editReply({ embeds: [statusEmbed("SETTINGS IMPORTED", "")] });
    } catch {
      await interaction.editReply({ embeds: [errorEmbed("Import failed", "That file isn't valid settings JSON.", "SET_002")] });
    }
  },
};

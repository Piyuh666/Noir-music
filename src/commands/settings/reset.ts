import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const reset: MusicCommand = {
  meta: { id: "music_settings.reset", category: "settings", description: "Reset all server music settings to defaults.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    await prisma.guild.update({
      where: { discordId: interaction.guildId! },
      data: { prefix: "/", autoplay: false, effectsEnabled: true, voteSkipRatio: 0.5, defaultChannelId: null, defaultVolume: 70, maxQueueSize: 500, maxPlaylistSize: 1000, defaultSource: "ytsearch", duplicateHandling: "allow", explicitFilter: false, always247: false, announceChannelId: null, playerStyle: "glyph", language: "en", idleTimeoutMinutes: 5, historyRetentionDays: 365 },
    }).catch(() => {});
    await interaction.reply({ embeds: [statusEmbed("SETTINGS RESET TO DEFAULTS", "")] });
  },
};

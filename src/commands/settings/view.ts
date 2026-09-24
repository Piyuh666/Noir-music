import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const view: MusicCommand = {
  meta: { id: "music_settings.view", category: "settings", description: "Show this server's music settings.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const guild = await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: {}, create: { discordId: interaction.guildId! } });
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle("MUSIC SETTINGS")
      .setDescription(
        [
          `Prefix: ${guild.prefix}`,
          `Autoplay: ${guild.autoplay ? "ON" : "OFF"}`,
          `Effects: ${guild.effectsEnabled ? "ON" : "OFF"}`,
          `Vote-skip ratio: ${Math.round(guild.voteSkipRatio * 100)}%`,
          `Default channel: ${guild.defaultChannelId ? `<#${guild.defaultChannelId}>` : "not set"}`,
          `Default volume: ${guild.defaultVolume}%`,
          `Queue limit: ${guild.maxQueueSize}`,
          `Playlist limit: ${guild.maxPlaylistSize}`,
          `Default source: ${guild.defaultSource}`,
          `Duplicate handling: ${guild.duplicateHandling}`,
          `Explicit filter: ${guild.explicitFilter ? "ON" : "OFF"}`,
        ].join("\n")
      );
    await interaction.reply({ embeds: [embed] });
  },
};

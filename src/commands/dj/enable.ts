import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const enable: MusicCommand = {
  meta: { id: "dj.enable", category: "dj", description: "Enable the DJ permission system for this server.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const guild = await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: {}, create: { discordId: interaction.guildId! } });
    await prisma.guildDjConfig.upsert({
      where: { guildId: guild.discordId },
      update: {},
      create: { guildId: guild.discordId, permissionsJson: JSON.stringify({ play: "everyone", skip: "dj", stop: "dj", queue: "everyone", volume: "dj", effects: "dj", playlist: "everyone", radio: "everyone", disconnect: "dj", settings: "dj" }) },
    });
    await interaction.reply({ embeds: [statusEmbed("DJ MODE ENABLED", "")] });
  },
};

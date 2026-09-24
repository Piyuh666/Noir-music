import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const disable: MusicCommand = {
  meta: { id: "dj.disable", category: "dj", description: "Disable the DJ permission system for this server.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    await prisma.guildDjConfig.deleteMany({ where: { guildId: interaction.guildId! } });
    await interaction.reply({ embeds: [statusEmbed("DJ MODE DISABLED", "")] });
  },
};

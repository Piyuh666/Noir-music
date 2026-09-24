import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const emergencyoverride: MusicCommand = {
  meta: { id: "dj.emergency_override", category: "dj", description: "Instantly disable DJ restrictions server-wide (admin only).", permissions: ["Administrator"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    await prisma.guildDjConfig.deleteMany({ where: { guildId: interaction.guildId! } });
    await interaction.reply({ embeds: [statusEmbed("EMERGENCY OVERRIDE · DJ RESTRICTIONS CLEARED", "")] });
  },
};

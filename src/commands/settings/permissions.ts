import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const permissions: MusicCommand = {
  meta: { id: "music_settings.permissions", category: "settings", description: "View a summary of this server's music-related permission configuration.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const { prisma } = await import("../../database/prisma");
    const config = await prisma.guildDjConfig.findUnique({ where: { guildId: interaction.guildId! } });
    await interaction.reply({ embeds: [statusEmbed(config ? "DJ RESTRICTIONS ACTIVE" : "NO RESTRICTIONS — OPEN TO EVERYONE", "")] });
  },
};

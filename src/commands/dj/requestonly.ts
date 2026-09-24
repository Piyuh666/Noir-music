import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const requestonly: MusicCommand = {
  meta: { id: "request_only", category: "dj", description: "Toggle request-only mode: non-DJs can queue but not control playback.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addBooleanOption((o) => o.setName("enabled").setDescription("On or off").setRequired(true)); },
  execute: async (interaction) => {
    const enabled = interaction.options.getBoolean("enabled", true);
    const config = await prisma.guildDjConfig.findUnique({ where: { guildId: interaction.guildId! } });
    if (!config) {
      await interaction.reply({ embeds: [errorEmbed("DJ mode not enabled", "Run /dj enable first.", "DJ_001")], ephemeral: true });
      return;
    }
    await prisma.guildDjConfig.update({ where: { guildId: interaction.guildId! }, data: { requestOnly: enabled } });
    await interaction.reply({ embeds: [statusEmbed(`REQUEST-ONLY ${enabled ? "ON" : "OFF"}`, "")] });
  },
};

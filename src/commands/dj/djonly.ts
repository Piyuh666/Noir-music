import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const djonly: MusicCommand = {
  meta: { id: "dj_only", category: "dj", description: "Quick toggle: restrict skip/stop/volume/effects to DJs only.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addBooleanOption((o) => o.setName("enabled").setDescription("On or off").setRequired(true)); },
  execute: async (interaction) => {
    const enabled = interaction.options.getBoolean("enabled", true);
    const config = await prisma.guildDjConfig.findUnique({ where: { guildId: interaction.guildId! } });
    if (!config) {
      await interaction.reply({ embeds: [errorEmbed("DJ mode not enabled", "Run /dj enable first.", "DJ_001")], ephemeral: true });
      return;
    }
    const perms = JSON.parse(config.permissionsJson);
    for (const key of ["skip", "stop", "volume", "effects"]) perms[key] = enabled ? "dj" : "everyone";
    await prisma.guildDjConfig.update({ where: { guildId: interaction.guildId! }, data: { permissionsJson: JSON.stringify(perms) } });
    await interaction.reply({ embeds: [statusEmbed(`DJ-ONLY CORE ACTIONS ${enabled ? "ON" : "OFF"}`, "")] });
  },
};

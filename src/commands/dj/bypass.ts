import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { DjAction } from "../../services/djService";

export const bypass: MusicCommand = {
  meta: { id: "dj.bypass", category: "dj", description: "Open one restricted action to everyone until changed again.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("action").setDescription("Action to open up").setRequired(true)); },
  execute: async (interaction) => {
    const action = interaction.options.getString("action", true) as DjAction;
    const config = await prisma.guildDjConfig.findUnique({ where: { guildId: interaction.guildId! } });
    if (!config) {
      await interaction.reply({ embeds: [errorEmbed("DJ mode not enabled", "Run /dj enable first.", "DJ_001")], ephemeral: true });
      return;
    }
    const perms = JSON.parse(config.permissionsJson);
    perms[action] = "everyone";
    await prisma.guildDjConfig.update({ where: { guildId: interaction.guildId! }, data: { permissionsJson: JSON.stringify(perms) } });
    await interaction.reply({ embeds: [statusEmbed(`BYPASSED · ${action}`, "")] });
  },
};

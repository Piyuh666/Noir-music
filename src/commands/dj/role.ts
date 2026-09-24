import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed, errorEmbed } from "../../ui/embeds";

export const role: MusicCommand = {
  meta: { id: "dj.role", category: "dj", description: "Set the role that counts as DJ.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addRoleOption((o) => o.setName("role").setDescription("DJ role").setRequired(true));
  },
  execute: async (interaction) => {
    const role = interaction.options.getRole("role", true);
    const config = await prisma.guildDjConfig.findUnique({ where: { guildId: interaction.guildId! } });
    if (!config) {
      await interaction.reply({ embeds: [errorEmbed("DJ mode not enabled", "Run /dj enable first.", "DJ_001")], ephemeral: true });
      return;
    }
    await prisma.guild.update({ where: { discordId: interaction.guildId! }, data: { djRoleId: role.id } });
    await interaction.reply({ embeds: [statusEmbed(`DJ ROLE · ${role.name}`, "")] });
  },
};

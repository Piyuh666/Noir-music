import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const transfer: MusicCommand = {
  meta: { id: "dj.transfer", category: "dj", description: "Transfer the DJ role designation to a different role.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addRoleOption((o) => o.setName("role").setDescription("New DJ role").setRequired(true)); },
  execute: async (interaction) => {
    const role = interaction.options.getRole("role", true);
    await prisma.guild.update({ where: { discordId: interaction.guildId! }, data: { djRoleId: role.id } });
    await interaction.reply({ embeds: [statusEmbed(`DJ ROLE TRANSFERRED · ${role.name}`, "")] });
  },
};

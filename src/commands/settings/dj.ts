import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const dj: MusicCommand = {
  meta: { id: "music_settings.dj", category: "settings", description: "Shortcut to set the DJ role (same effect as /dj role).", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addRoleOption((o) => o.setName("role").setDescription("DJ role").setRequired(true)); },
  execute: async (interaction) => {
    const role = interaction.options.getRole("role", true);
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: {}, create: { discordId: interaction.guildId! } });
    await prisma.guild.update({ where: { discordId: interaction.guildId! }, data: { djRoleId: role.id } });
    await prisma.guildDjConfig.upsert({
      where: { guildId: interaction.guildId! },
      update: {},
      create: { guildId: interaction.guildId!, permissionsJson: "{}" },
    });
    await interaction.reply({ embeds: [statusEmbed(`DJ ROLE · ${role.name}`, "")] });
  },
};

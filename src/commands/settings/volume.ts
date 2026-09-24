import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const volume: MusicCommand = {
  meta: { id: "music_settings.volume", category: "settings", description: "Set the default join volume for this server.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("level").setDescription("0-150").setRequired(true).setMinValue(0).setMaxValue(150));
  },
  execute: async (interaction) => {
    const level = interaction.options.getInteger("level", true);
    await prisma.guild.upsert({
      where: { discordId: interaction.guildId! },
      update: {},
      create: { discordId: interaction.guildId! },
    });
    await prisma.guild.update({ where: { discordId: interaction.guildId! }, data: { defaultVolume: level } });
    await interaction.reply({ embeds: [statusEmbed(`DEFAULT VOL · ${level}%`, "")] });
  },
};

import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const idletimeout: MusicCommand = {
  meta: { id: "music_settings.idle_timeout", category: "settings", description: "Server-wide default for /voice idle-timeout.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("minutes").setDescription("Idle minutes").setRequired(true).setMinValue(1).setMaxValue(120)); },
  execute: async (interaction) => {
    const minutes = interaction.options.getInteger("minutes", true);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { idleTimeoutMinutes: minutes }, create: { discordId: interaction.guildId!, idleTimeoutMinutes: minutes } });
    await interaction.reply({ embeds: [statusEmbed(`DEFAULT IDLE TIMEOUT · ${minutes}m`, "")] });
  },
};

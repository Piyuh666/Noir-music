import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const historyretention: MusicCommand = {
  meta: { id: "music_settings.history_retention", category: "settings", description: "Set how many days of play history to retain before pruning.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("days").setDescription("Days to retain").setRequired(true).setMinValue(7).setMaxValue(3650)); },
  execute: async (interaction) => {
    const days = interaction.options.getInteger("days", true);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const guild = await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { historyRetentionDays: days }, create: { discordId: interaction.guildId!, historyRetentionDays: days } });
    await prisma.playHistory.deleteMany({ where: { guildId: guild.id, playedAt: { lt: cutoff } } });
    await interaction.reply({ embeds: [statusEmbed(`HISTORY RETENTION · ${days} days`, "")] });
  },
};

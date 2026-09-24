import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const maxplaylistsize: MusicCommand = {
  meta: { id: "music_settings.max_playlist_size", category: "settings", description: "Set the max number of tracks allowed per playlist.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("max").setDescription("Max tracks").setRequired(true).setMinValue(10).setMaxValue(5000)); },
  execute: async (interaction) => {
    const max = interaction.options.getInteger("max", true);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { maxPlaylistSize: max }, create: { discordId: interaction.guildId!, maxPlaylistSize: max } });
    await interaction.reply({ embeds: [statusEmbed(`MAX PLAYLIST SIZE · ${max}`, "")] });
  },
};

import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { STATIONS } from "../../audio/radio";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const favoritestation: MusicCommand = {
  meta: { id: "radio.favorite_station", category: "radio", description: "Save a station as your favorite.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("station").setDescription("Station").setRequired(true).addChoices(...STATIONS.map((s) => ({ name: s.name, value: s.id })))); },
  execute: async (interaction) => {
    const stationId = interaction.options.getString("station", true);
    const station = STATIONS.find((s) => s.id === stationId)!;
    const user = await prisma.user.upsert({ where: { discordId: interaction.user.id }, update: {}, create: { discordId: interaction.user.id } });
    await prisma.favorite.upsert({
      where: { userId_trackUri: { userId: user.id, trackUri: `station:${station.id}` } },
      update: {},
      create: { userId: user.id, trackUri: `station:${station.id}`, title: station.name, artist: "radio station" },
    });
    await interaction.reply({ embeds: [statusEmbed(`FAVORITE STATION · ${station.name}`, "")] });
  },
};

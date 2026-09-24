import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { requireVoiceChannel } from "../../utils/voice";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const add: MusicCommand = {
  meta: { id: "library.add", category: "library", description: "Search for a track and add it directly to your library.", changesPlaybackState: false, requiresDb: true, requiresProvider: true },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("query").setDescription("Song to add").setRequired(true)); },
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    await interaction.deferReply();
    const query = interaction.options.getString("query", true);
    const session = GuildSession.for(interaction.guildId!);
    const player = await session.ensurePlayer(voiceChannelId, interaction.channelId);
    const result = await session.search(player, query, interaction.user);
    const track = result?.tracks?.[0];
    if (!track) {
      await interaction.editReply({ embeds: [errorEmbed("No results", "Try a different search.", "SEARCH_204")] });
      return;
    }
    const user = await prisma.user.upsert({ where: { discordId: interaction.user.id }, update: {}, create: { discordId: interaction.user.id } });
    await prisma.favorite.upsert({
      where: { userId_trackUri: { userId: user.id, trackUri: track.info.uri ?? track.info.identifier } },
      update: {},
      create: { userId: user.id, trackUri: track.info.uri ?? track.info.identifier, title: track.info.title, artist: track.info.author },
    });
    await interaction.editReply({ embeds: [statusEmbed(`ADDED TO LIBRARY · ${track.info.title}`, "")] });
  },
};

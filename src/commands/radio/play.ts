import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { STATIONS } from "../../audio/radio";
import { requireVoiceChannel } from "../../utils/voice";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const play: MusicCommand = {
  meta: { id: "radio.play", category: "radio", description: "Start a radio station.", changesPlaybackState: true, requiresDb: false, requiresProvider: true },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("station").setDescription("Station name").setRequired(true).addChoices(...STATIONS.map((s) => ({ name: s.name, value: s.id })))); },
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    await interaction.deferReply();
    const stationId = interaction.options.getString("station", true);
    const station = STATIONS.find((s) => s.id === stationId)!;
    const session = GuildSession.for(interaction.guildId!);
    const player = await session.ensurePlayer(voiceChannelId, interaction.channelId);
    const result = await session.search(player, station.searchQuery, interaction.user);
    if (!result?.tracks?.length) {
      await interaction.editReply({ embeds: [errorEmbed("Station unavailable", "Couldn't find a stream for that station right now.", "RADIO_001")] });
      return;
    }
    await session.addManyToQueue(player, result.tracks.slice(0, 10));
    player.setData("radioStation", station.id);
    player.setData("radioQuery", station.searchQuery);
    player.setData("autoplay", true);
    if (!player.playing && !player.paused) await player.play();
    await interaction.editReply({ embeds: [statusEmbed(`RADIO · ${station.name}`, "")] });
  },
};

import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { requireVoiceChannel } from "../../utils/voice";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const play: MusicCommand = {
  meta: {
    id: "play",
    category: "playback",
    description: "Play a song, playlist, or search query.",
    example: "/play query:never gonna give you up",
    aliases: ["p", "playmusic"],
    changesPlaybackState: true,
    requiresDb: true,
    requiresProvider: true,
  },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("query").setDescription("Song name, artist, or URL").setRequired(true)
    );
  },
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    await interaction.deferReply();

    const query = interaction.options.getString("query", true);
    const session = GuildSession.for(interaction.guildId!);
    const player = await session.ensurePlayer(voiceChannelId, interaction.channelId);

    await interaction.editReply({ embeds: [statusEmbed("SEARCHING", "...")] });

    const result = await session.search(player, query, interaction.user);
    if (!result?.tracks?.length) {
      await interaction.editReply({
        embeds: [errorEmbed("No results", "Try a different search term or a direct URL.", "SEARCH_204")],
      });
      return;
    }

    const tracks = result.tracks;
    const added = await session.addManyToQueue(player, tracks);
    const track = tracks[0];
    if (!player.playing && !player.paused) await PlaybackService.play(interaction.guildId!);

    await interaction.editReply({
      embeds: [statusEmbed(added > 0 ? `QUEUED · ${track.info.title}${added > 1 ? ` + ${added - 1} more` : ""}` : "DUPLICATES SKIPPED", "")],
    });
  },
};

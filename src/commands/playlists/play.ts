import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaylistService } from "../../services/playlistService";
import { requireVoiceChannel } from "../../utils/voice";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const play: MusicCommand = {
  meta: { id: "playlist.play", category: "playlists", description: "Queue an entire playlist.", changesPlaybackState: true, requiresDb: true, requiresProvider: true },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    await interaction.deferReply();
    const tracks = await PlaylistService.list(playlist.id);
    if (!tracks.length) {
      await interaction.editReply({ embeds: [errorEmbed("Playlist is empty", "Add tracks first with /playlist add.", "PL_005")] });
      return;
    }
    const session = GuildSession.for(interaction.guildId!);
    const player = await session.ensurePlayer(voiceChannelId, interaction.channelId);
    for (const t of tracks) {
      const result = await session.search(player, t.trackUri, interaction.user);
      const found = result?.tracks?.[0];
      if (found) await session.addToQueue(player, found);
    }
    if (!player.playing && !player.paused) await player.play();
    await interaction.editReply({ embeds: [statusEmbed(`QUEUED PLAYLIST · ${playlist.name} (${tracks.length} tracks)`, "")] });
  },
};

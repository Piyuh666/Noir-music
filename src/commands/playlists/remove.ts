import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const remove: MusicCommand = {
  meta: { id: "playlist.remove", category: "playlists", description: "Remove a track from a playlist by position.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)).addIntegerOption((o) => o.setName("position").setDescription("1-based position").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const tracks = await PlaylistService.list(playlist.id);
    const pos = interaction.options.getInteger("position", true) - 1;
    if (pos < 0 || pos >= tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "That track slot doesn't exist.", "PL_004")], ephemeral: true });
      return;
    }
    await PlaylistService.removeTrack(playlist.id, tracks[pos].id);
    await interaction.reply({ embeds: [statusEmbed(`REMOVED · ${tracks[pos].title}`, "")] });
  },
};

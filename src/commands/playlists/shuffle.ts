import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const shuffle: MusicCommand = {
  meta: { id: "playlist.shuffle", category: "playlists", description: "Shuffle a playlist's track order.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    await PlaylistService.shuffle(playlist.id);
    await interaction.reply({ embeds: [statusEmbed("PLAYLIST SHUFFLED", "")] });
  },
};

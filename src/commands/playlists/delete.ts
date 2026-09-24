import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const del: MusicCommand = {
  meta: { id: "playlist.delete", category: "playlists", description: "Delete one of your playlists.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    await PlaylistService.delete(playlist.id);
    await interaction.reply({ embeds: [statusEmbed(`DELETED · ${playlist.name}`, "")] });
  },
};

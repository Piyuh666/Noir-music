import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const backup: MusicCommand = {
  meta: { id: "playlist.backup", category: "playlists", description: "Create a timestamped backup copy of a playlist.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const backup = await PlaylistService.backup(playlist.id);
    await interaction.reply({ embeds: [statusEmbed(`BACKED UP · ${backup.name}`, "")] });
  },
};

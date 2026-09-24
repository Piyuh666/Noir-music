import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const clone: MusicCommand = {
  meta: { id: "playlist.clone", category: "playlists", description: "Quick-clone a playlist (adds \"(Copy)\" to the name).", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const clone = await PlaylistService.clone(playlist.id, interaction.user.id);
    await interaction.reply({ embeds: [statusEmbed(`CLONED · ${clone.name}`, "")] });
  },
};

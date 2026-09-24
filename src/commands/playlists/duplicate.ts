import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const duplicate: MusicCommand = {
  meta: { id: "playlist.duplicate", category: "playlists", description: "Duplicate an entire playlist under a new name.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist to duplicate").setRequired(true)).addStringOption((o) => o.setName("new_name").setDescription("Name for the copy").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const newName = interaction.options.getString("new_name", true);
    await PlaylistService.duplicate(playlist.id, interaction.user.id, newName);
    await interaction.reply({ embeds: [statusEmbed(`DUPLICATED · ${newName}`, "")] });
  },
};

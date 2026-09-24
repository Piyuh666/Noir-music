import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const description: MusicCommand = {
  meta: { id: "playlist.description", category: "playlists", description: "Set a playlist's description.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)).addStringOption((o) => o.setName("text").setDescription("Description").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    await PlaylistService.setDescription(playlist.id, interaction.options.getString("text", true));
    await interaction.reply({ embeds: [statusEmbed("DESCRIPTION UPDATED", "")] });
  },
};

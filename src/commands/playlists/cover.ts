import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const cover: MusicCommand = {
  meta: { id: "playlist.cover", category: "playlists", description: "Set a playlist's cover image URL.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)).addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    await PlaylistService.setCover(playlist.id, interaction.options.getString("url", true));
    await interaction.reply({ embeds: [statusEmbed("COVER UPDATED", "")] });
  },
};

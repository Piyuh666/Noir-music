import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const split: MusicCommand = {
  meta: { id: "playlist.split", category: "playlists", description: "Split a playlist into two at a given track position.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)).addIntegerOption((o) => o.setName("at").setDescription("Split after this position").setRequired(true).setMinValue(1)).addStringOption((o) => o.setName("new_name").setDescription("Name for the new playlist").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const at = interaction.options.getInteger("at", true);
    const newName = interaction.options.getString("new_name", true);
    await PlaylistService.split(playlist.id, at, interaction.user.id, newName);
    await interaction.reply({ embeds: [statusEmbed(`SPLIT · ${newName}`, "")] });
  },
};

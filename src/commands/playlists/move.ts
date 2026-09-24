import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const move: MusicCommand = {
  meta: { id: "playlist.move", category: "playlists", description: "Move a track to a new position within a playlist.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)).addIntegerOption((o) => o.setName("from").setDescription("Current position").setRequired(true).setMinValue(1)).addIntegerOption((o) => o.setName("to").setDescription("New position").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    try {
      await PlaylistService.moveTrack(playlist.id, interaction.options.getInteger("from", true) - 1, interaction.options.getInteger("to", true) - 1);
      await interaction.reply({ embeds: [statusEmbed("TRACK MOVED", "")] });
    } catch {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "Check both positions.", "PL_004")], ephemeral: true });
    }
  },
};

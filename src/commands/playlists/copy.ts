import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const copy: MusicCommand = {
  meta: { id: "playlist.copy", category: "playlists", description: "Copy a single track from one playlist to another.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("from").setDescription("Source playlist name").setRequired(true)).addStringOption((o) => o.setName("to").setDescription("Target playlist name").setRequired(true)).addIntegerOption((o) => o.setName("position").setDescription("Track position in source").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const playlists = await PlaylistService.byOwner(interaction.user.id);
    const from = playlists.find((p) => p.name.toLowerCase() === interaction.options.getString("from", true).toLowerCase());
    const to = playlists.find((p) => p.name.toLowerCase() === interaction.options.getString("to", true).toLowerCase());
    if (!from || !to) {
      await interaction.reply({ embeds: [errorEmbed("Playlist not found", "Check both playlist names.", "PL_001")], ephemeral: true });
      return;
    }
    const tracks = await PlaylistService.list(from.id);
    const pos = interaction.options.getInteger("position", true) - 1;
    if (pos < 0 || pos >= tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "That track slot doesn't exist.", "PL_004")], ephemeral: true });
      return;
    }
    await PlaylistService.copyTrack(from.id, to.id, tracks[pos].id);
    await interaction.reply({ embeds: [statusEmbed(`COPIED TO ${to.name.toUpperCase()}`, "")] });
  },
};

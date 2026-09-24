import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const merge: MusicCommand = {
  meta: { id: "playlist.merge", category: "playlists", description: "Merge one playlist's tracks into another.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("source").setDescription("Source playlist").setRequired(true)).addStringOption((o) => o.setName("target").setDescription("Target playlist").setRequired(true)); },
  execute: async (interaction) => {
    const playlists = await PlaylistService.byOwner(interaction.user.id);
    const source = playlists.find((p) => p.name.toLowerCase() === interaction.options.getString("source", true).toLowerCase());
    const target = playlists.find((p) => p.name.toLowerCase() === interaction.options.getString("target", true).toLowerCase());
    if (!source || !target) {
      await interaction.reply({ embeds: [errorEmbed("Playlist not found", "Check both playlist names.", "PL_001")], ephemeral: true });
      return;
    }
    await PlaylistService.merge(source.id, target.id);
    await interaction.reply({ embeds: [statusEmbed(`MERGED INTO ${target.name.toUpperCase()}`, "")] });
  },
};

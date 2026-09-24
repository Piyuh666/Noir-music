import { monoEmbed } from "../../ui/embeds";
import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";

export const search: MusicCommand = {
  meta: { id: "playlist.search", category: "playlists", description: "Search your playlists by name.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("query").setDescription("Search term").setRequired(true)); },
  execute: async (interaction) => {
    const query = interaction.options.getString("query", true);
    const results = await PlaylistService.search(interaction.user.id, query);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(`PLAYLISTS · "${query}"`).setDescription(results.map((p) => p.name).join("\n") || "No matches.");
    await interaction.reply({ embeds: [embed] });
  },
};

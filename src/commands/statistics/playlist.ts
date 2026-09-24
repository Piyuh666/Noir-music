import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { monoEmbed, errorEmbed } from "../../ui/embeds";

export const playlist: MusicCommand = {
  meta: { id: "stats.playlist", category: "statistics", description: "Show track count and duration for one of your playlists.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const name = interaction.options.getString("name", true);
    const playlists = await PlaylistService.byOwner(interaction.user.id);
    const found = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (!found) {
      await interaction.reply({ embeds: [errorEmbed("Playlist not found", `You don't have a playlist named "${name}".`, "PL_001")], ephemeral: true });
      return;
    }
    const { trackCount, totalMs } = await PlaylistService.stats(found.id);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(`${name.toUpperCase()} · STATS`).setDescription(`${trackCount} tracks\n${Math.floor(totalMs / 60000)}m total`);
    await interaction.reply({ embeds: [embed] });
  },
};

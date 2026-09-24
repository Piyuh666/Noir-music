import { monoEmbed } from "../../ui/embeds";
import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { resolveOwnedPlaylist } from "./helpers";

export const stats: MusicCommand = {
  meta: { id: "playlist.stats", category: "playlists", description: "Show track count and total duration for a playlist.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const { trackCount, totalMs } = await PlaylistService.stats(playlist.id);
    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(`${playlist.name.toUpperCase()} · STATS`).setDescription(`${trackCount} tracks\n${hrs}h ${mins}m total`);
    await interaction.reply({ embeds: [embed] });
  },
};

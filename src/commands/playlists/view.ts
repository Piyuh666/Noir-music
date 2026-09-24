import { monoEmbed } from "../../ui/embeds";
import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { resolveOwnedPlaylist } from "./helpers";

export const view: MusicCommand = {
  meta: { id: "playlist.view", category: "playlists", description: "View a playlist's tracks.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const tracks = await PlaylistService.list(playlist.id);
    const lines = tracks.slice(0, 20).map((t, i) => `${i + 1}. ${t.title} — ${t.artist}`).join("\n") || "Empty.";
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(playlist.name.toUpperCase()).setDescription(lines);
    await interaction.reply({ embeds: [embed] });
  },
};

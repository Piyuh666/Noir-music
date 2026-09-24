import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const lock: MusicCommand = {
  meta: { id: "playlist.lock", category: "playlists", description: "Lock a playlist against further edits.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const name = interaction.options.getString("name", true);
    const playlists = await PlaylistService.byOwner(interaction.user.id);
    const playlist = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (!playlist) {
      await interaction.reply({ embeds: [errorEmbed("Playlist not found", `You don't have a playlist named "${name}".`, "PL_001")], ephemeral: true });
      return;
    }
    await PlaylistService.lock(playlist.id);
    await interaction.reply({ embeds: [statusEmbed("PLAYLIST LOCKED", "")] });
  },
};

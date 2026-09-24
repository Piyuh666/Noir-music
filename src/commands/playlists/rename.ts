import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const rename: MusicCommand = {
  meta: { id: "playlist.rename", category: "playlists", description: "Rename a playlist.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Current name").setRequired(true)).addStringOption((o) => o.setName("new_name").setDescription("New name").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const newName = interaction.options.getString("new_name", true);
    await PlaylistService.rename(playlist.id, newName);
    await interaction.reply({ embeds: [statusEmbed(`RENAMED · ${newName}`, "")] });
  },
};

import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const transfer_owner: MusicCommand = {
  meta: { id: "playlist.transfer_owner", category: "playlists", description: "Transfer ownership of a playlist to someone else.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)).addUserOption((o) => o.setName("new_owner").setDescription("New owner").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const newOwner = interaction.options.getUser("new_owner", true);
    await PlaylistService.transferOwner(playlist.id, newOwner.id);
    await interaction.reply({ embeds: [statusEmbed(`OWNERSHIP TRANSFERRED · ${newOwner.username}`, "")] });
  },
};

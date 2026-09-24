import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const collaborate_add: MusicCommand = {
  meta: { id: "playlist.collaborate_add", category: "playlists", description: "Add a collaborator who can edit a playlist.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)).addUserOption((o) => o.setName("user").setDescription("Collaborator").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const user = interaction.options.getUser("user", true);
    await PlaylistService.addCollaborator(playlist.id, user.id);
    await interaction.reply({ embeds: [statusEmbed(`COLLABORATOR ADDED · ${user.username}`, "")] });
  },
};

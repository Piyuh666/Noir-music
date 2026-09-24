import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const restore: MusicCommand = {
  meta: { id: "playlist.restore", category: "playlists", description: "Restore a playlist's tracks from a named backup.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist to restore into").setRequired(true)).addStringOption((o) => o.setName("backup_name").setDescription("Backup playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const playlists = await PlaylistService.byOwner(interaction.user.id);
    const backupName = interaction.options.getString("backup_name", true);
    const backupPlaylist = playlists.find((p) => p.name.toLowerCase() === backupName.toLowerCase());
    if (!backupPlaylist) {
      await interaction.reply({ embeds: [errorEmbed("Backup not found", `No playlist named "${backupName}".`, "PL_001")], ephemeral: true });
      return;
    }
    await PlaylistService.restore(playlist.id, backupPlaylist.id);
    await interaction.reply({ embeds: [statusEmbed(`RESTORED · ${playlist.name}`, "")] });
  },
};

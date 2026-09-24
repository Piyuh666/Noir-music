import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { resolveOwnedPlaylist } from "./helpers";

export const export_: MusicCommand = {
  meta: { id: "playlist.export", category: "playlists", description: "Export a playlist as a JSON file.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const json = await PlaylistService.exportJson(playlist.id);
    const file = new AttachmentBuilder(Buffer.from(json, "utf-8"), { name: `${playlist.name}.json` });
    await interaction.reply({ files: [file] });
  },
};

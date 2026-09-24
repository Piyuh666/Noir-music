import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const sort: MusicCommand = {
  meta: { id: "playlist.sort", category: "playlists", description: "Sort a playlist by title, artist, or duration.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true))
      .addStringOption((o) => o.setName("by").setDescription("Sort key").setRequired(true).addChoices({ name: "title", value: "title" }, { name: "artist", value: "artist" }, { name: "duration", value: "duration" }));
  },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const by = interaction.options.getString("by", true) as "title" | "artist" | "duration";
    await PlaylistService.sort(playlist.id, by);
    await interaction.reply({ embeds: [statusEmbed(`SORTED BY ${by.toUpperCase()}`, "")] });
  },
};

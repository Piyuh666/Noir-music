import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const visibility: MusicCommand = {
  meta: { id: "playlist.visibility", category: "playlists", description: "Set a playlist's visibility.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true))
      .addStringOption((o) => o.setName("level").setDescription("Visibility level").setRequired(true).addChoices(
        { name: "private", value: "private" }, { name: "shared", value: "shared" }, { name: "server", value: "server" }, { name: "public", value: "public" }
      ));
  },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const level = interaction.options.getString("level", true) as "private" | "shared" | "server" | "public";
    await PlaylistService.setVisibility(playlist.id, level);
    await interaction.reply({ embeds: [statusEmbed(`VISIBILITY · ${level.toUpperCase()}`, "")] });
  },
};

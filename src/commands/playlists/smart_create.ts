import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";

export const smart_create: MusicCommand = {
  meta: { id: "playlist.smart_create", category: "playlists", description: "Create a smart playlist seeded from a genre (curate it manually with /playlist add).", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)).addStringOption((o) => o.setName("genre").setDescription("Seed genre").setRequired(true)); },
  execute: async (interaction) => {
    const name = interaction.options.getString("name", true);
    const genre = interaction.options.getString("genre", true);
    await PlaylistService.smartCreate(interaction.user.id, name, genre);
    await interaction.reply({ embeds: [statusEmbed(`SMART PLAYLIST CREATED · ${name}`, "")] });
  },
};

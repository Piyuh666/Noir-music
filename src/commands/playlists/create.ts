import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { statusEmbed } from "../../ui/embeds";

export const create: MusicCommand = {
  meta: { id: "playlist.create", category: "playlists", description: "Create a new playlist.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const name = interaction.options.getString("name", true);
    await PlaylistService.create(interaction.user.id, name, interaction.guildId ?? undefined);
    await interaction.reply({ embeds: [statusEmbed(`PLAYLIST CREATED · ${name}`, "")] });
  },
};

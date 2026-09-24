import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaylistService } from "../../services/playlistService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const load: MusicCommand = {
  meta: { id: "queue.load", category: "queue", description: "Load a saved playlist into the current queue.", changesPlaybackState: true, requiresDb: true, requiresProvider: true },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const session = GuildSession.for(interaction.guildId!);
    const player = session.player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Join a voice channel and play something first.", "PLAYER_006")], ephemeral: true });
      return;
    }
    const name = interaction.options.getString("name", true);
    const playlists = await PlaylistService.byOwner(interaction.user.id);
    const playlist = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (!playlist) {
      await interaction.reply({ embeds: [errorEmbed("Playlist not found", `No playlist named "${name}".`, "PL_001")], ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const tracks = await PlaylistService.list(playlist.id);
    for (const t of tracks) {
      const result = await session.search(player, t.trackUri, interaction.user);
      const found = result?.tracks?.[0];
      if (found) await session.addToQueue(player, found);
    }
    if (!player.playing) await player.play();
    await interaction.editReply({ embeds: [statusEmbed(`LOADED · ${name} (${tracks.length} tracks)`, "")] });
  },
};

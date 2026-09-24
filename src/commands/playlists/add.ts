import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaylistService } from "../../services/playlistService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { resolveOwnedPlaylist } from "./helpers";

export const add: MusicCommand = {
  meta: { id: "playlist.add", category: "playlists", description: "Add the currently playing track (or a search) to a playlist.", changesPlaybackState: false, requiresDb: true, requiresProvider: true },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true)).addStringOption((o) => o.setName("query").setDescription("Song to add (defaults to now playing)")); },
  execute: async (interaction) => {
    const playlist = await resolveOwnedPlaylist(interaction);
    if (!playlist) return;
    const query = interaction.options.getString("query");
    const session = GuildSession.for(interaction.guildId!);
    const player = session.player;

    let track: { uri: string; title: string; artist: string; durationMs: number } | null = null;
    if (query && player) {
      const result = await session.search(player, query, interaction.user);
      const t = result?.tracks?.[0];
      if (t) track = { uri: t.info.uri ?? t.info.identifier, title: t.info.title, artist: t.info.author, durationMs: t.info.duration ?? 0 };
    } else if (player?.queue.current) {
      const c = player.queue.current;
      track = { uri: c.info.uri ?? c.info.identifier, title: c.info.title, artist: c.info.author, durationMs: c.info.duration ?? 0 };
    }
    if (!track) {
      await interaction.reply({ embeds: [errorEmbed("Nothing to add", "Specify a query or have something playing.", "PL_003")], ephemeral: true });
      return;
    }
    await PlaylistService.addTrack(playlist.id, { ...track, addedById: interaction.user.id });
    await interaction.reply({ embeds: [statusEmbed(`ADDED TO ${playlist.name.toUpperCase()} · ${track.title}`, "")] });
  },
};

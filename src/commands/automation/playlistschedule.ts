import { SlashCommandBuilder, ChannelType } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { registerTimer, runGuildTimerAction } from "../../audio/timers";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const playlistschedule: MusicCommand = {
  meta: { id: "playlist_schedule", category: "automation", description: "Schedule one of your playlists to start playing after a delay.", changesPlaybackState: true, requiresDb: true, requiresProvider: true },
  build: (b) => {
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("name").setDescription("Playlist name").setRequired(true))
      .addIntegerOption((o) => o.setName("minutes").setDescription("Minutes from now").setRequired(true).setMinValue(1))
      .addChannelOption((o) => o.setName("voice_channel").setDescription("Voice channel to join").addChannelTypes(ChannelType.GuildVoice).setRequired(true));
  },
  execute: async (interaction) => {
    const name = interaction.options.getString("name", true);
    const playlists = await PlaylistService.byOwner(interaction.user.id);
    const playlist = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (!playlist) {
      await interaction.reply({ embeds: [errorEmbed("Playlist not found", `You don't have a playlist named "${name}".`, "PL_001")], ephemeral: true });
      return;
    }
    const minutes = interaction.options.getInteger("minutes", true);
    const voiceChannel = interaction.options.getChannel("voice_channel", true);
    registerTimer(interaction.guildId!, "playlist-schedule", minutes * 60 * 1000, async () => {
      const { GuildSession } = await import("../../audio/session");
      const tracks = await PlaylistService.list(playlist.id);
      const session = GuildSession.for(interaction.guildId!);
      const player = await session.ensurePlayer(voiceChannel.id, interaction.channelId);
      for (const t of tracks) await session.searchAndQueue(player, t.trackUri, interaction.user);
      await runGuildTimerAction(interaction.guildId!, async () => {
        if (!player.playing) await player.play();
      });
    });
    await interaction.reply({ embeds: [statusEmbed(`PLAYLIST SCHEDULED · in ${minutes}m`, "")] });
  },
};

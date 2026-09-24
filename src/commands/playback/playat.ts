import { SlashCommandBuilder, ChannelType } from "discord.js";
import { PlaybackService } from "../../audio/playbackService";
import { MusicCommand } from "../../types/command";
import { registerTimer, runGuildTimerAction } from "../../audio/timers";
import { statusEmbed } from "../../ui/embeds";

export const playat: MusicCommand = {
  meta: { id: "playat", category: "playback", description: "Schedule a track to start playing after a delay.", changesPlaybackState: true, requiresDb: false, requiresProvider: true },
  build: (b) => {
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("query").setDescription("Song to play").setRequired(true))
      .addIntegerOption((o) => o.setName("minutes").setDescription("Minutes from now").setRequired(true).setMinValue(1))
      .addChannelOption((o) => o.setName("voice_channel").setDescription("Voice channel").addChannelTypes(ChannelType.GuildVoice).setRequired(true));
  },
  execute: async (interaction) => {
    const query = interaction.options.getString("query", true);
    const minutes = interaction.options.getInteger("minutes", true);
    const voiceChannel = interaction.options.getChannel("voice_channel", true);
    registerTimer(interaction.guildId!, "playat", minutes * 60 * 1000, async () => {
      const { GuildSession } = await import("../../audio/session");
      const session = GuildSession.for(interaction.guildId!);
      const player = await session.ensurePlayer(voiceChannel.id, interaction.channelId);
      await session.searchAndQueue(player, query, interaction.user);
      await runGuildTimerAction(interaction.guildId!, async () => {
        if (!player.playing) await PlaybackService.play(interaction.guildId!);
      });
    });
    await interaction.reply({ embeds: [statusEmbed(`SCHEDULED · "${query}" in ${minutes}m`, "")] });
  },
};

import { SlashCommandBuilder, ChannelType } from "discord.js";
import { MusicCommand } from "../../types/command";
import { STATIONS } from "../../audio/radio";
import { statusEmbed, errorEmbed } from "../../ui/embeds";
import { registerTimer, clearTimersOfKind, runGuildTimerAction } from "../../audio/timers";

/**
 * In-memory scheduling (per-process). For multi-instance production
 * deployments, back this with a persisted job table + a scheduler
 * (e.g. BullMQ) instead of setTimeout, so a restart doesn't drop it.
 */
const scheduled = new Map<string, string>();

export const schedule: MusicCommand = {
  meta: { id: "radio.schedule", category: "radio", description: "Schedule a radio station to start after a delay.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("station").setDescription("Station").setRequired(true).addChoices(...STATIONS.map((s) => ({ name: s.name, value: s.id }))))
      .addIntegerOption((o) => o.setName("minutes").setDescription("Minutes from now").setRequired(true).setMinValue(1))
      .addChannelOption((o) => o.setName("voice_channel").setDescription("Voice channel to join").addChannelTypes(ChannelType.GuildVoice).setRequired(true));
  },
  execute: async (interaction) => {
    const minutes = interaction.options.getInteger("minutes", true);
    const stationId = interaction.options.getString("station", true);
    const voiceChannel = interaction.options.getChannel("voice_channel", true);
    const key = `${interaction.guildId}`;
    const previous = scheduled.get(key);
    if (previous) clearTimersOfKind(interaction.guildId!, "radio-schedule");

    const timer = registerTimer(interaction.guildId!, "radio-schedule", minutes * 60 * 1000, async () => {
      const { GuildSession } = await import("../../audio/session");
      const station = STATIONS.find((s) => s.id === stationId)!;
      const session = GuildSession.for(interaction.guildId!);
      const player = await session.ensurePlayer(voiceChannel.id, interaction.channelId);
      const result = await session.search(player, station.searchQuery, interaction.user);
      await session.addManyToQueue(player, (result?.tracks ?? []).slice(0, 10));
      await runGuildTimerAction(interaction.guildId!, async () => {
        if (!player.playing) await player.play();
      });
      scheduled.delete(key);
    });

    scheduled.set(key, timer.id);
    await interaction.reply({ embeds: [statusEmbed(`SCHEDULED · in ${minutes}m`, "")] });
  },
};

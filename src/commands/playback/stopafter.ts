import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { registerTimer, runGuildTimerAction } from "../../audio/timers";
import { statusEmbed } from "../../ui/embeds";

export const stopafter: MusicCommand = {
  meta: { id: "stopafter", category: "playback", description: "Stop playback after N minutes.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("minutes").setDescription("Minutes from now").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const minutes = interaction.options.getInteger("minutes", true);
    registerTimer(interaction.guildId!, "stopafter", minutes * 60 * 1000, async () => {
      await runGuildTimerAction(interaction.guildId!, async () => {
        const player = GuildSession.for(interaction.guildId!).player;
        if (!player) return;
        await PlaybackService.stop(interaction.guildId!);
      });
    });
    await interaction.reply({ embeds: [statusEmbed(`STOP SCHEDULED · in ${minutes}m`, "")] });
  },
};

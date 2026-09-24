import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { registerTimer, clearTimersOfKind, runGuildTimerAction } from "../../audio/timers";
import { statusEmbed } from "../../ui/embeds";

export const sleep: MusicCommand = {
  meta: { id: "sleep", category: "automation", description: "Fade out and stop playback after N minutes.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("minutes").setDescription("Minutes until sleep").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const minutes = interaction.options.getInteger("minutes", true);
    clearTimersOfKind(interaction.guildId!, "sleep");
    registerTimer(interaction.guildId!, "sleep", minutes * 60 * 1000, async () => {
      const player = GuildSession.for(interaction.guildId!).player;
      if (!player) return;
      // Fade over the last 10 seconds rather than cutting abruptly.
      const startVol = player.volume;
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        if (!player.queue.current) break;
        await runGuildTimerAction(interaction.guildId!, async () => {
          if (player.queue.current) await player.setVolume(Math.max(0, Math.round(startVol * (1 - i / steps))));
        });
        if (i < steps) await new Promise((r) => setTimeout(r, 1000));
      }
      await runGuildTimerAction(interaction.guildId!, async () => {
        if (player.queue.current) await player.stopPlaying(true, false);
        await player.setVolume(startVol);
      });
    });
    await interaction.reply({ embeds: [statusEmbed(`SLEEP TIMER · ${minutes}m`, "")] });
  },
};

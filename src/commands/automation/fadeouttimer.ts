import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { registerTimer, runGuildTimerAction } from "../../audio/timers";
import { statusEmbed } from "../../ui/embeds";

export const fadeouttimer: MusicCommand = {
  meta: { id: "fade_out_timer", category: "automation", description: "Gradually fade volume to 0 over N minutes, then pause.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("minutes").setDescription("Fade duration").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const minutes = interaction.options.getInteger("minutes", true);
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [statusEmbed("NO ACTIVE PLAYER", "Nothing is currently playing.")] });
      return;
    }
    const startVol = Math.max(0, Math.min(150, Number(player.volume) || 0));
    const steps = Math.max(1, Math.min(720, minutes * 6));
    registerTimer(interaction.guildId!, "fade-out", 1, async () => {
      for (let i = 1; i <= steps; i++) {
        if (!player.queue.current) break;
        await runGuildTimerAction(interaction.guildId!, async () => {
          if (player.queue.current) await player.setVolume(Math.max(0, Math.round(startVol * (1 - i / steps))));
        });
        if (i < steps) await new Promise<void>((resolve) => setTimeout(resolve, 10_000));
      }
      await runGuildTimerAction(interaction.guildId!, async () => {
        if (player.queue.current) {
          await player.pause();
          await player.setVolume(startVol);
        }
      });
    });
    await interaction.reply({ embeds: [statusEmbed(`FADING OUT OVER ${minutes}m`, "")] });
  },
};

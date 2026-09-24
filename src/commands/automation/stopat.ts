import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { registerTimer, runGuildTimerAction } from "../../audio/timers";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

function parseClock(input: string): number | null {
  const match = input.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const now = new Date();
  const target = new Date(now);
  target.setHours(Number(match[1]), Number(match[2]), 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

export const stopat: MusicCommand = {
  meta: { id: "stop_at", category: "automation", description: "Stop playback at a specific clock time (HH:MM, server local time).", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("time").setDescription("HH:MM 24h").setRequired(true)); },
  execute: async (interaction) => {
    const time = interaction.options.getString("time", true);
    const delay = parseClock(time);
    if (delay === null) {
      await interaction.reply({ embeds: [errorEmbed("Invalid time", "Use 24h HH:MM format, e.g. 23:30.", "AUTO_001")], ephemeral: true });
      return;
    }
    registerTimer(interaction.guildId!, "stop-at", delay, async () => {
      await runGuildTimerAction(interaction.guildId!, async () => {
        await GuildSession.for(interaction.guildId!).player?.stopPlaying(true, false);
      });
    });
    await interaction.reply({ embeds: [statusEmbed(`STOP SCHEDULED · ${time}`, "")] });
  },
};

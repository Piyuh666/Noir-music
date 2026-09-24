import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { listTimers } from "../../audio/timers";

export const timerstatus: MusicCommand = {
  meta: { id: "timer_status", category: "automation", description: "List all active timers for this server.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const timers = listTimers(interaction.guildId!);
    const lines = timers.map((t) => `${t.kind} — fires in ${Math.max(0, Math.round((t.fireAt - Date.now()) / 60000))}m`);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("ACTIVE TIMERS").setDescription(lines.join("\n") || "No active timers.");
    await interaction.reply({ embeds: [embed] });
  },
};

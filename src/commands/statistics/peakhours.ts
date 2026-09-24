import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";

export const peakhours: MusicCommand = {
  meta: { id: "stats.peak_hours", category: "statistics", description: "Show which hours (UTC) you listen most.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const buckets = await StatsService.peakHours(interaction.user.id);
    const max = Math.max(1, ...buckets);
    const bars = buckets.map((v, h) => `${String(h).padStart(2, "0")}h ${"█".repeat(Math.round((v / max) * 10))}`).join("\n");
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("PEAK LISTENING HOURS (UTC)").setDescription(bars || "No data yet.");
    await interaction.reply({ embeds: [embed] });
  },
};

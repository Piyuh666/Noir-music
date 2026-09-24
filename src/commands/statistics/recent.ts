import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";

export const recent: MusicCommand = {
  meta: { id: "recent", category: "statistics", description: "Show your last 5 played tracks.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const rows = await StatsService.recentForUser(interaction.user.id, 5);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("RECENTLY PLAYED").setDescription(rows.map((r) => `${r.title} — ${r.artist}`).join("\n") || "No history yet.");
    await interaction.reply({ embeds: [embed] });
  },
};

import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";

export const history: MusicCommand = {
  meta: { id: "history", category: "statistics", description: "Show your full recent play history.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const rows = await StatsService.recentForUser(interaction.user.id, 20);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("HISTORY").setDescription(rows.map((r) => `${r.title} — ${r.artist}`).join("\n") || "No history yet.");
    await interaction.reply({ embeds: [embed] });
  },
};

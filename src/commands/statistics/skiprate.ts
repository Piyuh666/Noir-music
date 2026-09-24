import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";
import { statusEmbed } from "../../ui/embeds";

export const skiprate: MusicCommand = {
  meta: { id: "stats.skip_rate", category: "statistics", description: "Show what percentage of your tracks you skip.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const rate = await StatsService.skipRate(interaction.user.id);
    await interaction.reply({ embeds: [statusEmbed(`SKIP RATE · ${Math.round(rate * 100)}%`, "")] });
  },
};

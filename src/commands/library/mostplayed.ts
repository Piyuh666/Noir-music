import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";

export const mostplayed: MusicCommand = {
  meta: { id: "most_played", category: "library", description: "Show your most-played tracks.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const rows = await StatsService.topTracksForUser(interaction.user.id);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("MOST PLAYED").setDescription(rows.map((r, i) => `${i + 1}. ${r.title} — ${r._count.trackUri} plays`).join("\n") || "No data yet.");
    await interaction.reply({ embeds: [embed] });
  },
};

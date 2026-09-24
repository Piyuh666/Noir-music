import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";

export const recentlyplayed: MusicCommand = {
  meta: { id: "recently_played", category: "library", description: "Show your recently played tracks.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const rows = await StatsService.recentForUser(interaction.user.id, 15);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("RECENTLY PLAYED").setDescription(rows.map((r) => `${r.title} — ${r.artist}`).join("\n") || "No history yet.");
    await interaction.reply({ embeds: [embed] });
  },
};

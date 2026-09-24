import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";

export const topartists: MusicCommand = {
  meta: { id: "top_artists_personal", category: "statistics", description: "Show your most-played artists.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const rows = await StatsService.topArtistsForUser(interaction.user.id);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("TOP ARTISTS").setDescription(rows.map((r, i) => `${i + 1}. ${r.artist} — ${r._count.artist} plays`).join("\n") || "No data yet.");
    await interaction.reply({ embeds: [embed] });
  },
};

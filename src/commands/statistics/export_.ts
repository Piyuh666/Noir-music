import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";
import { AttachmentBuilder } from "discord.js";

export const export_: MusicCommand = {
  meta: { id: "stats.export", category: "statistics", description: "Export your listening history as JSON.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const rows = await StatsService.recentForUser(interaction.user.id, 500);
    const file = new AttachmentBuilder(Buffer.from(JSON.stringify(rows, null, 2), "utf-8"), { name: "listening-history.json" });
    await interaction.reply({ files: [file], ephemeral: true });
  },
};

import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const shuffle: MusicCommand = {
  meta: { id: "library.shuffle", category: "library", description: "View your library in random order (display-only — favorites have no persisted ordering to shuffle in place).", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const rows = user ? await prisma.favorite.findMany({ where: { userId: user.id } }) : [];
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("LIBRARY (SHUFFLED VIEW)").setDescription(rows.slice(0, 20).map((r) => `${r.title} — ${r.artist}`).join("\n") || "Empty.");
    await interaction.reply({ embeds: [embed] });
  },
};

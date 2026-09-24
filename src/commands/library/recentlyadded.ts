import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const recentlyadded: MusicCommand = {
  meta: { id: "recently_added", category: "library", description: "Show tracks you recently added to your favorites.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const rows = user ? await prisma.favorite.findMany({ where: { userId: user.id }, orderBy: { favoritedAt: "desc" }, take: 10 }) : [];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("RECENTLY ADDED").setDescription(rows.map((r) => `${r.title} — ${r.artist}`).join("\n") || "Nothing added yet.");
    await interaction.reply({ embeds: [embed] });
  },
};

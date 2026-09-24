import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const favorites: MusicCommand = {
  meta: { id: "favorites", category: "library", description: "List your favorited tracks.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const rows = user ? await prisma.favorite.findMany({ where: { userId: user.id, trackUri: { not: { startsWith: "playlist:" } } }, orderBy: { favoritedAt: "desc" }, take: 20 }) : [];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("FAVORITES").setDescription(rows.map((r) => `${r.title} — ${r.artist}`).join("\n") || "No favorites yet.");
    await interaction.reply({ embeds: [embed] });
  },
};

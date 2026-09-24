import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const likedsongs: MusicCommand = {
  meta: { id: "liked_songs", category: "library", description: "Show your liked songs (same underlying favorites, oldest first).", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const rows = user ? await prisma.favorite.findMany({ where: { userId: user.id, trackUri: { not: { startsWith: "playlist:" } } }, orderBy: { favoritedAt: "asc" }, take: 25 }) : [];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("LIKED SONGS").setDescription(rows.map((r) => `${r.title} — ${r.artist}`).join("\n") || "No liked songs yet.");
    await interaction.reply({ embeds: [embed] });
  },
};

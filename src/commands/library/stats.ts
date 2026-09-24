import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const stats: MusicCommand = {
  meta: { id: "library.stats", category: "library", description: "Show summary stats for your library.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const count = user ? await prisma.favorite.count({ where: { userId: user.id, trackUri: { not: { startsWith: "playlist:" } } } }) : 0;
    const artistCount = user ? new Set((await prisma.favorite.findMany({ where: { userId: user.id } })).map((r) => r.artist)).size : 0;
    await interaction.reply({ embeds: [statusEmbed(`LIBRARY · ${count} tracks · ${artistCount} artists`, "")] });
  },
};

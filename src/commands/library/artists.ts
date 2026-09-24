import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const artists: MusicCommand = {
  meta: { id: "library.artists", category: "library", description: "Show unique artists in your library.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const rows = user ? await prisma.favorite.findMany({ where: { userId: user.id } }) : [];
    const artists = [...new Set(rows.map((r) => r.artist))];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("LIBRARY ARTISTS").setDescription(artists.join("\n") || "Empty.");
    await interaction.reply({ embeds: [embed] });
  },
};

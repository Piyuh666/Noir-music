import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const view: MusicCommand = {
  meta: { id: "library.view", category: "library", description: "View your full favorites library.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const rows = user ? await prisma.favorite.findMany({ where: { userId: user.id, trackUri: { not: { startsWith: "playlist:" } } } }) : [];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("YOUR LIBRARY").setDescription(`${rows.length} favorited tracks`);
    await interaction.reply({ embeds: [embed] });
  },
};

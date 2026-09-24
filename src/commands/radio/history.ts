import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const history: MusicCommand = {
  meta: { id: "radio.history", category: "radio", description: "Show your recently played radio stations.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const rows = user ? await prisma.playHistory.findMany({ where: { userId: user.id, trackUri: { startsWith: "station:" } }, orderBy: { playedAt: "desc" }, take: 10 }) : [];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("RADIO HISTORY").setDescription(rows.map((r) => r.title).join("\n") || "No radio history yet.");
    await interaction.reply({ embeds: [embed] });
  },
};

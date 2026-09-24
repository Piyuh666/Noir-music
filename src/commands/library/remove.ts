import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const remove: MusicCommand = {
  meta: { id: "library.remove", category: "library", description: "Remove a track from your library by title.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("title").setDescription("Track title").setRequired(true)); },
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const title = interaction.options.getString("title", true);
    const found = user ? await prisma.favorite.findFirst({ where: { userId: user.id, title: { contains: title, mode: "insensitive" } } }) : null;
    if (!found) {
      await interaction.reply({ embeds: [errorEmbed("Not found", `No favorited track matching "${title}".`, "LIB_002")], ephemeral: true });
      return;
    }
    await prisma.favorite.delete({ where: { id: found.id } });
    await interaction.reply({ embeds: [statusEmbed(`REMOVED · ${found.title}`, "")] });
  },
};

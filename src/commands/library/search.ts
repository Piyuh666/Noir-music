import { monoEmbed } from "../../ui/embeds";
import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const search: MusicCommand = {
  meta: { id: "library.search", category: "library", description: "Search your library by title or artist.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("query").setDescription("Search term").setRequired(true)); },
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const query = interaction.options.getString("query", true);
    const rows = user
      ? await prisma.favorite.findMany({ where: { userId: user.id, OR: [{ title: { contains: query, mode: "insensitive" } }, { artist: { contains: query, mode: "insensitive" } }] } })
      : [];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(`LIBRARY · "${query}"`).setDescription(rows.map((r) => `${r.title} — ${r.artist}`).join("\n") || "No matches.");
    await interaction.reply({ embeds: [embed] });
  },
};

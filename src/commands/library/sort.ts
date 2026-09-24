import { monoEmbed } from "../../ui/embeds";
import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const sort: MusicCommand = {
  meta: { id: "library.sort", category: "library", description: "View your library sorted by title, artist, or date added.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("by").setDescription("Sort key").setRequired(true).addChoices({ name: "title", value: "title" }, { name: "artist", value: "artist" }, { name: "date-added", value: "favoritedAt" }));
  },
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const by = interaction.options.getString("by", true) as "title" | "artist" | "favoritedAt";
    const rows = user ? await prisma.favorite.findMany({ where: { userId: user.id }, orderBy: { [by]: "asc" } }) : [];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(`LIBRARY · sorted by ${by}`).setDescription(rows.map((r) => `${r.title} — ${r.artist}`).join("\n") || "Empty.");
    await interaction.reply({ embeds: [embed] });
  },
};

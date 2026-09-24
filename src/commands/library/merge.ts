import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const merge: MusicCommand = {
  meta: { id: "library.merge", category: "library", description: "Merge another member's favorites into yours.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addUserOption((o) => o.setName("from").setDescription("Member whose favorites to merge in").setRequired(true)); },
  execute: async (interaction) => {
    const fromUser = interaction.options.getUser("from", true);
    const other = await prisma.user.findUnique({ where: { discordId: fromUser.id } });
    if (!other) {
      await interaction.reply({ embeds: [errorEmbed("No data", `${fromUser.username} has no library yet.`, "LIB_004")], ephemeral: true });
      return;
    }
    const me = await prisma.user.upsert({ where: { discordId: interaction.user.id }, update: {}, create: { discordId: interaction.user.id } });
    const theirs = await prisma.favorite.findMany({ where: { userId: other.id } });
    for (const t of theirs) {
      await prisma.favorite.upsert({ where: { userId_trackUri: { userId: me.id, trackUri: t.trackUri } }, update: {}, create: { userId: me.id, trackUri: t.trackUri, title: t.title, artist: t.artist } });
    }
    await interaction.reply({ embeds: [statusEmbed(`MERGED ${theirs.length} TRACKS`, "")] });
  },
};

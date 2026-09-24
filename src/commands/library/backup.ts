import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { AttachmentBuilder } from "discord.js";

export const backup: MusicCommand = {
  meta: { id: "library.backup", category: "library", description: "Create a timestamped backup export of your library.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const rows = user ? await prisma.favorite.findMany({ where: { userId: user.id } }) : [];
    const file = new AttachmentBuilder(Buffer.from(JSON.stringify(rows, null, 2), "utf-8"), { name: `library-backup-${new Date().toISOString().slice(0, 10)}.json` });
    await interaction.reply({ files: [file], ephemeral: true });
  },
};

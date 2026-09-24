import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const unfavorite: MusicCommand = {
  meta: { id: "unfavorite", category: "library", description: "Remove the currently playing track from favorites.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const current = GuildSession.for(interaction.guildId!).player?.queue.current;
    if (!current) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "LIB_001")], ephemeral: true });
      return;
    }
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    if (user) await prisma.favorite.deleteMany({ where: { userId: user.id, trackUri: current.info.uri ?? current.info.identifier } });
    await interaction.reply({ embeds: [statusEmbed(`UNFAVORITED · ${current.info.title}`, "")] });
  },
};

import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const favorite: MusicCommand = {
  meta: { id: "favorite", category: "library", description: "Favorite the currently playing track.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const current = GuildSession.for(interaction.guildId!).player?.queue.current;
    if (!current) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "LIB_001")], ephemeral: true });
      return;
    }
    const user = await prisma.user.upsert({ where: { discordId: interaction.user.id }, update: {}, create: { discordId: interaction.user.id } });
    await prisma.favorite.upsert({
      where: { userId_trackUri: { userId: user.id, trackUri: current.info.uri ?? current.info.identifier } },
      update: {},
      create: { userId: user.id, trackUri: current.info.uri ?? current.info.identifier, title: current.info.title, artist: current.info.author },
    });
    await interaction.reply({ embeds: [statusEmbed(`FAVORITED · ${current.info.title}`, "")] });
  },
};

import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const autoplay: MusicCommand = {
  meta: { id: "music_settings.autoplay", category: "settings", description: "Toggle server-wide default autoplay.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const guild = await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: {}, create: { discordId: interaction.guildId! } });
    const updated = await prisma.guild.update({ where: { discordId: interaction.guildId! }, data: { autoplay: !guild.autoplay } });
    const { GuildSession } = await import("../../audio/session");
    GuildSession.for(interaction.guildId!).player?.setData("autoplay", updated.autoplay);
    await interaction.reply({ embeds: [statusEmbed(`AUTOPLAY ${updated.autoplay ? "ON" : "OFF"}`, "")] });
  },
};

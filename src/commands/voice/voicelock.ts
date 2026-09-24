import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const voicelock: MusicCommand = {
  meta: { id: "voice.lock", category: "voice", description: "Prevent the bot from being moved to another voice channel.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { voiceLocked: true }, create: { discordId: interaction.guildId!, voiceLocked: true } });
    const { GuildSession } = await import("../../audio/session");
    GuildSession.for(interaction.guildId!).player?.setData("voiceLocked", true);
    await interaction.reply({ embeds: [statusEmbed("VOICE CHANNEL LOCKED", "")] });
  },
};

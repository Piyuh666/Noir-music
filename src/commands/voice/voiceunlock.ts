import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const voiceunlock: MusicCommand = {
  meta: { id: "voice.unlock", category: "voice", description: "Allow the bot to be moved between voice channels again.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    GuildSession.for(interaction.guildId!).player?.setData("voiceLocked", false);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { voiceLocked: false }, create: { discordId: interaction.guildId!, voiceLocked: false } });
    await interaction.reply({ embeds: [statusEmbed("VOICE CHANNEL UNLOCKED", "")] });
  },
};

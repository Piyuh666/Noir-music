import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed, errorEmbed } from "../../ui/embeds";

export const stay: MusicCommand = {
  meta: { id: "voice.stay", category: "voice", permissions: ["ManageGuild"], description: "Toggle whether the bot remains connected when the queue is empty.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("Not connected", "Join a voice channel first.", "VOICE_002")], ephemeral: true });
      return;
    }
    const enabled = !Boolean(player.getData<boolean>("stayInChannel"));
    player.setData("stayInChannel", enabled);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: {}, create: { discordId: interaction.guildId! } });
    await interaction.reply({ embeds: [statusEmbed(`STAY MODE ${enabled ? "ON" : "OFF"}`, "")] });
  },
};

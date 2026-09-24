import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const list: MusicCommand = {
  meta: { id: "dj.list", category: "dj", description: "Show the current DJ role and configuration.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! }, include: { djConfig: true } });
    const config = guild?.djConfig;
    const description = config
      ? `Role: ${guild?.djRoleId ? `<@&${guild.djRoleId}>` : "not set"}\nMode: ${config.enforcementMode}\nRequest-only: ${config.requestOnly}`
      : "DJ mode is not enabled.";
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("DJ CONFIG").setDescription(description);
    await interaction.reply({ embeds: [embed] });
  },
};

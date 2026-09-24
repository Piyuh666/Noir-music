import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const unlock: MusicCommand = {
  meta: { id: "dj.unlock", category: "dj", description: "Open ALL actions back up to everyone.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const config = await prisma.guildDjConfig.findUnique({ where: { guildId: interaction.guildId! } });
    if (!config) {
      await interaction.reply({ embeds: [errorEmbed("DJ mode not enabled", "Run /dj enable first.", "DJ_001")], ephemeral: true });
      return;
    }
    const perms = JSON.parse(config.permissionsJson || "{}");
    for (const key of ["play", "skip", "stop", "queue", "volume", "effects", "playlist", "radio", "disconnect", "settings"]) perms[key] = "everyone";
    await prisma.guildDjConfig.update({ where: { guildId: interaction.guildId! }, data: { permissionsJson: JSON.stringify(perms) } });
    await interaction.reply({ embeds: [statusEmbed("ALL ACTIONS OPENED", "")] });
  },
};

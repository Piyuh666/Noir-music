import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const support: MusicCommand = {
  meta: { id: "help.support", category: "help", description: "Show where to get support for this bot.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    await interaction.reply({ embeds: [statusEmbed("SUPPORT", "· contact your server admin, or the bot host's configured support channel")], ephemeral: true });
  },
};

import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const leave: MusicCommand = {
  meta: { id: "leave", category: "voice", description: "Disconnect and clear the session.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    await GuildSession.for(interaction.guildId!).destroy();
    await interaction.reply({ embeds: [statusEmbed("DISCONNECTED", "")] });
  },
};

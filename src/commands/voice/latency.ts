import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const latency: MusicCommand = {
  meta: { id: "voice.latency", category: "voice", description: "Show current voice connection latency.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    await interaction.reply({ embeds: [statusEmbed(`LATENCY · ${player?.ping ?? "n/a"}ms`, "")], ephemeral: true });
  },
};

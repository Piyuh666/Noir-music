import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";

export const voicediagnostics: MusicCommand = {
  meta: { id: "voice.diagnostics", category: "voice", description: "Show low-level voice connection diagnostics.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle("VOICE DIAGNOSTICS")
      .setDescription(player ? `Ping: ${player.ping ?? "n/a"}ms\nConnected: ${player.connected}\nChannel: <#${player.voiceChannelId}>` : "Not connected.");
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

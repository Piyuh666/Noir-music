import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";

export const voicestatus: MusicCommand = {
  meta: { id: "voice.status", category: "voice", description: "Show the bot's current voice connection status.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle("VOICE STATUS")
      .setDescription(player ? `Connected · channel <#${player.voiceChannelId}>\nPlaying: ${player.playing}` : "Not connected.");
    await interaction.reply({ embeds: [embed] });
  },
};

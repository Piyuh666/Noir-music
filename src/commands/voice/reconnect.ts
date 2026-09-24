import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const reconnect: MusicCommand = {
  meta: { id: "voice.reconnect", category: "voice", description: "Force a fresh voice reconnect without losing the queue.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("Not connected", "Use /join first.", "VOICE_002")], ephemeral: true });
      return;
    }
    const channelId = player.voiceChannelId;
    if (!channelId) {
      await interaction.reply({ embeds: [errorEmbed("No voice channel", "NOIR MUSIC is not currently connected to a voice channel.", "VOICE_004")], ephemeral: true });
      return;
    }
    await player.disconnect();
    await player.connect();
    await player.changeVoiceState({ voiceChannelId: channelId });
    await interaction.reply({ embeds: [statusEmbed("RECONNECTED", "")] });
  },
};

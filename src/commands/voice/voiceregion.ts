import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const voiceregion: MusicCommand = {
  meta: { id: "voice.region", category: "voice", description: "Show the RTC region of the bot's current voice channel.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("Not connected", "Use /join first.", "VOICE_002")], ephemeral: true });
      return;
    }
    const channel = interaction.guild?.channels.cache.get(player.voiceChannelId!);
    const region = (channel as any)?.rtcRegion ?? "automatic";
    await interaction.reply({ embeds: [statusEmbed(`VOICE REGION · ${region}`, "")] });
  },
};

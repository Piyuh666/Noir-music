import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const disconnect: MusicCommand = {
  meta: { id: "voice.disconnect", category: "voice", description: "Gracefully disconnect, fading out first if something is playing.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const session = GuildSession.for(interaction.guildId!);
    const player = session.player;
    if (player?.playing) {
      const start = player.volume;
      for (let i = 1; i <= 5; i++) {
        await player.setVolume(Math.round(start * (1 - i / 5)));
        await new Promise((r) => setTimeout(r, 400));
      }
    }
    await session.destroy();
    await interaction.reply({ embeds: [statusEmbed("DISCONNECTED", "")] });
  },
};

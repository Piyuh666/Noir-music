import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const stop: MusicCommand = {
  meta: { id: "radio.stop", category: "radio", description: "Stop the active radio station.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.getData("radioStation")) {
      await interaction.reply({ embeds: [errorEmbed("No radio active", "Start one with /radio play.", "RADIO_002")], ephemeral: true });
      return;
    }
    player.setData("radioStation", undefined);
        player.setData("radioQuery", undefined);
    player.setData("autoplay", false);
    await player.stopPlaying(true, false);
    await interaction.reply({ embeds: [statusEmbed("RADIO STOPPED", "")] });
  },
};

import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { STATIONS } from "../../audio/radio";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const info: MusicCommand = {
  meta: { id: "radio.info", category: "radio", description: "Show the currently active radio station.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const current = player?.getData("radioStation") as string | undefined;
    if (!current) {
      await interaction.reply({ embeds: [errorEmbed("No radio active", "Start one with /radio play.", "RADIO_002")], ephemeral: true });
      return;
    }
    const station = STATIONS.find((s) => s.id === current);
    await interaction.reply({ embeds: [statusEmbed(`RADIO · ${station?.name ?? current}`, "")] });
  },
};

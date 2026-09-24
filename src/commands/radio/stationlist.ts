import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { STATIONS } from "../../audio/radio";

export const stationlist: MusicCommand = {
  meta: { id: "radio.station_list", category: "radio", description: "List available radio stations.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("STATIONS").setDescription(STATIONS.map((s) => `• ${s.name}`).join("\n"));
    await interaction.reply({ embeds: [embed] });
  },
};

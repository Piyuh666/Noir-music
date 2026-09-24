import { MusicCommand } from "../../types/command";
import { clearTimersOfKind } from "../../audio/timers";
import { statusEmbed } from "../../ui/embeds";

export const sleepcancel: MusicCommand = {
  meta: { id: "sleep_cancel", category: "automation", description: "Cancel an active sleep timer.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    clearTimersOfKind(interaction.guildId!, "sleep");
    await interaction.reply({ embeds: [statusEmbed("SLEEP TIMER CANCELED", "")] });
  },
};

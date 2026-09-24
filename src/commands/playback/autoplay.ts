import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const autoplay: MusicCommand = {
  meta: {
    id: "autoplay",
    category: "playback",
    description: "Toggle autoplay of related tracks when the queue empties.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: true,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "PLAYER_010")], ephemeral: true });
      return;
    }
    const current = Boolean(player.getData("autoplay"));
    player.setData("autoplay", !current);
    await interaction.reply({ embeds: [statusEmbed(`AUTOPLAY ${!current ? "ON" : "OFF"}`, "")] });
  },
};

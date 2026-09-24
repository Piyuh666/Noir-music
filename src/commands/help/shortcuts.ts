import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";

export const shortcuts: MusicCommand = {
  meta: { id: "help.shortcuts", category: "help", description: "Show the player message's button shortcuts.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle("PLAYER SHORTCUTS")
      .setDescription("⏮ previous · ⏯ play/pause · ⏭ skip · 🔁 loop · 🔀 shuffle\nQUEUE · LYRICS · EFFECTS · ❤️ favorite");
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

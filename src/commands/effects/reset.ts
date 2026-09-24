import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { clearAllEffects } from "../../audio/filters";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const reset: MusicCommand = {
  meta: { id: "effect.reset", category: "effects", description: "Clear every active effect.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "FX_001")], ephemeral: true });
      return;
    }
    await clearAllEffects(player);
    player.setData("activeEffects", []);
    await interaction.reply({ embeds: [statusEmbed("EFFECTS RESET", "")] });
  },
};

import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { EFFECTS } from "../../audio/filters";

export const chainview: MusicCommand = {
  meta: { id: "effect.chain_view", category: "effects", description: "Show the current effect chain in application order.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const active = (player?.getData("activeEffects") as string[]) ?? [];
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle("EFFECT CHAIN")
      .setDescription(active.length ? active.map((id, i) => `${i + 1}. ${EFFECTS[id as keyof typeof EFFECTS]?.label ?? id}`).join("\n") : "No active effects.");
    await interaction.reply({ embeds: [embed] });
  },
};

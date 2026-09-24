import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { EFFECTS } from "../../audio/filters";

export const list: MusicCommand = {
  meta: { id: "effect.list", category: "effects", description: "List every available effect and which are currently active.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const active = new Set((player?.getData("activeEffects") as string[]) ?? []);
    const lines = Object.values(EFFECTS).map((e) => `${active.has(e.id) ? "●" : "○"} ${e.label}`);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("EFFECTS").setDescription(lines.join("\n"));
    await interaction.reply({ embeds: [embed] });
  },
};

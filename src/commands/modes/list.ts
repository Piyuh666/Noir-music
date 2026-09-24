import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { MODES } from "../../audio/modes";

export const list: MusicCommand = {
  meta: { id: "mode.list", category: "modes", description: "List every playback mode and which is active.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const active = player?.getData("mode") as string | undefined;
    const lines = Object.values(MODES).map((m) => `${active === m.id ? "●" : "○"} ${m.label} — ${m.description}`);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("MODES").setDescription(lines.join("\n"));
    await interaction.reply({ embeds: [embed] });
  },
};

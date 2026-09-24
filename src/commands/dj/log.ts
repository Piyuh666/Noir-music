import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";

const djLog: Record<string, string[]> = {};
export function logDjAction(guildId: string, entry: string) {
  djLog[guildId] = [...(djLog[guildId] ?? []).slice(-19), entry];
}

export const log: MusicCommand = {
  meta: { id: "dj.log", category: "dj", description: "Show recent DJ-gated actions in this server.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const entries = djLog[interaction.guildId!] ?? [];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("DJ LOG").setDescription(entries.join("\n") || "No DJ actions logged yet in this process.");
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

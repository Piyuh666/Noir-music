import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";

const recentEvents: Record<string, string[]> = {};

export function logVoiceEvent(guildId: string, event: string) {
  recentEvents[guildId] = [...(recentEvents[guildId] ?? []).slice(-9), `${new Date().toISOString()} — ${event}`];
}

export const voicelog: MusicCommand = {
  meta: { id: "voice.log", category: "voice", description: "Show recent voice connection events for this server.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const events = recentEvents[interaction.guildId!] ?? [];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("VOICE LOG").setDescription(events.join("\n") || "No recent events.");
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

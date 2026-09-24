import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

function parseTimestamp(input: string): number | null {
  const parts = input.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  if (parts.length === 1) return parts[0] * 1000;
  return null;
}

export const seek: MusicCommand = {
  meta: {
    id: "seek",
    category: "playback",
    description: "Jump to a specific position in the current track.",
    example: "/seek position:1:42",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("position").setDescription("mm:ss or seconds").setRequired(true)
    );
  },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.playing) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "PLAYER_007")], ephemeral: true });
      return;
    }
    const raw = interaction.options.getString("position", true);
    const ms = parseTimestamp(raw);
    if (ms === null) {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "Use mm:ss, e.g. 1:42.", "PLAYER_008")], ephemeral: true });
      return;
    }
    await PlaybackService.seek(interaction.guildId!, ms);
    await interaction.reply({ embeds: [statusEmbed(`SEEK ${raw}`, "")] });
  },
};

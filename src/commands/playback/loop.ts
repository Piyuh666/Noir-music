import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const loop: MusicCommand = {
  meta: {
    id: "loop",
    category: "playback",
    description: "Set loop mode: off, track, or queue.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o
        .setName("mode")
        .setDescription("off, track, or queue")
        .setRequired(true)
        .addChoices(
          { name: "off", value: "off" },
          { name: "track", value: "track" },
          { name: "queue", value: "queue" }
        )
    );
  },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "PLAYER_009")], ephemeral: true });
      return;
    }
    const mode = interaction.options.getString("mode", true) as "off" | "track" | "queue";
    await PlaybackService.setRepeat(interaction.guildId!, mode);
    await interaction.reply({ embeds: [statusEmbed(`LOOP ${mode.toUpperCase()}`, "")] });
  },
};

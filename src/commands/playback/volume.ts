import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const volume: MusicCommand = {
  meta: {
    id: "volume",
    category: "playback",
    description: "Set or view the playback volume.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: (b) => {
    (b as SlashCommandBuilder).addIntegerOption((o) =>
      o.setName("level").setDescription("0-150").setMinValue(0).setMaxValue(150)
    );
  },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "PLAYER_006")], ephemeral: true });
      return;
    }
    const level = interaction.options.getInteger("level");
    if (level === null) {
      await interaction.reply({ embeds: [statusEmbed(`VOL ${player.volume}%`, "")] });
      return;
    }
    await PlaybackService.setVolume(interaction.guildId!, level);
    await interaction.reply({ embeds: [statusEmbed(`VOL ${level}%`, "")] });
  },
};

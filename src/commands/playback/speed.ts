import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const speed: MusicCommand = {
  meta: { id: "playback.speed", category: "playback", description: "Set playback speed as a percentage (distinct shortcut from /effect speed-effect).", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("percent").setDescription("50-200").setRequired(true).setMinValue(50).setMaxValue(200)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "PLAYER_006")], ephemeral: true });
      return;
    }
    const percent = interaction.options.getInteger("percent", true);
    await PlaybackService.setSpeed(interaction.guildId!, percent);
    await interaction.reply({ embeds: [statusEmbed(`SPEED · ${percent}%`, "")] });
  },
};

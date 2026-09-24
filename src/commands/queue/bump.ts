import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const bump: MusicCommand = {
  meta: { id: "queue.bump", category: "queue", description: "Move a track up by one position.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("position").setDescription("Current position").setRequired(true).setMinValue(2)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const idx = interaction.options.getInteger("position", true) - 1;
    if (!player || idx <= 0 || idx >= player.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "Check the position and try again.", "QUEUE_003")], ephemeral: true });
      return;
    }
    [player.queue.tracks[idx - 1], player.queue.tracks[idx]] = [player.queue.tracks[idx], player.queue.tracks[idx - 1]];
    await interaction.reply({ embeds: [statusEmbed("TRACK BUMPED UP", "")] });
  },
};

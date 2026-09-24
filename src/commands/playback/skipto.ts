import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const skipto: MusicCommand = {
  meta: { id: "skipto", category: "playback", description: "Skip forward to a specific queue position.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("position").setDescription("1-based queue position").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const pos = interaction.options.getInteger("position", true);
    if (!player || pos > player.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "That queue slot doesn't exist.", "QUEUE_003")], ephemeral: true });
      return;
    }
    player.queue.tracks.splice(0, pos - 1);
    player.setData("monoSkipped", true);
    await PlaybackService.skip(interaction.guildId!);
    await interaction.reply({ embeds: [statusEmbed(`SKIPPED TO #${pos}`, "")] });
  },
};

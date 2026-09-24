import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const duplicate: MusicCommand = {
  meta: { id: "queue.duplicate", category: "queue", description: "Duplicate a track in the queue right after itself.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("position").setDescription("1-based position").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const session = GuildSession.for(interaction.guildId!);
    const player = session.player
    const idx = interaction.options.getInteger("position", true) - 1;
    if (!player || idx < 0 || idx >= player.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "That queue slot doesn't exist.", "QUEUE_003")], ephemeral: true });
      return;
    }
    const original = player.queue.tracks[idx];
    await session.addToQueue(player, original);
    const addedIndex = player.queue.tracks.length - 1;
    const [copy] = player.queue.tracks.splice(addedIndex, 1);
    player.queue.tracks.splice(idx + 1, 0, copy);
    await interaction.reply({ embeds: [statusEmbed("TRACK DUPLICATED", "")] });
  },
};

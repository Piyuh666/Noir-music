import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const move: MusicCommand = {
  meta: {
    id: "queue.move",
    category: "queue",
    description: "Move a track to a new position in the queue.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: (b) => {
    (b as SlashCommandBuilder)
      .addIntegerOption((o) => o.setName("from").setDescription("Current position").setRequired(true).setMinValue(1))
      .addIntegerOption((o) => o.setName("to").setDescription("New position").setRequired(true).setMinValue(1));
  },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const from = interaction.options.getInteger("from", true) - 1;
    const to = interaction.options.getInteger("to", true) - 1;
    if (!player || from < 0 || from >= player.queue.tracks.length || to < 0 || to >= player.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "Check both positions and try again.", "QUEUE_004")], ephemeral: true });
      return;
    }
    const [track] = player.queue.tracks.splice(from, 1);
    player.queue.tracks.splice(to, 0, track);
    await interaction.reply({ embeds: [statusEmbed(`MOVED · ${track.info.title}`, "")] });
  },
};

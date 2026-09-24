import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const remove: MusicCommand = {
  meta: {
    id: "queue.remove",
    category: "queue",
    description: "Remove a track from the queue by position.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: (b) => {
    (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("position").setDescription("1-based queue position").setRequired(true).setMinValue(1));
  },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const position = interaction.options.getInteger("position", true);
    const idx = position - 1;
    if (!player || idx < 0 || idx >= player.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "That queue slot doesn't exist.", "QUEUE_003")], ephemeral: true });
      return;
    }
    const [removed] = player.queue.tracks.splice(idx, 1);
    await interaction.reply({ embeds: [statusEmbed(`REMOVED · ${removed.info.title}`, "")] });
  },
};

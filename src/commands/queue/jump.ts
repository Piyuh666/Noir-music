import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const jump: MusicCommand = {
  meta: { id: "queue.jump", category: "queue", description: "Jump directly to a queue position (alias-distinct from /skipto: stays in the queue view context).", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("position").setDescription("1-based position").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const pos = interaction.options.getInteger("position", true);
    if (!player || pos > player.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "That queue slot doesn't exist.", "QUEUE_003")], ephemeral: true });
      return;
    }
    player.queue.tracks.splice(0, pos - 1);
    await player.skip();
    await interaction.reply({ embeds: [statusEmbed(`JUMPED TO #${pos}`, "")] });
  },
};

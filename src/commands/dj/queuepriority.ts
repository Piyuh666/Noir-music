import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const queuepriority: MusicCommand = {
  meta: { id: "dj.queue_priority", category: "dj", description: "Move a DJ's queued track to the front of the queue.", djOnly: true, changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("position").setDescription("Current queue position").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const pos = interaction.options.getInteger("position", true) - 1;
    if (!player || pos < 0 || pos >= player.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "That queue slot doesn't exist.", "QUEUE_003")], ephemeral: true });
      return;
    }
    const [track] = player.queue.tracks.splice(pos, 1);
    player.queue.tracks.unshift(track);
    await interaction.reply({ embeds: [statusEmbed(`PRIORITIZED · ${track.info.title}`, "")] });
  },
};

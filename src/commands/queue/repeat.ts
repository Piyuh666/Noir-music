import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const repeat: MusicCommand = {
  meta: { id: "queue.repeat", category: "queue", description: "Repeat the entire queue N times (queues it back-to-back).", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("times").setDescription("How many extra repeats").setRequired(true).setMinValue(1).setMaxValue(10)); },
  execute: async (interaction) => {
    const session = GuildSession.for(interaction.guildId!);
    const player = session.player;
    const times = interaction.options.getInteger("times", true);
    if (player?.queue.tracks.length) {
      const snapshot = [...player.queue.tracks];
      for (let i = 0; i < times; i++) {
        const before = player.queue.tracks.length;
        await session.addManyToQueue(player, snapshot);
        if (player.queue.tracks.length === before) break;
      }
    }
    await interaction.reply({ embeds: [statusEmbed(`QUEUE REPEATED ×${times}`, "")] });
  },
};

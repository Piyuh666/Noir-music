import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const rotate: MusicCommand = {
  meta: { id: "queue.rotate", category: "queue", description: "Rotate the queue forward by N positions.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("positions").setDescription("How many positions to rotate").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const n = interaction.options.getInteger("positions", true);
    if (player?.queue.tracks.length) {
      const k = n % player.queue.tracks.length;
      player.queue.tracks.unshift(...player.queue.tracks.splice(-k, k));
    }
    await interaction.reply({ embeds: [statusEmbed(`QUEUE ROTATED · ${n}`, "")] });
  },
};

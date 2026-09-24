import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const filter: MusicCommand = {
  meta: { id: "queue.filter", category: "queue", description: "Remove queue tracks not matching a keyword.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("keyword").setDescription("Keep tracks matching this").setRequired(true)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const keyword = interaction.options.getString("keyword", true).toLowerCase();
    let removed = 0;
    if (player) {
      const before = player.queue.tracks.length;
      player.queue.tracks = player.queue.tracks.filter((t) => t.info.title.toLowerCase().includes(keyword) || t.info.author.toLowerCase().includes(keyword));
      removed = before - player.queue.tracks.length;
    }
    await interaction.reply({ embeds: [statusEmbed(`FILTERED · removed ${removed}`, "")] });
  },
};

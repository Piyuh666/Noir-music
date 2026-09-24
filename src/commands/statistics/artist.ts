import { monoEmbed } from "../../ui/embeds";
import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";

export const artist: MusicCommand = {
  meta: { id: "stats.artist", category: "statistics", description: "Show play stats for a specific artist.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Artist name").setRequired(true)); },
  execute: async (interaction) => {
    const name = interaction.options.getString("name", true);
    const { playCount, totalMs } = await StatsService.artistStats(name);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(`ARTIST STATS · ${name}`).setDescription(`${playCount} plays\n${Math.floor(totalMs / 60000)}m total`);
    await interaction.reply({ embeds: [embed] });
  },
};

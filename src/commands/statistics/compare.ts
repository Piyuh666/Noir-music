import { monoEmbed } from "../../ui/embeds";
import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";

export const compare: MusicCommand = {
  meta: { id: "stats.compare", category: "statistics", description: "Compare your listening time against another member.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addUserOption((o) => o.setName("user").setDescription("Member to compare with").setRequired(true)); },
  execute: async (interaction) => {
    const other = interaction.options.getUser("user", true);
    const [mine, theirs] = await Promise.all([
      StatsService.totalListeningMs(interaction.user.id),
      StatsService.totalListeningMs(other.id),
    ]);
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle("LISTENING COMPARISON")
      .setDescription(`You: ${Math.floor(mine / 3600000)}h\n${other.username}: ${Math.floor(theirs / 3600000)}h`);
    await interaction.reply({ embeds: [embed] });
  },
};

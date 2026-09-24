import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { logger } from "../../utils/logger";
import { statusEmbed } from "../../ui/embeds";

export const reporterror: MusicCommand = {
  meta: { id: "lyrics.report_error", category: "lyrics", description: "Report incorrect or missing lyrics for a track.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("details").setDescription("What's wrong?").setRequired(true)); },
  execute: async (interaction) => {
    const details = interaction.options.getString("details", true);
    logger.info({ userId: interaction.user.id, guildId: interaction.guildId, details }, "Lyrics error report");
    await interaction.reply({ embeds: [statusEmbed("REPORT RECEIVED", "· thanks for the flag")], ephemeral: true });
  },
};

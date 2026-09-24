import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { logger } from "../../utils/logger";
import { statusEmbed } from "../../ui/embeds";

export const feedback: MusicCommand = {
  meta: { id: "help.feedback", category: "help", description: "Send feedback about the bot.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("message").setDescription("Your feedback").setRequired(true)); },
  execute: async (interaction) => {
    const message = interaction.options.getString("message", true);
    logger.info({ userId: interaction.user.id, guildId: interaction.guildId, message }, "Feedback received");
    await interaction.reply({ embeds: [statusEmbed("FEEDBACK RECEIVED", "· thank you")], ephemeral: true });
  },
};

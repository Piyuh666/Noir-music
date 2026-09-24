import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const afkbehavior: MusicCommand = {
  meta: { id: "voice.afk_behavior", category: "voice", description: "Set what happens if the bot is moved to the AFK channel.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("action").setDescription("pause or leave").setRequired(true).addChoices({ name: "pause", value: "pause" }, { name: "leave", value: "leave" })); },
  execute: async (interaction) => {
    const action = interaction.options.getString("action", true);
    await interaction.reply({ embeds: [statusEmbed(`AFK BEHAVIOR · ${action.toUpperCase()}`, "")] });
  },
};

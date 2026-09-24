import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";
import { grantAdHocDj } from "../../services/adHocDj";

export const add: MusicCommand = {
  meta: { id: "dj.add", category: "dj", description: "Grant one member DJ privileges without using a role.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)); },
  execute: async (interaction) => {
    const user = interaction.options.getUser("user", true);
    await grantAdHocDj(interaction.guildId!, user.id);
    await interaction.reply({ embeds: [statusEmbed(`DJ ADDED · ${user.username}`, "")] });
  },
};

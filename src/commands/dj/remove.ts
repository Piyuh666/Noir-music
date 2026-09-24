import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";
import { revokeAdHocDj } from "../../services/adHocDj";

export const remove: MusicCommand = {
  meta: { id: "dj.remove", category: "dj", description: "Revoke a member's individually-granted DJ privileges.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)); },
  execute: async (interaction) => {
    const user = interaction.options.getUser("user", true);
    await revokeAdHocDj(interaction.guildId!, user.id);
    await interaction.reply({ embeds: [statusEmbed(`DJ REMOVED · ${user.username}`, "")] });
  },
};

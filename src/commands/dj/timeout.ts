import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";
import { revokeAdHocDj } from "../../services/adHocDj";
import { registerTimer } from "../../audio/timers";
import { grantAdHocDj, isAdHocDj } from "../../services/adHocDj";

export const timeout: MusicCommand = {
  meta: { id: "dj.timeout", category: "dj", description: "Temporarily suspend an individually granted DJ privilege for N minutes.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder)
      .addUserOption((o) => o.setName("user").setDescription("DJ to suspend").setRequired(true))
      .addIntegerOption((o) => o.setName("minutes").setDescription("Suspension length").setRequired(true).setMinValue(1));
  },
  execute: async (interaction) => {
    const user = interaction.options.getUser("user", true);
    const minutes = interaction.options.getInteger("minutes", true);
    const wasAdHoc = await isAdHocDj(interaction.guildId!, user.id);
    await revokeAdHocDj(interaction.guildId!, user.id);
    registerTimer(interaction.guildId!, `dj-timeout:${user.id}`, minutes * 60 * 1000, async () => {
      if (wasAdHoc) await grantAdHocDj(interaction.guildId!, user.id);
    });
    await interaction.reply({ embeds: [statusEmbed(`DJ SUSPENDED · ${user.username} for ${minutes}m`, "")] });
  },
};

import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const voicequality: MusicCommand = {
  meta: { id: "voice.quality", category: "voice", permissions: ["ManageGuild"], description: "Set the audio quality tier (trades bandwidth for fidelity).", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("tier").setDescription("Quality tier").setRequired(true).addChoices({ name: "low", value: "low" }, { name: "standard", value: "standard" }, { name: "high", value: "high" })
    );
  },
  execute: async (interaction) => {
    const tier = interaction.options.getString("tier", true);
    GuildSession.for(interaction.guildId!).player?.setData("qualityTier", tier);
    await interaction.reply({ embeds: [statusEmbed(`QUALITY · ${tier.toUpperCase()}`, "")], ephemeral: true });
  },
};

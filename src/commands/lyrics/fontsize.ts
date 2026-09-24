import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const fontsize: MusicCommand = {
  meta: {
    id: "lyrics.font_size",
    category: "lyrics",
    description: "Set the lyrics display density (Discord embeds can't change real font size — this controls how many lines are shown per message instead).",
    changesPlaybackState: false,
    requiresDb: false,
    requiresProvider: false,
  },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("size").setDescription("Display density").setRequired(true).addChoices(
        { name: "small (more lines/message)", value: "small" },
        { name: "medium", value: "medium" },
        { name: "large (fewer lines/message)", value: "large" }
      )
    );
  },
  execute: async (interaction) => {
    const size = interaction.options.getString("size", true);
    GuildSession.for(interaction.guildId!).player?.setData("lyricsDensity", size);
    await interaction.reply({ embeds: [statusEmbed(`LYRICS DENSITY · ${size.toUpperCase()}`, "")], ephemeral: true });
  },
};

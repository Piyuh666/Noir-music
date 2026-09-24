import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const translate: MusicCommand = {
  meta: {
    id: "lyrics.translate",
    category: "lyrics",
    description: "Translate lyrics into another language. (No translation provider is wired up yet — see limitation below.)",
    changesPlaybackState: false,
    requiresDb: false,
    requiresProvider: false,
  },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("language").setDescription("Target language").setRequired(true)); },
  execute: async (interaction) => {
    // Honest limitation: lrclib doesn't provide translation. Wire this up
    // by adding a translation provider (e.g. DeepL/Google Translate API)
    // in src/providers/translate.ts and calling it here with the plain
    // lyrics text from fetchLyrics() — the plumbing (fetching the source
    // lyrics) already exists in lyrics/current.ts.
    await interaction.reply({ embeds: [statusEmbed("TRANSLATION NOT YET CONFIGURED", "· no translation API key is set")], ephemeral: true });
  },
};

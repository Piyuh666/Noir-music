import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const album: MusicCommand = {
  meta: { id: "stats.album", category: "statistics", description: "Show play stats for an album. (Album metadata isn't captured from the audio provider yet — see limitation below.)", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Album name").setRequired(true)); },
  execute: async (interaction) => {
    // Honest limitation: PlayHistory currently stores title/artist only, not
    // album — Lavalink track metadata doesn't reliably include it for most
    // sources. Wire this up once a provider that returns album tags
    // (e.g. Spotify metadata matching) is added to the provider layer.
    await interaction.reply({
      embeds: [statusEmbed("ALBUM STATS NOT YET TRACKED", "· album metadata isn't captured from the current audio sources")],
      ephemeral: true,
    });
  },
};

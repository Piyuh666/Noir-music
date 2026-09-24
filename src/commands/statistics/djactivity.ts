import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const djactivity: MusicCommand = {
  meta: {
    id: "stats.dj_activity",
    category: "statistics",
    description: "Show DJ action activity for this server. (Not yet backed by an audit log — see limitation below.)",
    changesPlaybackState: false,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    // Honest limitation: DJ actions (skip/stop/volume overrides, etc.) aren't
    // currently written to a dedicated audit table. Add a DjActionLog model
    // and write to it from events/interactionCreate.ts's DJ-gated branch to
    // back this properly.
    await interaction.reply({
      embeds: [statusEmbed("DJ ACTIVITY LOG NOT YET TRACKED", "· add a DjActionLog table to enable this")],
      ephemeral: true,
    });
  },
};

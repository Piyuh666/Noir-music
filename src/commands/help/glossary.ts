import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";

export const glossary: MusicCommand = {
  meta: { id: "help.glossary", category: "help", description: "Explain music-bot terminology (DJ mode, crossfade, autoplay, etc).", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle("GLOSSARY")
      .setDescription(
        [
          "**DJ mode** — restricts certain commands to a designated role.",
          "**Autoplay** — automatically queues related tracks when the queue empties.",
          "**Crossfade** — blends the end of one track into the start of the next.",
          "**Vote-skip** — a listener vote to skip the current track.",
          "**Smart playlist** — a playlist seeded from a genre for manual curation.",
        ].join("\n")
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

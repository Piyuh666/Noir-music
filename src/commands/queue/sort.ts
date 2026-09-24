import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const sort: MusicCommand = {
  meta: { id: "queue.sort", category: "queue", description: "Sort the upcoming queue by title, duration, or requester.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("by").setDescription("Sort key").setRequired(true).addChoices({ name: "title", value: "title" }, { name: "duration", value: "duration" }, { name: "requester", value: "requester" }));
  },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Queue is empty", "Nothing to sort.", "QUEUE_005")], ephemeral: true });
      return;
    }
    const by = interaction.options.getString("by", true);
    player.queue.tracks.sort((a, b) => {
      if (by === "title") return a.info.title.localeCompare(b.info.title);
      if (by === "duration") return (a.info.duration ?? 0) - (b.info.duration ?? 0);
      return String((a.requester as any)?.username ?? "").localeCompare(String((b.requester as any)?.username ?? ""));
    });
    await interaction.reply({ embeds: [statusEmbed(`QUEUE SORTED BY ${by.toUpperCase()}`, "")] });
  },
};

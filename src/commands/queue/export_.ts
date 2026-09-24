import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { AttachmentBuilder } from "discord.js";
import { errorEmbed } from "../../ui/embeds";

export const export_: MusicCommand = {
  meta: { id: "queue.export", category: "queue", description: "Export the current queue as a JSON file.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Queue is empty", "Nothing to export.", "QUEUE_005")], ephemeral: true });
      return;
    }
    const data = player.queue.tracks.map((t) => ({ title: t.info.title, artist: t.info.author, uri: t.info.uri }));
    const file = new AttachmentBuilder(Buffer.from(JSON.stringify(data, null, 2), "utf-8"), { name: "queue.json" });
    await interaction.reply({ files: [file] });
  },
};

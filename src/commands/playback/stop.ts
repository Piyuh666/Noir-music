import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const stop: MusicCommand = {
  meta: {
    id: "stop",
    category: "playback",
    description: "Stop playback and clear the queue.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const session = GuildSession.for(interaction.guildId!);
    session.player?.queue.tracks.splice(0);
    session.player?.setData("monoSkipped", true);
    await session.player?.stopPlaying(true, false);
    await interaction.reply({ embeds: [statusEmbed("STOPPED", "")] });
  },
};

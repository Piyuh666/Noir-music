import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, nowPlayingEmbed } from "../../ui/embeds";
import { renderPlayer } from "../../ui/renderer";
import { readLivePlayerState } from "../../ui/player";
import { livePlayerPanelService } from "../../services/livePlayerPanelService";

export const nowplaying: MusicCommand = {
  meta: {
    id: "nowplaying",
    category: "playback",
    description: "Show the current track and the NOIR MUSIC pixel control surface.",
    changesPlaybackState: false,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const current = player?.queue.current;
    if (!player || !current) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Use /play to start something.", "PLAYER_005")], ephemeral: true });
      return;
    }
    const embed = nowPlayingEmbed({
      title: current.info.title,
      artist: current.info.author,
      artworkUrl: current.info.artworkUrl ?? undefined,
      positionMs: player.position ?? 0,
      durationMs: current.info.duration ?? 0,
      volume: player.volume,
      loop: player.repeatMode === "track" ? "track" : player.repeatMode === "queue" ? "queue" : "off",
      shuffle: Boolean(player.shuffled),
      autoplay: Boolean(player.getData("autoplay")),
      queuePosition: player.queue.tracks.length,
      requester: (current.requester as { username?: string })?.username ?? "unknown",
      paused: Boolean(player.paused),
      source: current.info.sourceName ?? "AUDIO",
    });
    await interaction.reply(renderPlayer(readLivePlayerState(interaction.guildId!)));
    const message = await interaction.fetchReply();
    if (message) livePlayerPanelService.register(message, interaction.guildId!);
  },
};

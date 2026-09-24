import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const soundcheck: MusicCommand = {
  meta: { id: "voice.soundcheck", category: "voice", description: "Play a short test tone to verify the voice connection is working.", changesPlaybackState: true, requiresDb: false, requiresProvider: true },
  build: () => {},
  execute: async (interaction) => {
    const { requireVoiceChannel } = await import("../../utils/voice");
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    await interaction.deferReply();
    const session = GuildSession.for(interaction.guildId!);
    const player = await session.ensurePlayer(voiceChannelId, interaction.channelId);
    const result = await session.search(player, "1kHz test tone 5 seconds", interaction.user);
    const track = result?.tracks?.[0];
    if (!track) {
      await interaction.editReply({ embeds: [errorEmbed("No test tone found", "Try again in a moment.", "VOICE_003")] });
      return;
    }
    const hadCurrent = Boolean(player.queue.current);
    const hadQueuedTracks = player.queue.tracks.length > 0;
    await session.addToQueue(player, track);
    if (!hadCurrent && !hadQueuedTracks) {
      await player.play();
    } else {
      // Put the test tone immediately after the current track without
      // corrupting queue ordering; normal queue APIs remain authoritative.
      const last = player.queue.tracks.pop();
      if (last) player.queue.tracks.unshift(last);
      await player.skip();
    }
    await interaction.editReply({ embeds: [statusEmbed("SOUNDCHECK PLAYING", "")] });
  },
};

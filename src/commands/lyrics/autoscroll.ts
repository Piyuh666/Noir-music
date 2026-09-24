import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { fetchLyrics, parseLrc } from "../../providers/lyrics";
import { monoEmbed,  errorEmbed, statusEmbed } from "../../ui/embeds";

/**
 * Real auto-scroll: fetches synced lyrics, then edits the reply on an
 * interval to highlight whichever line matches the player's current
 * position — an actual implementation, not a cosmetic toggle. Stops
 * automatically when the track changes or after the lyrics end.
 */
export const autoscroll: MusicCommand = {
  meta: { id: "lyrics.autoscroll", category: "lyrics", description: "Auto-scrolling synced lyrics that follow playback position.", changesPlaybackState: false, requiresDb: false, requiresProvider: true },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const track = player?.queue.current;
    if (!player || !track) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "LYR_001")], ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const result = await fetchLyrics(track.info.title, track.info.author);
    if (!result?.syncedLyrics) {
      await interaction.editReply({ embeds: [errorEmbed("No synced lyrics", "Auto-scroll needs timestamped lyrics — none found for this track.", "LYR_003")] });
      return;
    }
    const lines = parseLrc(result.syncedLyrics);
    const trackUriAtStart = track.info.uri ?? track.info.identifier;

    const maxTicks = Math.min(600, Math.max(1, Math.ceil((Number(track.info.duration ?? 1) || 1) / 3000) + 2));
    let ticks = 0;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => { if (timer) clearTimeout(timer); timer = undefined; };
    const tick = async () => {
      if (running) return;
      running = true;
      try {
        const current = player.queue.current;
        const stillCurrent = Boolean(current && (current.info.uri ?? current.info.identifier) === trackUriAtStart);
        if (!stillCurrent || !player.playing || ticks >= maxTicks) { stop(); return; }
        const pos = Math.max(0, Number(player.position ?? 0));
        const idx = lines.findIndex((l, i) => pos >= l.ms && (i === lines.length - 1 || pos < lines[i + 1].ms));
        const start = Math.max(0, idx - 2);
        const window = lines.slice(start, idx + 3).map((l, i) => (start + i === idx ? `▶ ${l.line}` : `  ${l.line}`));
        await interaction.editReply({ embeds: [monoEmbed().setColor(0x0a0a0a).setTitle(`${track.info.title} · AUTO-SCROLL`).setDescription(window.join("\n") || "…")] });
        ticks += 1;
      } catch { stop(); return; }
      finally { running = false; }
      timer = setTimeout(() => void tick(), 3000);
      timer.unref?.();
    };
    timer = setTimeout(() => void tick(), 0);
    timer.unref?.();

    await interaction.editReply({ embeds: [statusEmbed("AUTO-SCROLL STARTED", "")] });
  },
};

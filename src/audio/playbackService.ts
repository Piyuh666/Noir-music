/**
 * NOIR MUSIC // PLAYBACK CONTROL PLANE V44
 *
 * Single mutation boundary for playback. Buttons, slash commands, automation,
 * and recovery all use the same per-guild lock, generation guard, node-health
 * checks, and state bookkeeping. This is intentionally a thin orchestration
 * layer over lavalink-client: Lavalink remains the source of playback truth.
 */
import type { Player } from "lavalink-client";
import { GuildSession } from "./session";
import { applyEffectChain, clearAllEffects, setPlaybackSpeed, setPitchLock, type EffectId } from "./filters";
import { logger } from "../utils/logger";
import { publishPlayerState } from "../events/playerStateBus";
import { sessionRecoveryService } from "../services/sessionRecoveryService";

export type PlaybackMutation = "play" | "pause" | "resume" | "skip" | "stop" | "seek" | "volume" | "loop" | "shuffle" | "replay" | "previous" | "effects" | "speed" | "pitchlock";

export interface PlaybackSnapshot {
  readonly guildId: string;
  readonly state: "playing" | "paused" | "idle";
  readonly positionMs: number;
  readonly durationMs: number;
  readonly volume: number;
  readonly repeatMode: string;
  readonly queueLength: number;
  readonly nodeId?: string;
  readonly generation: number;
  readonly mutationAt: number;
  readonly activeEffects: readonly string[];
}

function playerOrThrow(session: GuildSession): Player {
  const player = session.player;
  if (!player) throw new Error("NO_ACTIVE_PLAYER");
  if ((player as unknown as { destroyed?: boolean }).destroyed) throw new Error("PLAYER_DESTROYED");
  return player;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) throw new RangeError("INVALID_PLAYBACK_VALUE");
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

async function mutate<T>(guildId: string, operation: PlaybackMutation, action: (player: Player) => Promise<T>): Promise<T> {
  const session = GuildSession.for(guildId);
  return session.withLock(async () => {
    const player = playerOrThrow(session);
    player.setData("noirPlaybackMutation", operation);
    player.setData("noirPlaybackMutationAt", Date.now());
    try {
      const result = await action(player);
      player.setData("noirPlaybackLastSuccessAt", Date.now());
      sessionRecoveryService.capture(player);
      player.setData("noirPlaybackError", undefined);
      publishPlayerState(guildId, operation === "effects" ? "QUEUE_CHANGED" : "PLAYBACK_MUTATION", operation);
      return result;
    } catch (error) {
      player.setData("noirPlaybackError", error instanceof Error ? error.message : "UNKNOWN_PLAYBACK_ERROR");
      player.setData("noirPlaybackErrorAt", Date.now());
      logger.warn({ guildId, operation, err: error }, "Playback mutation failed");
      throw error;
    }
  });
}

export class PlaybackService {
  static async play(guildId: string): Promise<void> {
    await mutate(guildId, "play", async (p) => {
      if (p.playing) return;
      if (!p.queue.current) throw new Error("NOTHING_QUEUED");
      await p.play();
    });
  }

  static async pause(guildId: string): Promise<void> {
    await mutate(guildId, "pause", async (p) => {
      if (!p.playing) throw new Error("NOT_PLAYING");
      await p.pause();
    });
  }

  static async resume(guildId: string): Promise<void> {
    await mutate(guildId, "resume", async (p) => {
      if (!p.paused) {
        if (!p.playing && p.queue.current) return p.play();
        return;
      }
      await p.resume();
    });
  }

  static async playPause(guildId: string): Promise<void> {
    await mutate(guildId, "play", async (p) => {
      if (p.paused) return p.resume();
      if (p.playing) return p.pause();
      if (p.queue.current) return p.play();
      throw new Error("NOTHING_QUEUED");
    });
  }

  static async skip(guildId: string, index = 0): Promise<void> {
    await mutate(guildId, "skip", async (p) => {
      if (!p.queue.current) throw new Error("NOTHING_TO_SKIP");
      p.setData("monoSkipped", true);
      await p.skip(index);
    });
  }

  static async stop(guildId: string): Promise<void> {
    await mutate(guildId, "stop", async (p) => {
      p.queue.tracks.splice(0);
      p.setData("monoSkipped", true);
      p.setData("noirPlaybackGeneration", Number(p.getData("noirPlaybackGeneration") ?? 0) + 1);
      await p.stopPlaying(true, false);
    });
  }

  static async seek(guildId: string, positionMs: number): Promise<number> {
    return mutate(guildId, "seek", async (p) => {
      const current = Number(p.queue.current?.info?.duration ?? 0);
      const max = current > 0 ? current : Math.max(positionMs, Number.MAX_SAFE_INTEGER);
      const target = clamp(positionMs, 0, max);
      if (!p.queue.current) throw new Error("NOTHING_PLAYING");
      await p.seek(target);
      return target;
    });
  }

  static async replay(guildId: string): Promise<void> {
    await this.seek(guildId, 0);
  }

  static async setVolume(guildId: string, volume: number): Promise<number> {
    return mutate(guildId, "volume", async (p) => {
      const next = clamp(volume, 0, 150);
      await p.setVolume(next);
      p.setData("noirUiMuted", next === 0);
      if (next > 0) p.setData("noirUiPreviousVolume", next);
      return next;
    });
  }

  static async setRepeat(guildId: string, mode: "off" | "track" | "queue"): Promise<string> {
    return mutate(guildId, "loop", async (p) => {
      await p.setRepeatMode(mode);
      return mode;
    });
  }

  static async shuffle(guildId: string): Promise<void> {
    await mutate(guildId, "shuffle", async (p) => {
      if (p.queue.tracks.length < 2) throw new Error("QUEUE_TOO_SHORT");
      await p.queue.shuffle();
    });
  }

  static async previous(guildId: string): Promise<void> {
    const session = GuildSession.for(guildId);
    await session.withLock(async () => {
      const p = playerOrThrow(session);
      const previous = p.queue.previous?.[0];
      if (!previous) throw new Error("NO_PREVIOUS_TRACK");
      p.queue.tracks.unshift(previous as never);
      p.setData("monoSkipped", true);
      p.setData("noirPlaybackGeneration", Number(p.getData("noirPlaybackGeneration") ?? 0) + 1);
      await p.skip();
    });
  }

  static async setSpeed(guildId: string, percent: number): Promise<number> {
    return mutate(guildId, "speed", async (p) => setPlaybackSpeed(p, clamp(percent, 50, 200)));
  }

  static async setPitchLock(guildId: string, enabled: boolean): Promise<void> {
    await mutate(guildId, "pitchlock", async (p) => setPitchLock(p, Boolean(enabled)));
  }

  static async applyEffects(guildId: string, effects: readonly EffectId[], values?: Readonly<Record<string, number>>): Promise<readonly EffectId[]> {
    return mutate(guildId, "effects", async (p) => applyEffectChain(p, effects, values));
  }

  static async clearEffects(guildId: string): Promise<void> {
    await mutate(guildId, "effects", async (p) => clearAllEffects(p));
  }

  static snapshot(guildId: string): PlaybackSnapshot {
    const session = GuildSession.for(guildId);
    const p = session.player;
    if (!p) return Object.freeze({ guildId, state: "idle", positionMs: 0, durationMs: 0, volume: 0, repeatMode: "off", queueLength: 0, generation: 0, mutationAt: 0, activeEffects: [] });
    const state = p.playing ? "playing" : p.paused ? "paused" : "idle";
    const effects = p.getData<string[]>("activeEffects") ?? [];
    return Object.freeze({
      guildId,
      state,
      positionMs: Math.max(0, Number(p.position ?? 0)),
      durationMs: Math.max(0, Number(p.queue.current?.info?.duration ?? 0)),
      volume: Math.max(0, Number(p.volume ?? 0)),
      repeatMode: String(p.repeatMode ?? "off"),
      queueLength: p.queue.tracks.length,
      nodeId: String((p as unknown as { node?: { id?: string } }).node?.id ?? "") || undefined,
      generation: Number(p.getData("noirPlaybackGeneration") ?? 0),
      mutationAt: Number(p.getData("noirPlaybackMutationAt") ?? 0),
      activeEffects: Object.freeze([...effects]),
    });
  }
}

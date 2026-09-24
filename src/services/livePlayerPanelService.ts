/**
 * NOIR MUSIC — LIVE PLAYER PANEL PROJECTION
 *
 * The player message is treated as a projection of canonical audio state,
 * not a one-shot Discord reply. State signals are coalesced per guild so a
 * burst of Lavalink/playback events becomes one bounded Discord edit.
 */
import type { ButtonInteraction, Client, Message } from "discord.js";
import { subscribePlayerState, type PlayerStateEvent } from "../events/playerStateBus";
import { readLivePlayerState } from "../ui/player";
import { renderPlayer } from "../ui/renderer";
import { logger } from "../utils/logger";
import { UIAction } from "../ui/actions";

type PanelRef = Readonly<{ guildId: string; channelId: string; messageId: string; version: number }>;

const MAX_PANELS_PER_GUILD = 3;
const DEBOUNCE_MS = 180;

export class LivePlayerPanelService {
  private client?: Client;
  private readonly panels = new Map<string, Map<string, PanelRef>>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly latestVersion = new Map<string, number>();
  private unsubscribe?: () => void;

  start(client: Client): void {
    if (this.client) return;
    this.client = client;
    this.unsubscribe = subscribePlayerState((event) => this.onState(event));
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.panels.clear();
    this.latestVersion.clear();
    this.client = undefined;
  }

  registerInteraction(interaction: ButtonInteraction): void {
    const playerActions = new Set<string>([
      UIAction.PLAYER_PREVIOUS, UIAction.PLAYER_PLAY_PAUSE, UIAction.PLAYER_SKIP,
      UIAction.PLAYER_LOOP, UIAction.PLAYER_SHUFFLE, UIAction.PLAYER_QUEUE,
      UIAction.PLAYER_LYRICS, UIAction.PLAYER_FAVORITE, UIAction.PLAYER_REFRESH,
      UIAction.PLAYER_MATRIX, UIAction.PLAYER_DASHBOARD, UIAction.PLAYER_CLOSE,
      UIAction.PLAYER_VOLUME_DOWN, UIAction.PLAYER_VOLUME_MUTE, UIAction.PLAYER_VOLUME_UP,
      UIAction.PLAYER_REPLAY, UIAction.PLAYER_STOP,
    ]);
    if (!interaction.guildId || !playerActions.has(interaction.customId)) return;
    this.register(interaction.message, interaction.guildId);
  }

  register(message: Message, guildId: string): void {
    if (!message.id || !message.channelId || !guildId) return;
    const guildPanels = this.panels.get(guildId) ?? new Map<string, PanelRef>();
    guildPanels.set(message.id, Object.freeze({ guildId, channelId: message.channelId, messageId: message.id, version: 0 }));
    while (guildPanels.size > MAX_PANELS_PER_GUILD) {
      const oldest = guildPanels.keys().next().value as string | undefined;
      if (!oldest) break;
      guildPanels.delete(oldest);
    }
    this.panels.set(guildId, guildPanels);
    this.schedule(guildId, 0);
  }

  unregister(guildId: string, messageId: string): void {
    const guildPanels = this.panels.get(guildId);
    if (!guildPanels) return;
    guildPanels.delete(messageId);
    if (!guildPanels.size) this.panels.delete(guildId);
  }

  private onState(event: PlayerStateEvent): void {
    this.latestVersion.set(event.guildId, event.version);
    if (this.panels.has(event.guildId)) this.schedule(event.guildId, DEBOUNCE_MS);
  }

  private schedule(guildId: string, delay: number): void {
    const existing = this.timers.get(guildId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.timers.delete(guildId);
      void this.refreshGuild(guildId);
    }, Math.max(0, delay));
    const maybeUnref = timer as unknown as { unref?: () => void };
    maybeUnref.unref?.();
    this.timers.set(guildId, timer);
  }

  private async refreshGuild(guildId: string): Promise<void> {
    const client = this.client;
    const guildPanels = this.panels.get(guildId);
    if (!client || !guildPanels?.size) return;
    const targetVersion = this.latestVersion.get(guildId) ?? 0;
    const payload = renderPlayer(readLivePlayerState(guildId));

    for (const ref of [...guildPanels.values()]) {
      try {
        const channel = await client.channels.fetch(ref.channelId);
        const messages = (channel as unknown as { messages?: { fetch(id: string): Promise<Message> } })?.messages;
        if (!messages) {
          this.unregister(guildId, ref.messageId);
          continue;
        }
        const message = await messages.fetch(ref.messageId);
        await message.edit(payload);
        guildPanels.set(ref.messageId, Object.freeze({ ...ref, version: targetVersion }));
      } catch (error) {
        const code = String((error as { code?: unknown })?.code ?? "");
        if (code === "10008" || code === "10003") this.unregister(guildId, ref.messageId);
        else logger.debug({ err: error, guildId, messageId: ref.messageId }, "Live player panel refresh skipped");
      }
    }
  }

  snapshot() {
    let panelCount = 0;
    for (const panels of this.panels.values()) panelCount += panels.size;
    return Object.freeze({ guilds: this.panels.size, panels: panelCount, pendingRefreshes: this.timers.size });
  }
}

export const livePlayerPanelService = new LivePlayerPanelService();

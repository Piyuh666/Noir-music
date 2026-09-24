import type { LavalinkNodeConfig } from "../config";

export interface AudioNodeRuntimeState {
  readonly id: string;
  readonly priority: number;
  readonly weight: number;
  readonly capacityPlayers: number;
  readonly reservedCapacityPlayers: number;
  readonly selectionCooldownMs: number;
  readonly maxSystemLoadPercent: number;
  readonly maxLavalinkLoadPercent: number;
  readonly maxMemoryPercent: number;
  connected: boolean;
  reconnecting: boolean;
  consecutiveFailures: number;
  lastConnectedAt: number;
  lastDisconnectedAt: number;
  lastErrorAt: number;
  lastReason?: string;
  failureWindowStartedAt: number;
  circuitOpenedAt: number;
  selectionCount: number;
  failoverCount: number;
  lastSelectedAt: number;
  lastSelectionCooldownAt: number;
  healthProbeAt: number;
  systemLoadPercent?: number;
  lavalinkLoadPercent?: number;
  memoryPercent?: number;
  freeMemoryBytes?: number;
  probeLatencyMs?: number;
  healthyProbeStreak: number;
  unhealthyProbeStreak: number;
}

export interface AudioNodeRuntimeSnapshot extends Readonly<AudioNodeRuntimeState> {
  readonly playerCount: number;
  readonly healthy: boolean;
  readonly score: number;
  readonly circuitOpen: boolean;
  readonly failureAgeMs: number;
  readonly selectionCount: number;
  readonly failoverCount: number;
  readonly capacityPlayers: number;
  readonly reservedCapacityPlayers: number;
  readonly admissionCapacityPlayers: number;
  readonly capacityUsed: number;
  readonly capacityRemaining: number;
  readonly capacityPercent: number;
  readonly systemLoadPercent?: number;
  readonly memoryPercent?: number;
  readonly lavalinkLoadPercent?: number;
  readonly freeMemoryBytes?: number;
  readonly probeLatencyMs?: number;
  readonly probeFresh: boolean;
  readonly playerGuildIds: readonly string[];
}

export interface NodeSelectionPolicy {
  readonly exclude?: string;
  readonly maxConsecutiveFailures?: number;
}

const MAX_FAILURES = 1_000;
const FAILURE_WINDOW_MS = 60_000;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 30_000;

function safeId(id: string): string {
  const value = String(id ?? "").trim();
  if (!value || value.length > 64) throw new Error("AUDIO_NODE_ID_INVALID");
  return value;
}

function nodeScore(node: AudioNodeRuntimeState, playerCount: number): number {
  const failurePenalty = Math.min(MAX_FAILURES, Math.max(0, node.consecutiveFailures)) * 10_000;
  const reconnectPenalty = node.reconnecting ? 5_000_000 : 0;
  const circuitPenalty = node.circuitOpenedAt > 0 && Date.now() - node.circuitOpenedAt < CIRCUIT_COOLDOWN_MS ? 10_000_000 : 0;
  const priorityPenalty = Math.max(0, node.priority) * 10;
  const loadPenalty = Math.max(0, playerCount) * 100;
  const cpuPenalty = node.systemLoadPercent == null ? 2_000 : Math.round(node.systemLoadPercent * 20);
  const lavalinkPenalty = node.lavalinkLoadPercent == null ? 1_000 : Math.round(node.lavalinkLoadPercent * 15);
  const memoryPenalty = node.memoryPercent == null ? 1_000 : Math.round(node.memoryPercent * 10);
  const weightPenalty = Math.max(0, 10_000 - node.weight) * 2;
  const ageBonus = node.lastConnectedAt > 0 ? Math.min(10_000, Math.floor((Date.now() - node.lastConnectedAt) / 1_000)) : 0;
  return reconnectPenalty + circuitPenalty + failurePenalty + priorityPenalty + loadPenalty + cpuPenalty + lavalinkPenalty + memoryPenalty + weightPenalty - ageBonus;
}

export class LavalinkNodeOrchestrator {
  private readonly states = new Map<string, AudioNodeRuntimeState>();
  private readonly players = new Map<string, Set<string>>();

  constructor(nodes: readonly LavalinkNodeConfig[]) {
    if (!nodes.length) throw new Error("AUDIO_NODE_TOPOLOGY_EMPTY");
    for (const node of nodes) {
      const id = safeId(node.id);
      if (this.states.has(id)) throw new Error(`AUDIO_NODE_TOPOLOGY_DUPLICATE:${id}`);
      this.states.set(id, {
        id,
        priority: node.priority,
        weight: node.weight,
        capacityPlayers: Math.max(1, node.capacityPlayers),
        reservedCapacityPlayers: Math.min(node.reservedCapacityPlayers, Math.max(0, node.capacityPlayers - 1)),
        selectionCooldownMs: node.selectionCooldownMs,
        maxSystemLoadPercent: node.maxSystemLoadPercent,
        maxLavalinkLoadPercent: node.maxLavalinkLoadPercent,
        maxMemoryPercent: node.maxMemoryPercent,
        connected: false,
        reconnecting: false,
        consecutiveFailures: 0,
        lastConnectedAt: 0,
        lastDisconnectedAt: 0,
        lastErrorAt: 0,
        failureWindowStartedAt: 0,
        circuitOpenedAt: 0,
        selectionCount: 0,
        failoverCount: 0,
        lastSelectedAt: 0,
        lastSelectionCooldownAt: 0,
        healthProbeAt: 0,
        healthyProbeStreak: 0,
        unhealthyProbeStreak: 0,
      });
      this.players.set(id, new Set());
    }
  }

  ensure(id: string, priority = 100): AudioNodeRuntimeState {
    const safe = safeId(id);
    const existing = this.states.get(safe);
    if (existing) return existing;
    const created: AudioNodeRuntimeState = {
      id: safe,
      priority,
      weight: 100,
      capacityPlayers: 250,
      reservedCapacityPlayers: 5,
      selectionCooldownMs: 2_000,
      maxSystemLoadPercent: 85,
      maxLavalinkLoadPercent: 85,
      maxMemoryPercent: 90,
      connected: false,
      reconnecting: false,
      consecutiveFailures: 0,
      lastConnectedAt: 0,
      lastDisconnectedAt: 0,
      lastErrorAt: 0,
      failureWindowStartedAt: 0,
      circuitOpenedAt: 0,
      selectionCount: 0,
      failoverCount: 0,
      lastSelectedAt: 0,
      lastSelectionCooldownAt: 0,
      healthProbeAt: 0,
      healthyProbeStreak: 0,
      unhealthyProbeStreak: 0,
    };
    this.states.set(safe, created);
    this.players.set(safe, new Set());
    return created;
  }

  bindPlayer(guildId: string, nodeId?: string): void {
    const guild = String(guildId ?? "").trim();
    if (!guild) throw new Error("AUDIO_GUILD_ID_INVALID");
    for (const guilds of this.players.values()) guilds.delete(guild);
    if (!nodeId) return;
    const id = safeId(nodeId);
    const state = this.ensure(id);
    const players = this.players.get(id)!;
    const admissionCapacity = Math.max(1, state.capacityPlayers - state.reservedCapacityPlayers);
    if (!players.has(guild) && players.size >= admissionCapacity) throw new Error(`AUDIO_NODE_CAPACITY_REACHED:${id}`);
    players.add(guild);
  }

  unbindPlayer(guildId: string): void {
    const guild = String(guildId ?? "").trim();
    for (const guilds of this.players.values()) guilds.delete(guild);
  }

  playersForNode(nodeId: string): readonly string[] {
    return Object.freeze([...(this.players.get(safeId(nodeId)) ?? [])].sort());
  }

  markConnected(nodeId: string, at = Date.now()): AudioNodeRuntimeState {
    const state = this.ensure(nodeId);
    state.connected = true;
    state.reconnecting = false;
    state.lastConnectedAt = at;
    state.consecutiveFailures = 0;
    state.healthyProbeStreak += 1;
    state.unhealthyProbeStreak = 0;
    state.lastReason = undefined;
    state.failureWindowStartedAt = 0;
    state.circuitOpenedAt = 0;
    return state;
  }

  markReconnecting(nodeId: string): AudioNodeRuntimeState {
    const state = this.ensure(nodeId);
    state.reconnecting = true;
    return state;
  }

  markDisconnected(nodeId: string, reason: string, at = Date.now()): AudioNodeRuntimeState {
    const state = this.ensure(nodeId);
    state.connected = false;
    state.reconnecting = true;
    state.lastDisconnectedAt = at;
    state.lastReason = String(reason ?? "unknown").replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, 500);
    state.consecutiveFailures = Math.min(MAX_FAILURES, state.consecutiveFailures + 1);
    state.unhealthyProbeStreak += 1;
    state.healthyProbeStreak = 0;
    if (!state.failureWindowStartedAt || at - state.failureWindowStartedAt > FAILURE_WINDOW_MS) state.failureWindowStartedAt = at;
    if (state.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) state.circuitOpenedAt = at;
    return state;
  }

  markError(nodeId: string, at = Date.now()): AudioNodeRuntimeState {
    const state = this.ensure(nodeId);
    state.lastErrorAt = at;
    if (!state.failureWindowStartedAt || at - state.failureWindowStartedAt > FAILURE_WINDOW_MS) state.failureWindowStartedAt = at;
    state.consecutiveFailures = Math.min(MAX_FAILURES, state.consecutiveFailures + 1);
    state.unhealthyProbeStreak += 1;
    state.healthyProbeStreak = 0;
    if (state.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) state.circuitOpenedAt = at;
    return state;
  }

  choose(policy: NodeSelectionPolicy = {}): string | undefined {
    const candidates = [...this.states.values()]
      .filter((node) => node.connected && !node.reconnecting && node.id !== policy.exclude)
      .filter((node) => node.healthProbeAt === 0 || Date.now() - node.healthProbeAt <= 60_000)
      .filter((node) => (this.players.get(node.id)?.size ?? 0) < Math.max(1, node.capacityPlayers - node.reservedCapacityPlayers))
      .filter((node) => node.lastSelectionCooldownAt === 0 || Date.now() - node.lastSelectionCooldownAt >= node.selectionCooldownMs)
      .filter((node) => node.systemLoadPercent == null || node.systemLoadPercent <= node.maxSystemLoadPercent)
      .filter((node) => node.lavalinkLoadPercent == null || node.lavalinkLoadPercent <= node.maxLavalinkLoadPercent)
      .filter((node) => node.memoryPercent == null || node.memoryPercent <= node.maxMemoryPercent)
      .filter((node) => node.circuitOpenedAt === 0 || Date.now() - node.circuitOpenedAt >= CIRCUIT_COOLDOWN_MS)
      .filter((node) => (policy.maxConsecutiveFailures === undefined || node.consecutiveFailures <= policy.maxConsecutiveFailures));
    candidates.sort((a, b) => {
      const scoreA = nodeScore(a, this.players.get(a.id)?.size ?? 0);
      const scoreB = nodeScore(b, this.players.get(b.id)?.size ?? 0);
      if (scoreA !== scoreB) return scoreA - scoreB;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.id.localeCompare(b.id);
    });
    const selected = candidates[0];
    if (selected) {
      selected.selectionCount++;
      selected.lastSelectedAt = Date.now();
      selected.lastSelectionCooldownAt = selected.lastSelectedAt;
    }
    return selected?.id;
  }

  recordFailover(nodeId: string): void {
    this.ensure(nodeId).failoverCount++;
  }

  updateProbe(nodeId: string, metrics: { systemLoadPercent?: number; lavalinkLoadPercent?: number; memoryPercent?: number; freeMemoryBytes?: number; probeLatencyMs?: number; at?: number }): void {
    const state = this.ensure(nodeId);
    state.systemLoadPercent = Number.isFinite(metrics.systemLoadPercent) ? Math.max(0, Math.min(100, Number(metrics.systemLoadPercent))) : state.systemLoadPercent;
    state.lavalinkLoadPercent = Number.isFinite(metrics.lavalinkLoadPercent) ? Math.max(0, Math.min(100, Number(metrics.lavalinkLoadPercent))) : state.lavalinkLoadPercent;
    state.memoryPercent = Number.isFinite(metrics.memoryPercent) ? Math.max(0, Math.min(100, Number(metrics.memoryPercent))) : state.memoryPercent;
    state.freeMemoryBytes = Number.isFinite(metrics.freeMemoryBytes) ? Math.max(0, Number(metrics.freeMemoryBytes)) : state.freeMemoryBytes;
    state.probeLatencyMs = Number.isFinite(metrics.probeLatencyMs) ? Math.max(0, Number(metrics.probeLatencyMs)) : state.probeLatencyMs;
    state.healthProbeAt = metrics.at ?? Date.now();
  }

  recordSuccess(nodeId: string, at = Date.now()): void {
    const state = this.ensure(nodeId);
    state.lastConnectedAt = Math.max(state.lastConnectedAt, at);
    if (state.consecutiveFailures > 0 && at - state.failureWindowStartedAt > FAILURE_WINDOW_MS) {
      state.consecutiveFailures = 0;
      state.failureWindowStartedAt = 0;
      state.circuitOpenedAt = 0;
    }
  }

  healthyNodeCount(): number {
    return this.snapshot().filter((node) => node.healthy && !node.circuitOpen).length;
  }

  assertAtLeastOneHealthy(): void {
    if (this.healthyNodeCount() === 0) throw new Error("AUDIO_NO_HEALTHY_NODE");
  }

  snapshot(): readonly AudioNodeRuntimeSnapshot[] {
    return Object.freeze([...this.states.values()]
      .map((node) => {
        const playerCount = this.players.get(node.id)?.size ?? 0;
        return Object.freeze({
          ...node,
          playerCount,
          healthy: node.connected && !node.reconnecting,
          score: nodeScore(node, playerCount),
          circuitOpen: node.circuitOpenedAt > 0 && Date.now() - node.circuitOpenedAt < CIRCUIT_COOLDOWN_MS,
          failureAgeMs: node.failureWindowStartedAt > 0 ? Math.max(0, Date.now() - node.failureWindowStartedAt) : 0,
          selectionCount: node.selectionCount,
          failoverCount: node.failoverCount,
          reservedCapacityPlayers: node.reservedCapacityPlayers,
          admissionCapacityPlayers: Math.max(1, node.capacityPlayers - node.reservedCapacityPlayers),
          capacityUsed: playerCount,
          capacityRemaining: Math.max(0, node.capacityPlayers - playerCount),
          capacityPercent: Math.min(100, Math.round((playerCount / Math.max(1, node.capacityPlayers)) * 10000) / 100),
          lavalinkLoadPercent: node.lavalinkLoadPercent,
          freeMemoryBytes: node.freeMemoryBytes,
          probeLatencyMs: node.probeLatencyMs,
          probeFresh: node.healthProbeAt > 0 && Date.now() - node.healthProbeAt <= 60_000,
          playerGuildIds: Object.freeze(this.playersForNode(node.id)),
        });
      })
      .sort((a, b) => a.id.localeCompare(b.id)));
  }

  assertTopology(expectedIds: readonly string[]): void {
    const expected = new Set(expectedIds.map(safeId));
    const actual = new Set(this.states.keys());
    if (expected.size !== actual.size || [...expected].some((id) => !actual.has(id))) {
      throw new Error("AUDIO_NODE_TOPOLOGY_DRIFT");
    }
  }
}

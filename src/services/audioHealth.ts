export interface AudioNodeHealthSnapshot {
  id: string;
  connected: boolean;
  reconnecting: boolean;
  consecutiveFailures: number;
  lastConnectedAt: number;
  lastDisconnectedAt: number;
  lastErrorAt: number;
  lastReason?: string;
}

const nodes = new Map<string, AudioNodeHealthSnapshot>();

function clone(node: AudioNodeHealthSnapshot): AudioNodeHealthSnapshot {
  return { ...node };
}

export function registerAudioNode(id: string): AudioNodeHealthSnapshot {
  const existing = nodes.get(id);
  if (existing) return clone(existing);
  const state: AudioNodeHealthSnapshot = {
    id,
    connected: false,
    reconnecting: false,
    consecutiveFailures: 0,
    lastConnectedAt: 0,
    lastDisconnectedAt: 0,
    lastErrorAt: 0,
  };
  nodes.set(id, state);
  return clone(state);
}

export function updateAudioNode(id: string, patch: Partial<Omit<AudioNodeHealthSnapshot, "id">>): AudioNodeHealthSnapshot {
  const current = registerAudioNode(id);
  const next = { ...current, ...patch, id };
  nodes.set(id, next);
  return clone(next);
}

export function audioNodeHealthSnapshot(): AudioNodeHealthSnapshot[] {
  return [...nodes.values()].map(clone).sort((a, b) => a.id.localeCompare(b.id));
}

export function audioHealthSummary() {
  const snapshot = audioNodeHealthSnapshot();
  return {
    total: snapshot.length,
    connected: snapshot.filter((node) => node.connected).length,
    reconnecting: snapshot.filter((node) => node.reconnecting).length,
    degraded: snapshot.filter((node) => node.consecutiveFailures > 0).length,
    nodes: snapshot,
  };
}

export function resetAudioHealth(): void {
  nodes.clear();
}

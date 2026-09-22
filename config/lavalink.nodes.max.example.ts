/**
 * MAX-STRENGTH Lavalink topology reference.
 * Copy values into LAVALINK_NODES as JSON/environment configuration.
 * Never commit real authorization tokens.
 */
export const MAX_LAVALINK_NODE_POLICY = Object.freeze({
  topology: {
    maxNodes: 32,
    roles: ["PRIMARY", "SECONDARY", "EDGE", "BACKUP"] as const,
    selection: ["health", "cpu", "lavalinkLoad", "memory", "latency", "capacity", "priority", "weight"] as const,
  },
  admission: {
    defaultCapacityPlayers: 250,
    reservePercent: 2,
    maxSystemLoadPercent: 85,
    maxLavalinkLoadPercent: 85,
    maxMemoryPercent: 90,
    maxLatencyMs: 1500,
  },
  health: {
    intervalMs: 15000,
    timeoutMs: 4000,
    staleAfterMs: 45000,
    failureThreshold: 3,
    recoveryThreshold: 2,
    maxConcurrentProbes: 4,
    jitterMs: 1500,
  },
  recovery: {
    maxFailoverAttempts: 5,
    cooldownMs: 5000,
    resumeTimeoutMs: 300000,
  },
});

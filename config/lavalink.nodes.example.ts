/**
 * NOIR MUSIC // LAVALINK NODE TOPOLOGY V41
 *
 * This is documentation/config-shape only. Real authorization values stay in
 * environment variables. LAVALINK_NODES accepts a JSON array of these fields.
 *
 * NODE LINE FORMAT
 * ─────────────────────────────────────────────────────────────────────────────
 * ROLE       ID       ENDPOINT             PRIORITY WEIGHT CAP  RES CPU MEM LAT
 * PRIMARY    node-a   10.0.0.10:2333       10       100   250   5   85  90  1500
 * SECONDARY  node-b   10.0.0.11:2333       20       100   250   5   85  90  1500
 * EDGE       node-c   edge.example:443      30       150   500  10   80  85  1200
 * BACKUP     node-d   10.0.0.12:2333       40        75   150  10   75  80  1500
 *
 * CAP = hard player ceiling.
 * RES = protected capacity reserved for failover/recovery.
 * Admission capacity = CAP - RES.
 * CPU/MEM/LAT are health admission limits, not guarantees of real server capacity.
 * Health probes use GET /v4/stats with the node Authorization header.
 */
export const LAVALINK_NODE_CONFIG_FIELDS = Object.freeze([
  "id", "host", "port", "authorization", "secure", "priority", "weight", "role", "region",
  "resumeTimeoutMs", "capacityPlayers", "reservedCapacityPlayers",
  "healthIntervalMs", "healthTimeoutMs", "healthStaleAfterMs",
  "failureThreshold", "recoveryThreshold",
  "maxSystemLoadPercent", "maxLavalinkLoadPercent", "maxMemoryPercent", "minFreeMemoryBytes",
  "maxLatencyMs", "connectGraceMs", "selectionCooldownMs", "enabled", "allowNewPlayers",
] as const);

export const LAVALINK_NODE_RUNTIME_RULES = Object.freeze({
  endpoint: "/v4/stats",
  admission: "connected && freshProbe && belowCpu && belowLavalinkLoad && belowMemory && belowLatency && players < capacity-reserve",
  selection: "health -> capacity -> failure/circuit -> score -> priority -> weight -> stable id",
  failover: "failed node excluded; reserved capacity protected; recovered node re-enters after healthy probes",
  secretPolicy: "authorization is runtime-only and must never be committed to source control",
} as const);

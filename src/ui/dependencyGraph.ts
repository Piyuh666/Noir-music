/**
 * Runtime graph metadata consumed by tests and diagnostics. The graph models
 * the intended direction rather than forcing every module to import every
 * other module.
 */
export const NOIR_UI_DEPENDENCY_LAYERS = Object.freeze([
  "discord-event",
  "ui-router",
  "ui-action-registry",
  "ui-application-service",
  "domain-state",
  "infrastructure",
  "ui-state",
  "ui-renderer",
] as const);

export type NoirUIDependencyLayer = typeof NOIR_UI_DEPENDENCY_LAYERS[number];

export const NOIR_UI_DEPENDENCY_DIRECTION = Object.freeze({
  "discord-event": ["ui-router", "ui-action-registry"],
  "ui-router": ["ui-action-registry", "ui-application-service", "ui-state"],
  "ui-action-registry": [],
  "ui-application-service": ["domain-state", "infrastructure"],
  "domain-state": ["infrastructure"],
  "infrastructure": [],
  "ui-state": ["domain-state"],
  "ui-renderer": ["ui-state", "ui-action-registry"],
} as const);

export function assertNoirUIDependencyDirection(): true {
  const rank = new Map<string, number>(NOIR_UI_DEPENDENCY_LAYERS.map((name, index) => [name, index]));
  for (const [from, targets] of Object.entries(NOIR_UI_DEPENDENCY_DIRECTION)) {
    const fromRank = rank.get(from);
    if (fromRank === undefined) throw new Error(`Unknown UI dependency layer: ${from}`);
    for (const target of targets) {
      const targetRank = rank.get(target);
      if (targetRank === undefined || targetRank > fromRank) {
        throw new Error(`Invalid UI dependency direction: ${from} -> ${target}`);
      }
    }
  }
  return true;
}

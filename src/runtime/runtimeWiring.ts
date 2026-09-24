/**
 * NOIR MUSIC — 2X ULTRA LIVE RUNTIME SPINE
 *
 * This is the application-level wiring contract. It deliberately connects
 * boundaries through their public APIs instead of importing implementation
 * details into unrelated files. The graph is executable: startup asserts the
 * command registry, canonical UI router, dependency direction and session
 * bootstrap are all live before Discord login is attempted.
 */
import { commandRegistryHealth } from "../commands/loader";
import { GuildSession } from "../audio/session";
import { assertNoirUIDependencyDirection } from "../ui/dependencyGraph";
import { assertCanonicalUIRuntimeWiring } from "../ui/runtimeWiring";
import { assertUIRouterNoDeadHandlers } from "../ui/router";
import { UI_ACTION_IDS } from "../ui/actions";
import { incrementRuntimeCounter } from "../services/runtimeHealth";
import { assertFeatureFabric } from "./featureFabric";
import { buildAudioRuntimeWiring } from "../audio/runtimeWiring";
import { playerStateBusHealth } from "../events/playerStateBus";

export const NOIR_RUNTIME_WIRING_VERSION = "NOIR-RUNTIME-SPINE-V48-4-CONTROL-PLANE" as const;

export interface NoirRuntimeWiringSnapshot {
  version: typeof NOIR_RUNTIME_WIRING_VERSION;
  commandsLoaded: boolean;
  commandModules: number;
  commandCount: number;
  activeSessions: number;
  uiActions: number;
  uiHandlers: number;
  uiSealed: boolean;
  dependencyDirectionSealed: boolean;
  featureFabricSealed: boolean;
  playerStateBusListeners: number;
}

/** Fail-closed boot gate: every canonical interaction must have a definition,
 * producer and live handler before the process is allowed to login. */
export function assertNoirRuntimeWiring(): NoirRuntimeWiringSnapshot {
  const fabric = assertFeatureFabric();
  const commands = fabric.commands;
  if (!commands.loaded) throw new Error("NOIR_RUNTIME_COMMAND_REGISTRY_NOT_LOADED");
  if (commands.modules <= 0 || commands.commandCount <= 0) throw new Error("NOIR_RUNTIME_COMMAND_GRAPH_EMPTY");

  assertNoirUIDependencyDirection();
  const ui = assertCanonicalUIRuntimeWiring();
  assertUIRouterNoDeadHandlers(UI_ACTION_IDS);

  const sessions = GuildSession.activeSessionCount();
  incrementRuntimeCounter("runtime.boot.wiring_assertions");
  return Object.freeze({
    version: NOIR_RUNTIME_WIRING_VERSION,
    commandsLoaded: commands.loaded,
    commandModules: commands.modules,
    commandCount: commands.commandCount,
    activeSessions: sessions,
    uiActions: ui.actions,
    uiHandlers: ui.handlers,
    uiSealed: ui.sealed,
    dependencyDirectionSealed: true,
    featureFabricSealed: fabric.sealed,
    playerStateBusListeners: playerStateBusHealth().listeners,
  });
}

export function recordRuntimeFeatureBoundary(feature: string): void {
  const key = String(feature ?? "").trim().toLowerCase().replace(/[^a-z0-9._:-]/g, "-");
  if (!key) throw new TypeError("Runtime feature name is required");
  incrementRuntimeCounter(`runtime.feature.${key}`);
}

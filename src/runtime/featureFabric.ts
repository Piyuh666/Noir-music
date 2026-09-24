/**
 * NOIR MUSIC — REAL FEATURE FABRIC
 *
 * This module is an application-level composition boundary, not an audit sink.
 * It reads live subsystem state through public APIs and returns one immutable
 * snapshot consumed by the runtime boot gate and operator telemetry.
 *
 * Dependency direction:
 * command loader + audio health + canonical UI -> feature fabric -> runtime gate
 */
import { commandRegistryHealth } from "../commands/loader";
import { audioHealthSummary } from "../services/audioHealth";
import { runtimeHealth } from "../services/runtimeHealth";
import { UI_ACTION_IDS } from "../ui/actions";
import { CANONICAL_UI_HANDLERS, canonicalUIHandlerIds } from "../ui/handlers";

export interface FeatureFabricSnapshot {
  readonly commands: ReturnType<typeof commandRegistryHealth>;
  readonly audio: ReturnType<typeof audioHealthSummary>;
  readonly runtime: ReturnType<typeof runtimeHealth>;
  readonly ui: {
    readonly actions: number;
    readonly handlers: number;
    readonly complete: boolean;
  };
  readonly sealed: boolean;
}

export function composeFeatureFabric(): FeatureFabricSnapshot {
  const commands = commandRegistryHealth();
  const audio = audioHealthSummary();
  const runtime = runtimeHealth();
  const handlers = canonicalUIHandlerIds();
  const actionCount = UI_ACTION_IDS.length;
  const complete = handlers.length === actionCount
    && UI_ACTION_IDS.every((id) => Boolean(CANONICAL_UI_HANDLERS[id]));

  const sealed = commands.loaded
    && commands.modules > 0
    && commands.commandCount > 0
    && complete;

  return Object.freeze({
    commands,
    audio,
    runtime,
    ui: Object.freeze({ actions: actionCount, handlers: handlers.length, complete }),
    sealed,
  });
}

export function assertFeatureFabric(): FeatureFabricSnapshot {
  const snapshot = composeFeatureFabric();
  if (!snapshot.sealed) throw new Error("NOIR_FEATURE_FABRIC_NOT_SEALED");
  return snapshot;
}

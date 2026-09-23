import { NOIR_UI_VERSION } from "./uiVersion";
/**
 * NOIR MUSIC — canonical UI runtime wiring contract.
 * This module is intentionally dependency-light so CI can validate the UI
 * graph without starting Discord, Lavalink, Redis, or PostgreSQL.
 */
import { UI_ACTION_IDS, UIAction, type UIActionId } from "./actions";
import { getUIAction, listUIActions, uiActionRegistryAudit } from "./actionRegistry";
import { UI_RENDERED_ACTION_IDS, UI_FLOW_ACTION_IDS } from "./components";
import { hasUIHandler, uiRouterAudit } from "./router";
import { canonicalUIHandlerIds } from "./handlers";
import { assertRealUiWiring } from "./ultraWiring";

export interface UIRuntimeWiringReport {
  canonicalVersion: typeof NOIR_UI_VERSION;
  actions: number;
  definitions: number;
  handlers: number;
  missingDefinitions: UIActionId[];
  missingHandlers: UIActionId[];
  missingProducers: UIActionId[];
  unknownDefinitions: string[];
  duplicateActionIds: number;
  invalidDefinitions: number;
  dedicatedHandlers: number;
  missingDedicatedHandlers: UIActionId[];
  auxiliaryModules: number;
  auxiliaryPassed: number;
  auxiliaryFailed: string[];
  sealed: boolean;
}

export function collectCanonicalUIRuntimeWiring(): UIRuntimeWiringReport {
  const definitions = listUIActions();
  const definitionIds = new Set(definitions.map((item) => item.id));
  const canonical = [...UI_ACTION_IDS];
  const missingDefinitions = canonical.filter((id) => !definitionIds.has(id));
  const missingHandlers = canonical.filter((id) => !hasUIHandler(id));
  const produced = new Set<string>([...UI_RENDERED_ACTION_IDS, ...UI_FLOW_ACTION_IDS]);
  const missingProducers = canonical.filter((id) => !produced.has(id));
  const unknownDefinitions = definitions.filter((item) => !canonical.includes(item.id)).map((item) => item.id);
  const registryAudit = uiActionRegistryAudit();
  const routerAudit = uiRouterAudit();
  const dedicated = new Set(canonicalUIHandlerIds());
  const missingDedicatedHandlers = canonical.filter((id) => !dedicated.has(id));
  assertRealUiWiring();
  const auxiliary = {
    total: 0,
    passed: 0,
    failed: [] as string[],
    sealed: true,
  };
  return {
    canonicalVersion: NOIR_UI_VERSION,
    actions: canonical.length,
    definitions: definitions.length,
    handlers: routerAudit.count,
    missingDefinitions,
    missingHandlers,
    missingProducers,
    unknownDefinitions,
    duplicateActionIds: registryAudit.duplicates,
    invalidDefinitions: registryAudit.invalid,
    dedicatedHandlers: dedicated.size,
    missingDedicatedHandlers,
    auxiliaryModules: auxiliary.total,
    auxiliaryPassed: auxiliary.passed,
    auxiliaryFailed: [...auxiliary.failed],
    sealed: missingDefinitions.length === 0 && missingHandlers.length === 0 && missingProducers.length === 0 && unknownDefinitions.length === 0 && registryAudit.sealed && auxiliary.sealed,
  };
}

export function assertCanonicalUIRuntimeWiring(): UIRuntimeWiringReport {
  const report = collectCanonicalUIRuntimeWiring();
  if (!report.auxiliaryFailed.length) assertRealUiWiring();
  if (!report.sealed) {
    throw new Error(JSON.stringify({
      code: "NOIR_UI_RUNTIME_WIRING_INCOMPLETE",
      missingDefinitions: report.missingDefinitions,
      missingHandlers: report.missingHandlers,
      missingProducers: report.missingProducers,
      unknownDefinitions: report.unknownDefinitions,
      duplicateActionIds: report.duplicateActionIds,
      invalidDefinitions: report.invalidDefinitions,
      dedicatedHandlers: report.dedicatedHandlers,
      missingDedicatedHandlers: report.missingDedicatedHandlers,
      auxiliaryModules: report.auxiliaryModules,
      auxiliaryPassed: report.auxiliaryPassed,
      auxiliaryFailed: report.auxiliaryFailed,
    }));
  }
  return report;
}

export function assertKnownCanonicalAction(id: string): UIActionId {
  if (!UI_ACTION_IDS.includes(id as UIActionId) || !getUIAction(id)) throw new Error(`NOIR_UI_UNKNOWN_ACTION:${id}`);
  return id as UIActionId;
}

export const CANONICAL_UI_ACTIONS = Object.freeze({ ...UIAction });

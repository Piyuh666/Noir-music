/**
 * NOIR MUSIC COMMAND LOADER — deterministic, fail-fast application bootstrap.
 *
 * Category modules register into one shared registry. The loader deliberately
 * contains no command implementations: its job is orchestration, ordering,
 * validation, diagnostics, and boot-time observability. Keeping this boundary
 * explicit prevents accidental double registration and makes command-count
 * drift impossible to hide.
 */
import { registry } from "./registry";
import { registerPlaybackCommands } from "./playback";
import { registerQueueCommands } from "./queue";
import { registerVoiceCommands } from "./voice";
import { registerDjCommands } from "./dj";
import { registerSettingsCommands } from "./settings";
import { registerHelpCommands } from "./help";
import { registerDiscoveryCommands } from "./discovery";
import { registerPlaylistCommands } from "./playlists";
import { registerLyricsCommands } from "./lyrics";
import { registerEffectsCommands } from "./effects";
import { registerRadioCommands } from "./radio";
import { registerStatisticsCommands } from "./statistics";
import { registerLibraryCommands } from "./library";
import { registerModesCommands } from "./modes";
import { registerAutomationCommands } from "./automation";
import { logger } from "../utils/logger";
import type { CommandModuleReport } from "./moduleRuntime";

const loaders: ReadonlyArray<readonly [string, () => CommandModuleReport]> = Object.freeze([
  ["playback", registerPlaybackCommands],
  ["queue", registerQueueCommands],
  ["voice", registerVoiceCommands],
  ["dj", registerDjCommands],
  ["settings", registerSettingsCommands],
  ["help", registerHelpCommands],
  ["discovery", registerDiscoveryCommands],
  ["playlists", registerPlaylistCommands],
  ["lyrics", registerLyricsCommands],
  ["effects", registerEffectsCommands],
  ["radio", registerRadioCommands],
  ["statistics", registerStatisticsCommands],
  ["library", registerLibraryCommands],
  ["modes", registerModesCommands],
  ["automation", registerAutomationCommands],
]);

let loaded = false;
let loading = false;
let loadReports: readonly CommandModuleReport[] = Object.freeze([]);

export function loadCommands(): void {
  if (loaded) return;
  if (loading) throw new Error("Command loader re-entry detected");
  loading = true;
  const started = Date.now();
  try {
    const reports: CommandModuleReport[] = [];
    for (const [category, register] of loaders) {
      const report = register();
      reports.push(report);
      logger.debug({
        category,
        module: report.id,
        added: report.commandsAdded,
        topLevelAdded: report.topLevelAdded,
        groupsAdded: report.groupsAdded,
        durationMs: report.durationMs,
        registryVersion: report.registryVersionAfter,
        total: report.commandsAfter,
      }, "NOIR MUSIC command module loaded and accounted");
    }
    registry.validate();
    const diagnostics = registry.diagnostics();
    if (diagnostics.topLevelRemaining < 10) {
      logger.warn({ ...diagnostics }, "NOIR MUSIC command top-level budget is nearly exhausted");
    }
    loadReports = Object.freeze(reports);
    logger.info({
      ...diagnostics,
      fingerprint: registry.snapshot().fingerprint,
      modules: reports.length,
      moduleCommands: reports.reduce((sum, report) => sum + report.commandsAdded, 0),
      moduleTopLevel: reports.reduce((sum, report) => sum + report.topLevelAdded, 0),
      ms: Date.now() - started,
    }, "NOIR MUSIC command registry sealed");
    loaded = true;
  } catch (error) {
    logger.fatal({ err: error, ms: Date.now() - started }, "NOIR MUSIC command registry bootstrap failed");
    throw error;
  } finally {
    loading = false;
  }
}

loadCommands();

export function commandRegistryHealth() {
  const diagnostics = registry.diagnostics();
  return Object.freeze({
    loaded,
    ...diagnostics,
    fingerprint: registry.snapshot().fingerprint,
    modules: loadReports.length,
    moduleReports: loadReports,
  });
}

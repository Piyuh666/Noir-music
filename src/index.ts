/**
 * NOIR MUSIC APPLICATION ENTRYPOINT — hardened lifecycle coordinator.
 *
 * This file intentionally remains the only owner of process-level startup and
 * shutdown.  Discord, Lavalink, database, command state, and runtime-health
 * components are created in a deterministic order and torn down in the
 * reverse operational order.  The goal is not more code for its own sake; the
 * goal is to make failure boundaries explicit, observable, and repeat-safe.
 */
import { Client, Events, GatewayIntentBits } from "discord.js";
import { config, configHealth, validateProductionConfig } from "./config";
import { logger } from "./utils/logger";
import "./commands/loader";
import { commandRegistryHealth } from "./commands/loader";
import { createAudioManager } from "./audio/manager";
import { GuildSession } from "./audio/session";
import { registerReadyHandler } from "./events/ready";
import { registerInteractionHandler } from "./events/interactionCreate";
import { disconnectDatabase } from "./database/prisma";
import { clearGuardState } from "./services/commandGuard";
import { clearCommandMetrics } from "./services/commandMetrics";
import { runtimeHealth, startRuntimeHealthSampler, stopRuntimeHealthSampler } from "./services/runtimeHealth";
import { assertNoirRuntimeWiring, recordRuntimeFeatureBoundary } from "./runtime/runtimeWiring";
import { livePlayerPanelService } from "./services/livePlayerPanelService";
import { checkDatabaseReady, isDatabaseReady } from "./database/prisma";
import { setReadiness } from "./runtime/readiness";
import { startHealthServer, stopHealthServer } from "./services/healthServer";

type BootPhase = "created" | "health-started" | "discord-created" | "audio-created" | "handlers-bound" | "logging-in" | "online" | "shutting-down" | "stopped";

interface BootState {
  phase: BootPhase;
  startedAt: number;
  loginStartedAt?: number;
  onlineAt?: number;
  shutdownStartedAt?: number;
}

function now(): number { return Date.now(); }

function transition(state: BootState, phase: BootPhase): void {
  state.phase = phase;
  logger.debug({ phase, uptimeMs: now() - state.startedAt }, "NOIR MUSIC lifecycle phase transition");
}

function safeProcessExit(code: number): never {
  process.exit(code);
  throw new Error("unreachable");
}

async function main(): Promise<void> {
  const validation = validateProductionConfig();
  if (!validation.valid) {
    logger.fatal({ environment: validation.environment, failures: validation.failures }, "NOIR MUSIC production configuration validation failed");
    process.exit(78);
  }
  setReadiness("config", "ready");
  const state: BootState = { phase: "created", startedAt: now() };
  let shuttingDown = false;
  let shutdownTimer: ReturnType<typeof setTimeout> | undefined;

  startRuntimeHealthSampler();
  setReadiness("runtime", "ready");
  transition(state, "health-started");

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
  });
  transition(state, "discord-created");
  setReadiness("discord", "starting");
  setReadiness("database", "starting");
  setReadiness("audio", "starting");

  const audioManager = createAudioManager(client);
  livePlayerPanelService.start(client);
  transition(state, "audio-created");
  await startHealthServer({
    isDiscordReady: () => client.isReady(),
    healthyLavalinkNodes: () => { try { return (audioManager as unknown as { getNoirHealthyNodeCount?: () => number }).getNoirHealthyNodeCount?.() ?? 0; } catch { return 0; } },
    databaseReady: isDatabaseReady,
  });

  const dbReady = await checkDatabaseReady();
  if (!dbReady) { setReadiness("database", "failed", "database_unreachable"); throw new Error("NOIR_DATABASE_NOT_READY"); }
  setReadiness("database", "ready");
  // 2X live-spine gate: command → audio/session → UI router must be sealed
  // before Discord authentication can make the application externally live.
  const wiring = assertNoirRuntimeWiring();
  recordRuntimeFeatureBoundary("boot.ready-spine");
  setReadiness("audio", "ready");
  logger.info({ wiring }, "NOIR MUSIC live runtime wiring sealed");

  const shutdown = async (signal: string, exitCode = 0): Promise<void> => {
    if (shuttingDown) {
      logger.warn({ signal, phase: state.phase }, "NOIR MUSIC duplicate shutdown request ignored");
      return;
    }
    shuttingDown = true;
    state.shutdownStartedAt = now();
    transition(state, "shutting-down");
    for (const component of ["discord", "database", "audio", "runtime"] as const) setReadiness(component, "stopping");

    logger.info({
      signal,
      guilds: client.guilds.cache.size,
      sessions: GuildSession.activeSessionCount(),
      phase: state.phase,
      runtime: runtimeHealth(),
      commands: commandRegistryHealth(),
    }, "NOIR MUSIC shutdown requested");

    shutdownTimer = setTimeout(() => {
      logger.fatal({ signal, phase: state.phase }, "NOIR MUSIC shutdown grace period expired; forcing process exit");
      safeProcessExit(exitCode || 1);
    }, 15_000);
    shutdownTimer.unref();

    // Detach high-volume voice forwarding before destroying Discord so no late
    // packet can race with Lavalink teardown.
    try {
      client.removeAllListeners(Events.VoiceStateUpdate);
    } catch (error) {
      logger.error({ err: error }, "NOIR MUSIC voice listener teardown failed");
    }

    try {
      client.destroy();
    } catch (error) {
      logger.error({ err: error }, "NOIR MUSIC Discord client shutdown failed");
    }

    livePlayerPanelService.stop();
    await stopHealthServer();
    // Release durable control-plane leases before closing Prisma so a clean
    // shutdown does not leave another instance waiting for lease expiry.
    (audioManager as unknown as { stopNoirSessionRecovery?: () => void }).stopNoirSessionRecovery?.();

    try {
      await disconnectDatabase();
    } catch (error) {
      logger.error({ err: error }, "NOIR MUSIC database disconnect failed");
      exitCode = exitCode || 1;
    }
    clearGuardState();
    clearCommandMetrics();
    stopRuntimeHealthSampler();

    transition(state, "stopped");
    logger.info({
      exitCode,
      shutdownMs: state.shutdownStartedAt ? now() - state.shutdownStartedAt : 0,
      runtime: runtimeHealth(),
    }, "NOIR MUSIC shutdown complete");

    if (shutdownTimer) clearTimeout(shutdownTimer);
    safeProcessExit(exitCode);
  };

  client.on("raw", (packet) => {
    if (shuttingDown) return;
    try {
      audioManager.sendRawData(packet);
    } catch (error) {
      logger.error({ err: error }, "NOIR MUSIC failed to forward Discord raw packet to Lavalink");
    }
  });
  client.on("error", (err) => logger.error({ err }, "NOIR MUSIC Discord client error"));
  client.on("shardError", (err) => logger.error({ err }, "NOIR MUSIC Discord shard transport error"));
  client.on("warn", (message) => logger.warn({ message }, "NOIR MUSIC Discord client warning"));

  await registerReadyHandler(client);
  registerInteractionHandler(client);
  transition(state, "handlers-bound");

  client.once("ready", () => {
    const readyWiring = assertNoirRuntimeWiring();
    recordRuntimeFeatureBoundary("discord.ready");
    state.onlineAt = now();
    setReadiness("discord", "ready");
    transition(state, "online");
    audioManager.init({ id: config.discord.clientId, username: client.user?.username ?? "NOIR MUSIC" });
    logger.info({
      user: client.user?.tag,
      guilds: client.guilds.cache.size,
      nodes: config.lavalink.nodes.length,
      startupMs: state.onlineAt - state.startedAt,
      config: configHealth(),
      commands: commandRegistryHealth(),
      wiring: readyWiring,
    }, "NOIR MUSIC online");
  });

  process.once("SIGINT", () => void shutdown("SIGINT", 0));
  process.once("SIGTERM", () => void shutdown("SIGTERM", 0));
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason, phase: state.phase }, "NOIR MUSIC unhandled promise rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.fatal({ err, phase: state.phase }, "NOIR MUSIC uncaught exception; initiating controlled shutdown");
    void shutdown("uncaughtException", 1);
  });

  state.loginStartedAt = now();
  transition(state, "logging-in");
  await client.login(config.discord.token);
}

main().catch((err) => {
  logger.fatal({ err }, "NOIR MUSIC fatal startup error");
  stopRuntimeHealthSampler();
  void stopHealthServer().finally(() => process.exit(1));
});

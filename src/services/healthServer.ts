import { createServer, type Server } from "node:http";
import { config, configHealth } from "../config";
import { logger } from "../utils/logger";
import { readinessSnapshot } from "../runtime/readiness";
import { runtimeHealth } from "./runtimeHealth";

export interface HealthServerOptions {
  readonly isDiscordReady: () => boolean;
  readonly healthyLavalinkNodes: () => number;
  readonly databaseReady: () => boolean;
}

let server: Server | undefined;

function json(res: import("node:http").ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(body);
}

export async function startHealthServer(options: HealthServerOptions): Promise<void> {
  if (server) return;
  server = createServer((req, res) => {
    const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });
    if (path === "/health/live") return json(res, 200, { status: "alive", uptimeMs: runtimeHealth().uptimeMs });
    if (path === "/health/ready") {
      const readiness = readinessSnapshot();
      const healthyNodes = options.healthyLavalinkNodes();
      const ready = readiness.ready && options.isDiscordReady() && options.databaseReady() && healthyNodes > 0;
      return json(res, ready ? 200 : 503, { status: ready ? "ready" : "not_ready", readiness, healthyLavalinkNodes: healthyNodes });
    }
    if (path === "/health") {
      const readiness = readinessSnapshot();
      const snapshot = runtimeHealth();
      return json(res, 200, { status: readiness.ready ? "ok" : "starting", version: config.app.version, environment: config.app.environment, readiness, runtime: snapshot });
    }
    if (path === "/health/config") {
      if (config.security.allowDebugEndpoints !== true) return json(res, 404, { error: "not_found" });
      return json(res, 200, configHealth());
    }
    return json(res, 404, { error: "not_found" });
  });

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => { server?.off("listening", onListening); reject(error); };
    const onListening = () => { server?.off("error", onError); resolve(); };
    server?.once("error", onError);
    server?.once("listening", onListening);
    server?.listen(config.observability.healthPort, config.observability.healthBindHost);
  });
  logger.info({ host: config.observability.healthBindHost, port: config.observability.healthPort }, "NOIR MUSIC health server listening");
}

export async function stopHealthServer(): Promise<void> {
  const active = server;
  server = undefined;
  if (!active) return;
  await new Promise<void>((resolve) => active.close(() => resolve()));
}

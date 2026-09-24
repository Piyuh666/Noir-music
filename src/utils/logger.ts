import pino from "pino";
import { config } from "../config";

export const logger = pino({
  level: config.observability.logLevel,
  transport: process.env.NODE_ENV === "production" ? undefined : {
    target: "pino-pretty",
    options: { colorize: true, translateTime: "HH:MM:ss", singleLine: true },
  },
  redact: {
    paths: ["token", "password", "clientSecret", "authorization", "headers.authorization"],
    censor: "[REDACTED]",
  },
});

export function musicLog(event: string, meta: { guildId: string; userId?: string; track?: string; extra?: Record<string, unknown> }): void {
  logger.info({ event, ...meta }, `[MUSIC] ${event}`);
}

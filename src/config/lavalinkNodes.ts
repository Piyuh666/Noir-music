import "dotenv/config";
import { BOT_CONFIG } from "./botConfig";

/**
 * NOIR MUSIC // LAVALINK NODE TOPOLOGY V41
 *
 * This module is the single source of truth for Lavalink node admission.
 * It deliberately keeps credentials in environment variables while validating
 * every topology field before the audio manager can start.
 */

export type LavalinkNodeRole = "PRIMARY" | "SECONDARY" | "EDGE" | "BACKUP";

export interface LavalinkNodeConfig {
  readonly id: string;
  readonly host: string;
  readonly port: number;
  readonly authorization: string;
  readonly secure: boolean;
  readonly priority: number;
  readonly weight: number;
  readonly role: LavalinkNodeRole;
  readonly region?: string;
  readonly resumeTimeoutMs: number;
  readonly capacityPlayers: number;
  readonly reservedCapacityPlayers: number;
  readonly healthIntervalMs: number;
  readonly healthTimeoutMs: number;
  readonly healthStaleAfterMs: number;
  readonly failureThreshold: number;
  readonly recoveryThreshold: number;
  readonly maxSystemLoadPercent: number;
  readonly maxLavalinkLoadPercent: number;
  readonly maxMemoryPercent: number;
  readonly minFreeMemoryBytes: number;
  readonly maxLatencyMs: number;
  readonly connectGraceMs: number;
  readonly selectionCooldownMs: number;
  readonly enabled: boolean;
  readonly allowNewPlayers: boolean;
}

export interface LavalinkHealthConfig {
  readonly enabled: boolean;
  readonly intervalMs: number;
  readonly timeoutMs: number;
  readonly staleAfterMs: number;
  readonly failureThreshold: number;
  readonly recoveryThreshold: number;
  readonly maxConcurrentProbes: number;
  readonly jitterMs: number;
}

export interface LavalinkTopologySummary {
  readonly count: number;
  readonly enabled: number;
  readonly admissionEnabled: number;
  readonly totalCapacityPlayers: number;
  readonly reservedCapacityPlayers: number;
  readonly regions: readonly string[];
  readonly secureNodes: number;
}

const MAX_NODES = 32;
const MAX_HOST_LENGTH = 253;
const MAX_AUTH_LENGTH = 1024;
const MIN_PORT = 1;
const MAX_PORT = 65535;

function intEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  if (!/^-?\d+$/.test(raw.trim())) throw new Error(`${name} must be an integer between ${min} and ${max}`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${name} must be an integer between ${min} and ${max}`);
  return value;
}

function numberValue(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const result = Number(value);
  return Number.isFinite(result) ? result : NaN;
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = raw.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(value)) return true;
  if (["false", "0", "no", "off"].includes(value)) return false;
  throw new Error(`${name} must be boolean`);
}

function boolValue(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && (value === 0 || value === 1)) return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function cleanText(value: unknown, fallback: string, max: number, label: string): string {
  const result = String(value ?? fallback).trim();
  if (!result || result.length > max || /[\u0000-\u001F\u007F]/.test(result)) throw new Error(`${label} is invalid`);
  return result;
}

function cleanHost(value: unknown): string {
  const result = cleanText(value, "127.0.0.1", MAX_HOST_LENGTH, "Lavalink node host");
  if (/\s/.test(result) || result.includes("/")) throw new Error("Lavalink node host must not contain whitespace or paths");
  return result;
}

function integerField(value: unknown, fallback: number, min: number, max: number, label: string): number {
  const result = numberValue(value, fallback);
  if (!Number.isSafeInteger(result) || result < min || result > max) throw new Error(`${label} must be an integer between ${min} and ${max}`);
  return result;
}

function percentField(value: unknown, fallback: number, label: string): number {
  return integerField(value, fallback, 1, 100, label);
}

function roleField(value: unknown, fallback: LavalinkNodeRole): LavalinkNodeRole {
  const role = String(value ?? fallback).trim().toUpperCase();
  if (!["PRIMARY", "SECONDARY", "EDGE", "BACKUP"].includes(role)) throw new Error("Lavalink node role is invalid");
  return role as LavalinkNodeRole;
}

function parseNode(index: number, value: unknown): LavalinkNodeConfig {
  if (!value || typeof value !== "object") throw new Error(`Lavalink node ${index + 1} must be an object`);
  const n = value as Record<string, unknown>;
  const id = cleanText(n.id, `node-${index + 1}`, 64, `Lavalink node ${index + 1} id`);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(id)) throw new Error(`Lavalink node ${index + 1} has an invalid id`);

  const host = cleanHost(n.host);
  const port = integerField(n.port, 2333, MIN_PORT, MAX_PORT, `Lavalink node ${id} port`);
  const authorization = cleanText(n.authorization, "", MAX_AUTH_LENGTH, `Lavalink node ${id} authorization`);
  if (!authorization) throw new Error(`Lavalink node ${id} has an invalid authorization`);

  const priority = integerField(n.priority, 100, 0, 100_000, `Lavalink node ${id} priority`);
  const weight = integerField(n.weight, 100, 1, 10_000, `Lavalink node ${id} weight`);
  const role = roleField(n.role, index === 0 ? "PRIMARY" : "SECONDARY");
  const regionRaw = n.region === undefined ? undefined : cleanText(n.region, "", 64, `Lavalink node ${id} region`);
  const region = regionRaw || undefined;

  const resumeTimeoutMs = integerField(n.resumeTimeoutMs, 300_000, 30_000, 3_600_000, `Lavalink node ${id} resumeTimeoutMs`);
  const capacityPlayers = integerField(n.capacityPlayers, 250, 1, 100_000, `Lavalink node ${id} capacityPlayers`);
  const reservedCapacityPlayers = integerField(n.reservedCapacityPlayers, Math.min(5, Math.max(1, Math.floor(capacityPlayers * 0.02))), 0, capacityPlayers - 1, `Lavalink node ${id} reservedCapacityPlayers`);

  const healthIntervalMs = integerField(n.healthIntervalMs, 15_000, 2_000, 300_000, `Lavalink node ${id} healthIntervalMs`);
  const healthTimeoutMs = integerField(n.healthTimeoutMs, 4_000, 500, 30_000, `Lavalink node ${id} healthTimeoutMs`);
  const healthStaleAfterMs = integerField(n.healthStaleAfterMs, Math.max(healthIntervalMs * 3, 45_000), healthIntervalMs * 2, 900_000, `Lavalink node ${id} healthStaleAfterMs`);
  const failureThreshold = integerField(n.failureThreshold, 3, 1, 20, `Lavalink node ${id} failureThreshold`);
  const recoveryThreshold = integerField(n.recoveryThreshold, 2, 1, 20, `Lavalink node ${id} recoveryThreshold`);

  const maxSystemLoadPercent = percentField(n.maxSystemLoadPercent, 85, `Lavalink node ${id} maxSystemLoadPercent`);
  const maxLavalinkLoadPercent = percentField(n.maxLavalinkLoadPercent, 85, `Lavalink node ${id} maxLavalinkLoadPercent`);
  const maxMemoryPercent = percentField(n.maxMemoryPercent, 90, `Lavalink node ${id} maxMemoryPercent`);
  const minFreeMemoryBytes = integerField(n.minFreeMemoryBytes, 256 * 1024 * 1024, 0, 1024 * 1024 * 1024 * 1024, `Lavalink node ${id} minFreeMemoryBytes`);
  const maxLatencyMs = integerField(n.maxLatencyMs, 1_500, 50, 30_000, `Lavalink node ${id} maxLatencyMs`);
  const connectGraceMs = integerField(n.connectGraceMs, 30_000, 0, 300_000, `Lavalink node ${id} connectGraceMs`);
  const selectionCooldownMs = integerField(n.selectionCooldownMs, 2_000, 0, 300_000, `Lavalink node ${id} selectionCooldownMs`);

  return Object.freeze({
    id,
    host,
    port,
    authorization,
    secure: boolValue(n.secure, false),
    priority,
    weight,
    role,
    region,
    resumeTimeoutMs,
    capacityPlayers,
    reservedCapacityPlayers,
    healthIntervalMs,
    healthTimeoutMs,
    healthStaleAfterMs,
    failureThreshold,
    recoveryThreshold,
    maxSystemLoadPercent,
    maxLavalinkLoadPercent,
    maxMemoryPercent,
    minFreeMemoryBytes,
    maxLatencyMs,
    connectGraceMs,
    selectionCooldownMs,
    enabled: boolValue(n.enabled, true),
    allowNewPlayers: boolValue(n.allowNewPlayers, true),
  });
}

function parseJsonNodes(raw: string): unknown[] {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("LAVALINK_NODES must be valid JSON"); }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > MAX_NODES) {
    throw new Error(`LAVALINK_NODES must contain between 1 and ${MAX_NODES} nodes`);
  }
  return parsed;
}

function assertTopology(nodes: readonly LavalinkNodeConfig[]): void {
  const ids = new Set<string>();
  const endpoints = new Set<string>();
  let admissionNodes = 0;
  for (const node of nodes) {
    if (ids.has(node.id)) throw new Error(`Duplicate Lavalink node id: ${node.id}`);
    ids.add(node.id);
    const endpoint = `${node.secure ? "https" : "http"}://${node.host}:${node.port}`;
    if (endpoints.has(endpoint)) throw new Error(`Duplicate Lavalink node endpoint: ${endpoint}`);
    endpoints.add(endpoint);
    if (node.enabled && node.allowNewPlayers) admissionNodes += 1;
  }
  if (!admissionNodes) throw new Error("LAVALINK_TOPOLOGY_HAS_NO_ADMISSION_NODE");
}

export function loadLavalinkNodes(): readonly LavalinkNodeConfig[] {
  const raw = process.env.LAVALINK_NODES?.trim();
  let nodes: readonly LavalinkNodeConfig[];
  if (raw) {
    nodes = parseJsonNodes(raw).map((value, index) => parseNode(index, value));
  } else {
    const configured = BOT_CONFIG.lavalink.nodes;
    nodes = configured.map((value, index) => parseNode(index, value));
  }
  const normalized = [...nodes].sort((a, b) => a.priority - b.priority || b.weight - a.weight || a.id.localeCompare(b.id));
  assertTopology(normalized);
  return Object.freeze(normalized);
}

export const lavalinkHealthConfig: LavalinkHealthConfig = Object.freeze({
  enabled: BOT_CONFIG.lavalink.health.enabled,
  intervalMs: BOT_CONFIG.lavalink.health.intervalMs,
  timeoutMs: BOT_CONFIG.lavalink.health.timeoutMs,
  staleAfterMs: BOT_CONFIG.lavalink.health.staleAfterMs,
  failureThreshold: BOT_CONFIG.lavalink.health.failureThreshold,
  recoveryThreshold: BOT_CONFIG.lavalink.health.recoveryThreshold,
  maxConcurrentProbes: BOT_CONFIG.lavalink.health.maxConcurrentProbes,
  jitterMs: BOT_CONFIG.lavalink.health.jitterMs,
});

export function lavalinkTopologySummary(nodes: readonly LavalinkNodeConfig[]): LavalinkTopologySummary {
  return Object.freeze({
    count: nodes.length,
    enabled: nodes.filter((node) => node.enabled).length,
    admissionEnabled: nodes.filter((node) => node.enabled && node.allowNewPlayers).length,
    totalCapacityPlayers: nodes.reduce((sum, node) => sum + node.capacityPlayers, 0),
    reservedCapacityPlayers: nodes.reduce((sum, node) => sum + node.reservedCapacityPlayers, 0),
    regions: Object.freeze([...new Set(nodes.map((node) => node.region).filter((value): value is string => Boolean(value)))].sort()),
    secureNodes: nodes.filter((node) => node.secure).length,
  });
}

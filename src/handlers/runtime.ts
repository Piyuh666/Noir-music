import type { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { claimComponent, isFresh, actionFailure, replyStale } from "./context";
import { errorEmbed } from "../embeds";
import type { UIInteraction } from "../router";

export type DedicatedInteraction = ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;
export type HandlerKind = "button" | "select" | "modal";
export type HandlerRisk = "read" | "write" | "critical";

export interface DedicatedHandlerContract {
  readonly id: string;
  readonly kind: HandlerKind;
  readonly domain: string;
  readonly mutating: boolean;
  readonly requiresGuild: boolean;
  readonly staleProtected: boolean;
  readonly risk: HandlerRisk;
  readonly timeoutMs: number;
  readonly cooldownMs: number;
  readonly maxConcurrent: number;
  readonly telemetryKey: string;
}

export interface HandlerExecution<T> {
  readonly interaction: T;
  readonly contract: DedicatedHandlerContract;
  readonly startedAt: number;
  readonly correlationId: string;
}

interface RuntimeMetric {
  started: number;
  completed: number;
  failed: number;
  rejected: number;
  timedOut: number;
  busy: number;
  totalMs: number;
  maxMs: number;
  lastStartedAt: number;
  lastCompletedAt: number;
  lastFailedAt: number;
}

const executions = new Map<string, number>();
const handlerCooldowns = new Map<string, number>();
const activeByHandler = new Map<string, number>();
const metrics = new Map<string, RuntimeMetric>();
const failureWindows = new Map<string, { startedAt: number; failures: number; openedAt: number }>();
const EXECUTION_TTL = 30_000;
const MAX_EXECUTIONS = 10_000;
const MAX_RUNTIME_KEYS = 5_000;
const DEFAULT_TIMEOUT = 15_000;
const MAX_CONTRACT_TIMEOUT = 60_000;
const MAX_CONTRACT_CONCURRENCY = 8;
const MAX_CONTRACT_COOLDOWN = 30_000;
const HANDLER_FAILURE_WINDOW_MS = 60_000;
const HANDLER_FAILURE_TRIP = 5;
const HANDLER_CIRCUIT_COOLDOWN_MS = 15_000;

function metricFor(id: string): RuntimeMetric {
  const existing = metrics.get(id);
  if (existing) return existing;
  const created: RuntimeMetric = { started: 0, completed: 0, failed: 0, rejected: 0, timedOut: 0, busy: 0, totalMs: 0, maxMs: 0, lastStartedAt: 0, lastCompletedAt: 0, lastFailedAt: 0 };
  metrics.set(id, created);
  if (metrics.size > MAX_RUNTIME_KEYS) metrics.delete(metrics.keys().next().value as string);
  return created;
}

function prune(now: number): void {
  for (const [key, expires] of executions) {
    if (expires <= now) executions.delete(key);
    if (executions.size < MAX_EXECUTIONS) break;
  }
  for (const [key, expires] of handlerCooldowns) {
    if (expires <= now) handlerCooldowns.delete(key);
    if (handlerCooldowns.size < MAX_RUNTIME_KEYS) break;
  }
}

function classifyRisk(mutating: boolean, domain: string): HandlerRisk {
  if (!mutating) return "read";
  if (/stop|volume|autoplay|effects|source|favorite|playback|queue/i.test(domain)) return "critical";
  return "write";
}

export function contract(id: string, kind: HandlerKind, domain: string, mutating = false): DedicatedHandlerContract {
  const risk = classifyRisk(mutating, domain);
  const timeoutMs = risk === "critical" ? 12_000 : kind === "modal" ? 10_000 : 15_000;
  const cooldownMs = risk === "critical" ? 350 : 150;
  return Object.freeze({
    id, kind, domain, mutating, requiresGuild: true, staleProtected: kind !== "modal",
    risk, timeoutMs, cooldownMs, maxConcurrent: 1, telemetryKey: `noir.handler.${domain}.${id}`,
  });
}

function activeCount(id: string): number { return activeByHandler.get(id) ?? 0; }
function incrementActive(id: string): void { activeByHandler.set(id, activeCount(id) + 1); }
function decrementActive(id: string): void { const next = Math.max(0, activeCount(id) - 1); if (next) activeByHandler.set(id, next); else activeByHandler.delete(id); }

function circuitFor(id: string, now: number) {
  const current = failureWindows.get(id);
  if (!current) return null;
  if (current.openedAt > 0 && now - current.openedAt >= HANDLER_CIRCUIT_COOLDOWN_MS) {
    failureWindows.delete(id);
    return null;
  }
  if (current.startedAt > 0 && now - current.startedAt > HANDLER_FAILURE_WINDOW_MS) {
    failureWindows.delete(id);
    return null;
  }
  return current;
}

function recordHandlerFailure(id: string, now: number): void {
  const current = circuitFor(id, now) ?? { startedAt: now, failures: 0, openedAt: 0 };
  if (now - current.startedAt > HANDLER_FAILURE_WINDOW_MS) { current.startedAt = now; current.failures = 0; current.openedAt = 0; }
  current.failures++;
  if (current.failures >= HANDLER_FAILURE_TRIP) current.openedAt = now;
  failureWindows.set(id, current);
}

export function beginHandler<T extends DedicatedInteraction>(interaction: T, c: DedicatedHandlerContract): HandlerExecution<T> | null {
  const now = Date.now();
  prune(now);
  const metric = metricFor(c.id);
  const correlationId = `ui-${interaction.id}-${now.toString(36)}`;
  const circuit = circuitFor(c.id, now);
  if (circuit?.openedAt) { metric.rejected++; metric.busy++; return null; }

  if (c.requiresGuild && !interaction.guildId) {
    metric.rejected++;
    void interaction.reply({ embeds: [errorEmbed("Guild context required", "This control is only available inside a Discord server.", "CMD_GUILD")], ephemeral: true });
    return null;
  }
  if (c.staleProtected && !isFresh(interaction as UIInteraction)) {
    metric.rejected++;
    if (interaction.isButton()) void replyStale(interaction, "Control expired", "Refresh the Noir Music panel and try again.");
    else void interaction.reply({ embeds: [errorEmbed("Control expired", "Refresh the Noir Music panel and try again.", "UI_410")], ephemeral: true });
    return null;
  }
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    if (!claimComponent(interaction as UIInteraction)) { metric.rejected++; return null; }
  }
  const cooldownKey = `${c.id}:${interaction.user.id}:${interaction.guildId ?? "dm"}`;
  const cooldownUntil = handlerCooldowns.get(cooldownKey) ?? 0;
  if (c.mutating && cooldownUntil > now) { metric.rejected++; return null; }
  if (activeCount(c.id) >= c.maxConcurrent) { metric.rejected++; metric.busy++; return null; }

  const executionKey = `${c.id}:${interaction.id}`;
  if (executions.has(executionKey)) { metric.rejected++; return null; }
  executions.set(executionKey, now + EXECUTION_TTL);
  if (c.mutating) handlerCooldowns.set(cooldownKey, now + c.cooldownMs);
  incrementActive(c.id);
  metric.started++;
  metric.lastStartedAt = now;
  return { interaction, contract: c, startedAt: now, correlationId };
}

export function finishHandler(execution: HandlerExecution<unknown>): number {
  const elapsed = Math.max(0, Date.now() - execution.startedAt);
  const id = execution.contract.id;
  const metric = metricFor(id);
  metric.completed++;
  metric.totalMs += elapsed;
  metric.maxMs = Math.max(metric.maxMs, elapsed);
  metric.lastCompletedAt = Date.now();
  decrementActive(id);
  executions.delete(`${id}:${(execution.interaction as DedicatedInteraction).id}`);
  return elapsed;
}

export function failHandler(interaction: DedicatedInteraction, error: unknown): Promise<void> {
  const id = (interaction as DedicatedInteraction).customId;
  const metric = metrics.get(id);
  if (metric) {
    metric.failed++;
    metric.lastFailedAt = Date.now();
    if (error instanceof Error && error.message === "UI_HANDLER_TIMEOUT") metric.timedOut++;
    recordHandlerFailure(id, Date.now());
  }
  const embed = actionFailure(error);
  if (interaction.replied || interaction.deferred) {
    return interaction.followUp({ embeds: [embed], ephemeral: true }).then(() => undefined).catch(() => undefined);
  }
  return interaction.reply({ embeds: [embed], ephemeral: true }).then(() => undefined).catch(() => undefined);
}

export function requireManageGuild(interaction: ButtonInteraction): boolean {
  const member = interaction.member;
  if (!member || !("permissions" in member)) return false;
  return Boolean(member.permissions.has("ManageGuild"));
}

export async function denyManageGuild(interaction: ButtonInteraction, message: string): Promise<void> {
  await interaction.reply({ embeds: [errorEmbed("Permission required", message, "PERM_003")], ephemeral: true });
}

export function handlerRuntimeSnapshot(): Readonly<Record<string, RuntimeMetric>> {
  return Object.freeze(Object.fromEntries([...metrics.entries()].map(([k, v]) => [k, Object.freeze({ ...v })])));
}

export function assertHandlerRuntimeIntegrity(contracts: readonly DedicatedHandlerContract[]): void {
  const ids = contracts.map(c => c.id);
  if (new Set(ids).size !== ids.length) throw new Error("UI_HANDLER_RUNTIME_DUPLICATE_CONTRACT");
  for (const c of contracts) {
    if (!c.id || !c.domain || c.timeoutMs < 1000 || c.timeoutMs > MAX_CONTRACT_TIMEOUT || c.maxConcurrent < 1 || c.maxConcurrent > MAX_CONTRACT_CONCURRENCY || c.cooldownMs < 0 || c.cooldownMs > MAX_CONTRACT_COOLDOWN || !c.telemetryKey.startsWith("noir.handler.")) {
      throw new Error(`UI_HANDLER_RUNTIME_INVALID:${c.id}`);
    }
    if (c.mutating && c.risk === "read") throw new Error(`UI_HANDLER_RUNTIME_RISK_MISMATCH:${c.id}`);
  }
}


export interface HandlerPolicy {
  readonly operation: "read" | "write" | "critical";
  readonly idempotent: boolean;
  readonly requiresMutationLease: boolean;
  readonly auditTag: string;
}

export interface HandlerOutcome {
  readonly ok: boolean;
  readonly correlationId: string;
  readonly elapsedMs: number;
  readonly handlerId: string;
}

const mutationLeases = new Map<string, number>();
const leaseTtlMs = 20_000;
const MAX_LEASES = 5_000;

function pruneLeases(now:number):void {
  for (const [key, expires] of mutationLeases) {
    if (expires <= now) mutationLeases.delete(key);
    if (mutationLeases.size < MAX_LEASES) break;
  }
}

export function handlerPolicy(c: DedicatedHandlerContract): HandlerPolicy {
  return Object.freeze({
    operation: c.risk,
    idempotent: !c.mutating,
    requiresMutationLease: c.mutating,
    auditTag: `${c.domain}:${c.id}`,
  });
}

function acquireMutationLease(execution: HandlerExecution<unknown>): boolean {
  if (!execution.contract.mutating) return true;
  const now = Date.now();
  pruneLeases(now);
  const guildId = (execution.interaction as DedicatedInteraction).guildId ?? "dm";
  const key = `${execution.contract.id}:${guildId}`;
  const existing = mutationLeases.get(key) ?? 0;
  if (existing > now) return false;
  mutationLeases.set(key, now + leaseTtlMs);
  return true;
}

function releaseMutationLease(execution: HandlerExecution<unknown>): void {
  if (!execution.contract.mutating) return;
  const guildId = (execution.interaction as DedicatedInteraction).guildId ?? "dm";
  mutationLeases.delete(`${execution.contract.id}:${guildId}`);
}

export async function executeDedicatedHandler<T extends DedicatedInteraction>(
  interaction: T,
  c: DedicatedHandlerContract,
  work: (execution: HandlerExecution<T>) => Promise<void>,
): Promise<HandlerOutcome | null> {
  const execution = beginHandler(interaction, c);
  if (!execution) return null;
  const started = execution.startedAt;
  let ok = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    if (!acquireMutationLease(execution)) {
      throw new Error("UI_HANDLER_BUSY");
    }
    const timeout = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error("UI_HANDLER_TIMEOUT")), c.timeoutMs);
    });
    await Promise.race([work(execution), timeout]);
    ok = true;
    return Object.freeze({ ok, correlationId: execution.correlationId, elapsedMs: Date.now() - started, handlerId: c.id });
  } catch (error) {
    await failHandler(interaction, error);
    return Object.freeze({ ok, correlationId: execution.correlationId, elapsedMs: Date.now() - started, handlerId: c.id });
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    releaseMutationLease(execution);
    finishHandler(execution);
  }
}

export function assertHandlerPolicyCompleteness(contracts: readonly DedicatedHandlerContract[]): void {
  for (const c of contracts) {
    const p = handlerPolicy(c);
    if (!p.auditTag || !p.operation) throw new Error(`UI_HANDLER_POLICY_INVALID:${c.id}`);
    if (c.mutating !== p.requiresMutationLease) throw new Error(`UI_HANDLER_POLICY_MUTATION_MISMATCH:${c.id}`);
  }
}

export function handlerCircuitSnapshot(): Readonly<Record<string, { failures: number; openedAt: number; open: boolean }>> {
  const now = Date.now();
  const out: Record<string, { failures: number; openedAt: number; open: boolean }> = {};
  for (const [id, state] of failureWindows) {
    const current = circuitFor(id, now);
    if (current) out[id] = Object.freeze({ failures: current.failures, openedAt: current.openedAt, open: current.openedAt > 0 });
  }
  return Object.freeze(out);
}

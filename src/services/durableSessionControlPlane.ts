/**
 * NOIR MUSIC — durable session control plane V62.
 *
 * This is the persistence/fencing boundary for self-healing sessions. It uses
 * the existing Prisma/Postgres connection rather than introducing another
 * infrastructure dependency. The table is intentionally small: one desired
 * snapshot per guild plus a lease used to fence competing bot instances.
 *
 * The control plane is best-effort when the database is unavailable: audio
 * playback must never fail merely because persistence is temporarily down.
 * Once the database returns, snapshots are written again by normal capture.
 */
import { randomUUID } from "node:crypto";
import { prisma } from "../database/prisma";
import { logger } from "../utils/logger";

export type DurableSessionRow = Readonly<{
  guildId: string;
  snapshot: unknown;
  version: number;
  updatedAt: number;
}>;

type Lease = Readonly<{ guildId: string; owner: string; version: number }>;

const TABLE = "noir_session_control_plane";
const DEFAULT_LEASE_MS = 45_000;

function json(value: unknown): string {
  return JSON.stringify(value, (_key, item) => typeof item === "bigint" ? Number(item) : item) ?? "null";
}

export class DurableSessionControlPlane {
  private readonly owner = `${process.pid}-${randomUUID()}`;
  private readyPromise?: Promise<boolean>;
  private ready = false;
  private readonly leases = new Map<string, Lease>();
  private writes = 0;
  private reads = 0;
  private leaseAcquires = 0;
  private leaseConflicts = 0;
  private failures = 0;
  private deletes = 0;
  private lastWriteAt = 0;
  private lastReadAt = 0;
  private lastFailureAt = 0;

  async start(): Promise<boolean> {
    if (!this.readyPromise) this.readyPromise = this.ensureTable();
    return this.readyPromise;
  }

  private async ensureTable(): Promise<boolean> {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
          guild_id TEXT PRIMARY KEY,
          snapshot JSONB NOT NULL,
          version BIGINT NOT NULL DEFAULT 1,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          lease_owner TEXT,
          lease_until TIMESTAMPTZ
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS noir_session_control_plane_lease_idx
        ON ${TABLE} (lease_until)
      `);
      this.ready = true;
      return true;
    } catch (error) {
      this.failures += 1;
      this.lastFailureAt = Date.now();
      this.ready = false;
      logger.warn({ err: error }, "Durable session control plane unavailable; continuing in memory");
      return false;
    }
  }

  private async available(): Promise<boolean> {
    if (this.ready) return true;
    return this.start();
  }

  async saveSnapshot(guildId: string, snapshot: unknown): Promise<void> {
    if (!(await this.available())) return;
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO ${TABLE} (guild_id, snapshot, version, updated_at)
         VALUES ($1, $2::jsonb, 1, NOW())
         ON CONFLICT (guild_id) DO UPDATE SET
           snapshot = EXCLUDED.snapshot,
           version = ${TABLE}.version + 1,
           updated_at = NOW()`,
        guildId,
        json(snapshot),
      );
      this.writes += 1;
      this.lastWriteAt = Date.now();
    } catch (error) {
      this.failures += 1;
      logger.debug({ err: error, guildId }, "Durable session snapshot write skipped");
    }
  }

  async loadSnapshots(): Promise<DurableSessionRow[]> {
    if (!(await this.available())) return [];
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ guild_id: string; snapshot: unknown; version: bigint | number; updated_at: Date }>>(
        `SELECT guild_id, snapshot, version, updated_at FROM ${TABLE}`,
      );
      this.reads += rows.length;
      this.lastReadAt = Date.now();
      return rows.map((row) => Object.freeze({
        guildId: row.guild_id,
        snapshot: row.snapshot,
        version: Number(row.version),
        updatedAt: row.updated_at.getTime(),
      }));
    } catch (error) {
      this.failures += 1;
      logger.debug({ err: error }, "Durable session snapshot load skipped");
      return [];
    }
  }

  async deleteSnapshot(guildId: string): Promise<void> {
    if (!(await this.available())) return;
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM ${TABLE} WHERE guild_id = $1`, guildId);
      this.deletes += 1;
    } catch (error) {
      this.failures += 1;
      this.lastFailureAt = Date.now();
      logger.debug({ err: error, guildId }, "Durable session snapshot delete skipped");
    }
  }

  async acquireLease(guildId: string, ttlMs = DEFAULT_LEASE_MS): Promise<boolean> {
    if (!(await this.available())) return true;
    const owner = this.owner;
    const ttl = Math.max(5_000, Math.trunc(ttlMs));
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ version: bigint | number }>>(
        `UPDATE ${TABLE}
         SET lease_owner = $2,
             lease_until = NOW() + ($3 * INTERVAL '1 millisecond'),
             version = version + 1,
             updated_at = NOW()
         WHERE guild_id = $1
           AND (lease_until IS NULL OR lease_until < NOW() OR lease_owner = $2)
         RETURNING version`,
        guildId,
        owner,
        ttl,
      );
      if (!rows.length) {
        this.leaseConflicts += 1;
        return false;
      }
      const version = Number(rows[0].version);
      this.leases.set(guildId, Object.freeze({ guildId, owner, version }));
      this.leaseAcquires += 1;
      return true;
    } catch (error) {
      this.failures += 1;
      this.lastFailureAt = Date.now();
      logger.debug({ err: error, guildId }, "Durable session lease unavailable; allowing local recovery");
      return true;
    }
  }

  async releaseLease(guildId: string): Promise<void> {
    const lease = this.leases.get(guildId);
    this.leases.delete(guildId);
    if (!lease || !this.ready) return;
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE ${TABLE} SET lease_owner = NULL, lease_until = NULL WHERE guild_id = $1 AND lease_owner = $2`,
        guildId,
        lease.owner,
      );
    } catch (error) {
      this.failures += 1;
      logger.debug({ err: error, guildId }, "Durable session lease release skipped");
    }
  }

  async stop(): Promise<void> {
    const guildIds = [...this.leases.keys()];
    for (const guildId of guildIds) await this.releaseLease(guildId);
    this.ready = false;
    this.readyPromise = undefined;
  }

  health() {
    return Object.freeze({
      ready: this.ready,
      owner: this.owner,
      leases: this.leases.size,
      writes: this.writes,
      reads: this.reads,
      leaseAcquires: this.leaseAcquires,
      leaseConflicts: this.leaseConflicts,
      failures: this.failures,
      deletes: this.deletes,
      lastWriteAt: this.lastWriteAt,
      lastReadAt: this.lastReadAt,
      lastFailureAt: this.lastFailureAt,
    });
  }
}

export const durableSessionControlPlane = new DurableSessionControlPlane();



export type ControlPlaneVisualState = Readonly<{
  availability: 'READY' | 'DEGRADED' | 'OFFLINE';
  leasePressure: 'LOW' | 'MEDIUM' | 'HIGH';
  persistencePressure: 'LOW' | 'MEDIUM' | 'HIGH';
  activeLeases: number;
  failures: number;
  writeHealth: 'STABLE' | 'DEGRADED' | 'CRITICAL';
  leaseHealth: 'STABLE' | 'PRESSURED' | 'CRITICAL';
}>;

export function controlPlaneVisualState(health: ReturnType<DurableSessionControlPlane['health']>): ControlPlaneVisualState {
  const leasePressure = health.leaseConflicts >= 10 ? 'HIGH' : health.leaseConflicts > 0 ? 'MEDIUM' : 'LOW';
  const persistencePressure = health.failures >= 10 ? 'HIGH' : health.failures > 0 ? 'MEDIUM' : 'LOW';
  const availability = !health.ready ? 'OFFLINE' : health.failures >= 10 ? 'DEGRADED' : 'READY';
  const writeHealth = health.failures >= 10 ? 'CRITICAL' : health.failures > 0 ? 'DEGRADED' : 'STABLE';
  const leaseHealth = health.leaseConflicts >= 10 ? 'CRITICAL' : health.leaseConflicts > 0 ? 'PRESSURED' : 'STABLE';
  return Object.freeze({ availability, leasePressure, persistencePressure, activeLeases: health.leases, failures: health.failures, writeHealth, leaseHealth });
}

/**
 * Fair keyed async mutex.
 *
 * Each key has an independent FIFO queue. Work for unrelated keys runs in
 * parallel, while work sharing a key is strictly serialized. Rejected tasks
 * never poison the queue, and idle keys are removed to avoid unbounded memory
 * retention in long-lived Discord processes.
 */
type Waiter = {
  run: () => void;
  cancelled: boolean;
};

type Lane = {
  locked: boolean;
  waiters: Waiter[];
};

const MAX_WAITERS_PER_KEY = 2_000;

export class KeyedMutex {
  private readonly lanes = new Map<string, Lane>();

  async runExclusive<T>(key: string, task: () => Promise<T>): Promise<T> {
    const normalized = this.normalizeKey(key);
    const lane = this.lanes.get(normalized) ?? { locked: false, waiters: [] };
    this.lanes.set(normalized, lane);

    if (lane.locked) {
      if (lane.waiters.length >= MAX_WAITERS_PER_KEY) throw new Error("MUTEX_QUEUE_FULL");
      await new Promise<void>((resolve) => lane.waiters.push({ run: resolve, cancelled: false }));
    }
    lane.locked = true;

    try {
      return await task();
    } finally {
      const next = lane.waiters.shift();
      if (next) {
        next.cancelled = true;
        next.run();
      } else {
        lane.locked = false;
        if (lane.waiters.length === 0) this.lanes.delete(normalized);
      }
    }
  }

  pending(key: string): number {
    return this.lanes.get(this.normalizeKey(key))?.waiters.length ?? 0;
  }

  locked(key: string): boolean {
    return this.lanes.get(this.normalizeKey(key))?.locked ?? false;
  }

  size(): number {
    return this.lanes.size;
  }

  clear(): void {
    this.lanes.clear();
  }

  private normalizeKey(key: string): string {
    const value = String(key ?? "").trim();
    if (!value) throw new TypeError("Mutex key must be a non-empty string");
    if (value.length > 256) throw new RangeError("Mutex key exceeds 256 characters");
    if (/[\u0000-\u001F\u007F]/.test(value)) throw new TypeError("Mutex key contains control characters");
    return value;
  }
}

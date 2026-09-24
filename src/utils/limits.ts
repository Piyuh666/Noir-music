/** Small, dependency-free validation helpers shared by runtime boundaries. */
export function boundedInt(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

export function boundedString(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  return normalized ? normalized.slice(0, max) : fallback;
}

export function strictBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.trim().toLowerCase() === "true") return true;
    if (value.trim().toLowerCase() === "false") return false;
  }
  return fallback;
}

export function discordSnowflake(value: unknown, field = "id"): string {
  const id = String(value ?? "").trim();
  if (!/^[0-9]{5,32}$/.test(id)) throw new TypeError(`Invalid Discord ${field}`);
  return id;
}

export function safeErrorMessage(value: unknown, fallback = "Unknown error", max = 500): string {
  if (value instanceof Error) return value.message.replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, max) || fallback;
  if (typeof value === "string") return value.replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, max) || fallback;
  return fallback;
}

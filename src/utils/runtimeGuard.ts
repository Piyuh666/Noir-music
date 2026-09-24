/**
 * Noir Music runtime safety primitives.
 * These helpers are deliberately infrastructure-only: bounded timers, bounded
 * external reads, safe error normalization, and strict identifier validation.
 */
import { logger } from "./logger";

export class RuntimeTimeoutError extends Error {
  constructor(message = "Runtime operation timed out") {
    super(message);
    this.name = "RuntimeTimeoutError";
  }
}

export function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : "Unknown runtime failure");
}

export async function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  onTimeout?: () => void,
): Promise<T> {
  const limit = Math.max(1, Math.min(120_000, Math.trunc(timeoutMs)));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      if (settled) return;
      try { onTimeout?.(); } catch (error) { logger.warn({ err: normalizeError(error) }, "Runtime timeout callback failed"); }
      reject(new RuntimeTimeoutError(`Operation exceeded ${limit}ms.`));
    }, limit);
    (timer as unknown as { unref?: () => void }).unref?.();
  });
  try {
    return await Promise.race([task, timeout]);
  } finally {
    settled = true;
    if (timer) clearTimeout(timer);
  }
}


export async function fetchTextBounded(
  input: string | URL,
  init: RequestInit = {},
  options: { timeoutMs?: number; maxBytes?: number; allowedHostSuffixes?: readonly string[] } = {},
): Promise<string> {
  const parsedUrl = new URL(String(input));
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") throw new TypeError("UNSUPPORTED_URL_PROTOCOL");
  if (options.allowedHostSuffixes?.length) {
    const host = parsedUrl.hostname.toLowerCase();
    const allowed = options.allowedHostSuffixes.some((suffix) => {
      const normalized = suffix.toLowerCase().replace(/^\.+/, "");
      return host === normalized || host.endsWith(`.${normalized}`);
    });
    if (!allowed) throw new Error("REMOTE_HOST_NOT_ALLOWED");
  }
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxBytes = Math.max(1, Math.min(8 * 1024 * 1024, Math.trunc(options.maxBytes ?? 1 * 1024 * 1024)));
  const controller = new AbortController();
  const upstreamSignal = init.signal;
  let abortListener: (() => void) | undefined;
  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort(upstreamSignal.reason);
    else {
      abortListener = () => controller.abort(upstreamSignal.reason);
      upstreamSignal.addEventListener("abort", abortListener, { once: true });
    }
  }
  try {
    const response = await withTimeout(fetch(input, { ...init, signal: controller.signal }), timeoutMs, () => controller.abort());
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (Number.isFinite(declared) && declared > maxBytes) throw new Error("RESPONSE_TOO_LARGE");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > maxBytes) throw new Error("RESPONSE_TOO_LARGE");
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } finally {
    if (abortListener) upstreamSignal?.removeEventListener("abort", abortListener);
  }
}

export async function fetchJsonBounded<T>(
  input: string | URL,
  init: RequestInit,
  options: { timeoutMs?: number; maxBytes?: number; allowedHostSuffixes?: readonly string[] } = {},
): Promise<T> {
  const text = await fetchTextBounded(input, init, options);
  try { return JSON.parse(text) as T; }
  catch { throw new Error("INVALID_JSON_RESPONSE"); }
}

export function assertStringField(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== "string") throw new TypeError(`${name}_INVALID`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength || /[\u0000-\u001F\u007F]/.test(normalized)) throw new TypeError(`${name}_INVALID`);
  return normalized;
}

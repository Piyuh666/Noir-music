const url = process.env.NOIR_HEALTH_URL ?? "http://127.0.0.1:9091/health/ready";
const timeoutMs = Number(process.env.NOIR_HEALTH_TIMEOUT_MS ?? 3000);
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);
try {
  const response = await fetch(url, { signal: controller.signal });
  const body = await response.text();
  if (!response.ok) {
    console.error(`NOIR MUSIC HEALTH CHECK FAILED ${response.status}: ${body.slice(0, 1000)}`);
    process.exit(1);
  }
  console.log(`NOIR MUSIC HEALTH CHECK PASSED: ${body}`);
} catch (error) {
  console.error(`NOIR MUSIC HEALTH CHECK FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
} finally {
  clearTimeout(timer);
}

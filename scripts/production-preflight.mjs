import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
const lockJson = JSON.parse(readFileSync(resolve("package-lock.json"), "utf8"));
const failures = [];
if (!/^1\.0\.0$/.test(packageJson.version)) failures.push(`package version must be 1.0.0, found ${packageJson.version}`);
if (process.env.NODE_ENV === "production") {
  const lockPackages = lockJson.packages ?? {};
  for (const dependency of Object.keys(packageJson.dependencies ?? {})) {
    if (!lockPackages[`node_modules/${dependency}`]) failures.push(`package-lock.json is missing locked dependency: ${dependency}`);
  }
  for (const dependency of Object.keys(packageJson.devDependencies ?? {})) {
    if (!lockPackages[`node_modules/${dependency}`]) failures.push(`package-lock.json is missing locked devDependency: ${dependency}`);
  }
  if (process.env.ALLOW_DEBUG_ENDPOINTS === "true") failures.push("ALLOW_DEBUG_ENDPOINTS must not be true in production");
  if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN.includes("SAMPLE_")) failures.push("DISCORD_TOKEN is missing or sample-valued");
  if (!process.env.DATABASE_PRIMARY_URL || process.env.DATABASE_PRIMARY_URL.includes("SAMPLE_")) failures.push("DATABASE_PRIMARY_URL is missing or sample-valued");
  if (!process.env.LAVALINK_NODES && !process.env.LAVALINK_1_HOST) failures.push("at least one Lavalink node must be configured");
}
if (failures.length) {
  console.error("NOIR MUSIC PRODUCTION PREFLIGHT FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("NOIR MUSIC PRODUCTION PREFLIGHT PASSED");

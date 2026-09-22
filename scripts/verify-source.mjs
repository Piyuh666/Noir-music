import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, dirname, resolve } from "node:path";

const root = resolve(".");
const src = resolve("src");
const failures = [];
const tsFiles = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (extname(name) === ".ts") tsFiles.push(path);
  }
}
walk(src);

for (const file of tsFiles) {
  const text = readFileSync(file, "utf8");
  const relative = file.slice(root.length + 1).replaceAll("\\", "/");

  if (/NOIR.*FORTRESS|INDEX FORTRESS/i.test(text)) failures.push(`${relative}: stale generated fortress contract remains`);
  if (/sourceSha256BeforeSeal|sourceSha512BeforeSeal/i.test(text)) failures.push(`${relative}: stale source hash seal remains`);

  const exported = [];
  for (const match of text.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|export\s+(?:const|let|var|class|interface|type)\s+([A-Za-z_$][\w$]*)/g)) {
    exported.push(match[1] ?? match[2]);
  }
  const duplicates = [...new Set(exported.filter((name, i) => exported.indexOf(name) !== i))];
  for (const name of duplicates) failures.push(`${relative}: duplicate exported declaration ${name}`);

  for (const match of text.matchAll(/import(?:[^;]*?from\s*)?["'](\.[^"']+)["']/g)) {
    const spec = match[1];
    const base = resolve(dirname(file), spec);
    const exists = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")].some((candidate) => {
      try { return statSync(candidate).isFile(); } catch { return false; }
    });
    if (!exists) failures.push(`${relative}: missing relative import ${spec}`);
  }
}

const forbidden = [];
function walkAll(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walkAll(path);
    else if (/\.txt$/i.test(name)) forbidden.push(path.slice(root.length + 1));
  }
}
walkAll(root);
for (const file of forbidden) failures.push(`${file}: .txt files are forbidden in Noir Music source tree`);

const actions = readFileSync(resolve("src/ui/actions.ts"), "utf8");
const handlers = readFileSync(resolve("src/ui/handlers/index.ts"), "utf8");
const actionIds = [...actions.matchAll(/^\s*[A-Z][A-Z0-9_]+:\s*"([^"]+)"/gm)].map((m) => m[1]);
const handlerIds = [...handlers.matchAll(/\[UIAction\.([A-Z0-9_]+)\]:/g)].map((m) => m[1]);
if (actionIds.length !== new Set(actionIds).size) failures.push("src/ui/actions.ts: duplicate canonical action id");
if (actionIds.length !== handlerIds.length) failures.push(`UI action/handler count mismatch: ${actionIds.length}/${handlerIds.length}`);

// Provider searches must have one authoritative gateway. Direct player.search
// calls outside GuildSession would bypass explicit-content policy, source policy,
// and future provider/node routing.
for (const file of tsFiles) {
  const relative = file.slice(root.length + 1).replaceAll("\\", "/");
  if (relative === "src/audio/session.ts") continue;
  const text = readFileSync(file, "utf8");
  if (/\bplayer\.search\s*\(/.test(text)) failures.push(`${relative}: direct player.search bypasses GuildSession.search`);
}

// Command manifests are executable accounting contracts. Keep the global total
// and top-level budget explicit so category wiring cannot silently drift.
const commandIndexes = tsFiles.filter((file) => /src[\\/]commands[\\/][^\\/]+[\\/]index\.ts$/.test(file));
let expectedCommandsTotal = 0;
let expectedTopLevelTotal = 0;
for (const file of commandIndexes) {
  const text = readFileSync(file, "utf8");
  const commandsMatch = text.match(/expectedCommands:\s*(\d+)/);
  const topMatch = text.match(/expectedTopLevelEntries:\s*(\d+)/);
  if (!commandsMatch || !topMatch) {
    failures.push(`${file.slice(root.length + 1).replaceAll("\\", "/")}: missing command manifest counts`);
    continue;
  }
  expectedCommandsTotal += Number(commandsMatch[1]);
  expectedTopLevelTotal += Number(topMatch[1]);
}
if (expectedCommandsTotal !== 355) failures.push(`Command manifest total drift: expected 355, found ${expectedCommandsTotal}`);
if (expectedTopLevelTotal !== 55) failures.push(`Discord top-level command budget drift: expected 55, found ${expectedTopLevelTotal}`);

const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
  if (name === "verify" || name === "typecheck" || name === "build" || name === "dev" || name === "start" || name === "test") continue;
  if (/scripts\//.test(command)) {
    const referenced = command.match(/scripts\/[A-Za-z0-9_.-]+/g) ?? [];
    for (const path of referenced) if (!statSync(resolve(path), { throwIfNoEntry: false })) failures.push(`package.json: ${name} references missing ${path}`);
  }
}

if (failures.length) {
  console.error("NOIR MUSIC SOURCE VERIFICATION FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`NOIR MUSIC SOURCE VERIFICATION PASSED · ${tsFiles.length} TypeScript files · ${actionIds.length} UI actions`);

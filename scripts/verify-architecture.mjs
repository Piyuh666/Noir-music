import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(".");
const ui = resolve("src/ui");
const forbiddenGenerationFiles = /(?:19|21|22|V3|V4)\.ts$/i;
const forbiddenGenerationImports = /(?:experience19|experience21|responsive21|glyphInterfaceV3|glyphInterfaceV4|glyph21|uxSystem|uxShell19|uxComposer|uxComposition|uxJourney21|uxBlueprint|a11y22|accessibility21|commandSurface19|commandUx21|operatorSurface19|playerSurface19|queueSurface19|uiOrchestrator22|uiRegistry22|visualEffects22)/;
const failures = [];

for (const file of readdirSync(ui, { withFileTypes: true })) {
  if (file.isFile() && forbiddenGenerationFiles.test(file.name)) failures.push(`legacy generation file remains: ${file.name}`);
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith(".ts")) {
      const text = readFileSync(path, "utf8");
      if (forbiddenGenerationImports.test(text)) failures.push(`legacy generation reference: ${path.slice(root.length + 1)}`);
    }
  }
}

walk(ui);
for (const required of ["package-lock.json", "vitest.config.ts", ".github/workflows/ci.yml", ".github/workflows/migration-deploy.yml", ".github/workflows/chaos.yml"]) {
  if (!existsSync(resolve(required))) failures.push(`missing engineering control: ${required}`);
}

if (failures.length) {
  console.error("NOIR MUSIC ARCHITECTURE VERIFICATION FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("NOIR MUSIC ARCHITECTURE VERIFICATION PASSED · canonical UI generations + engineering controls sealed");

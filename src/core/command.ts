import type { UiCommand, UiViewport, UiCoreSurface } from "./contracts";
import { frame } from "./glyph";
import { fitText, splitColumns } from "./responsive";

export function commandSurface(commands: readonly UiCommand[], viewport: UiViewport, query = ""): UiCoreSurface {
  const q = query.trim().toLowerCase();
  const filtered = (q ? commands.filter((c) => `${c.name} ${c.category} ${c.description}`.toLowerCase().includes(q)) : commands).slice(0, 16);
  const lines = filtered.map((c) => `${c.enabled ? "●" : "×"} /${fitText(c.name, 20)} · ${fitText(c.category, 12)} · ${fitText(c.description, Math.max(18, viewport.width - 38))}`);
  const body = [...splitColumns(lines, viewport)];
  body.push(`QUERY ${q || "ALL"} · MATCHES ${filtered.length}/${commands.length}`);
  return Object.freeze({ surface: "COMMAND", lines: frame("COMMAND MATRIX", body, viewport.width, "OPERATOR"), rows: body.length + 4, priority: 60 });
}

/** NOIR MUSIC // GLYPH-V45 COMMAND EXPERIENCE */
import { uiText } from "./surface";
import { pixelFrame, metricWall, glyphState, type VisualState } from "./visualGlyphs";
import { actionRail, type UXAction } from "./uxState";

export interface CommandExperience { name: string; category: string; description: string; example?: string; aliases?: readonly string[]; state?: VisualState; metrics?: readonly { label: string; value: string | number; ratio?: number; state?: VisualState }[]; actions?: readonly UXAction[]; }

export function commandHero(command: CommandExperience, width = 56): string {
  const state = command.state ?? "READY"; const lines = [
    `${glyphState(state)} /${uiText(command.name, "command", width - 10)}`,
    `▣ ${uiText(command.category, "MUSIC", width - 8).toUpperCase()}`,
    uiText(command.description, "No description", width - 4),
  ];
  if (command.example) lines.push(`⌁ ${uiText(command.example, "", width - 8)}`);
  if (command.aliases?.length) lines.push(`◇ ${command.aliases.slice(0, 8).map((a) => `/${uiText(a, "", 30)}`).join("  ")}`);
  return pixelFrame(lines, width, state === "ERROR" ? "ALERT" : "PANEL", "HEAVY");
}

export function commandDashboard(command: CommandExperience, width = 60): string {
  const blocks = [commandHero(command, width)];
  if (command.metrics?.length) blocks.push(pixelFrame([metricWall(command.metrics, width - 4)], width, "DENSE", "REGULAR"));
  if (command.actions?.length) blocks.push(actionRail(command.actions, width > 62 ? 64 : 56));
  return blocks.join("\n");
}

export function commandAccessibility(command: CommandExperience): string {
  const aliases = command.aliases?.length ? ` Aliases: ${command.aliases.join(", ")}.` : "";
  return `Command ${uiText(command.name, "unknown", 80)} in ${uiText(command.category, "music", 60)}. ${uiText(command.description, "No description", 180)}.${command.example ? ` Example: ${uiText(command.example, "", 180)}.` : ""}${aliases}`;
}

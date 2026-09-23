/** NOIR MUSIC // GLYPH-19 UX SHELL — a reusable presentation shell around existing surfaces. */
import { composeExperience, experienceActionLine, experienceFooter, experienceHeader, type ExperienceAction, type ExperienceDensity, type ExperiencePhase, type ExperienceSection } from "./experience";
import { kernelFrame } from "./visualKernel";
import { fitDescription } from "./surface";

export interface Shell19 {
  title: string;
  phase: ExperiencePhase;
  density?: ExperienceDensity;
  sections?: readonly ExperienceSection[];
  actions?: readonly ExperienceAction[];
  content?: string;
  footer?: string;
}

export function shellChrome(shell: Shell19): string {
  const density = shell.density ?? "STANDARD";
  return experienceHeader(shell.title, shell.phase, density, "NOIR MUSIC // GLYPH-19");
}

export function shellContent(shell: Shell19): string {
  return fitDescription(shell.content ?? "");
}

export function shellActionRail(actions: readonly ExperienceAction[], width = 56): string {
  return kernelFrame(actions.map((action) => experienceActionLine(action, width)), { width, tone: "PANEL", weight: "REGULAR" });
}

export function shellFooter(shell: Shell19, width = 56): string {
  return experienceFooter(shell.phase, shell.footer ?? "GLYPH-19 // SURFACE", width);
}

export function shellCompose(shell: Shell19): string {
  if (shell.sections?.length) return composeExperience({ ...shell, sections: shell.sections });
  return [shellChrome(shell), shell.content ? shellContent(shell) : "", shell.actions?.length ? shellActionRail(shell.actions) : "", shellFooter(shell)].filter(Boolean).join("\n");
}

export function shellAnnounce(shell: Shell19): string {
  const actionCount = shell.actions?.length ?? 0;
  return `${shell.title}. ${shell.phase}. ${actionCount} actions available.`;
}

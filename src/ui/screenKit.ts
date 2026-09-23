/** NOIR MUSIC // GLYPH-17 SCREEN KIT — complete screen-level UX contracts. */
import { cinematicFrame, cinematicMeter, cinematicStack, CinematicDensity, CinematicTone } from "./cinematic";
import { focusRail, FocusItem } from "./focusModel";
import { pixelHeader, pixelSpark, pixelTelemetry } from "./pixel";
import { uiPage } from "./surface";

export interface ScreenSection { title: string; lines: string[]; tone?: CinematicTone; }
export interface ScreenKitInput { title: string; subtitle?: string; sections: ScreenSection[]; actions?: FocusItem[]; density?: CinematicDensity; page?: number; pageSize?: number; }

export function screenKit(input: ScreenKitInput): string {
  const density = input.density ?? "STANDARD";
  const sections = input.sections.slice(0, 12).map((section) => cinematicFrame({
    title: section.title,
    body: section.lines,
    tone: section.tone ?? "MONO",
    density,
  }));
  const actions = input.actions?.length ? `\n${pixelHeader("ACTIONS")}\n${focusRail(input.actions)}` : "";
  const subtitle = input.subtitle ? `\n${input.subtitle}` : "";
  return `${pixelHeader(input.title)}${subtitle}\n${sections.join("\n")}\n${actions}`.trim();
}

export function playerScreen(title: string, artist: string, position: number, duration: number, queueLength: number, actions: FocusItem[]): string {
  const percent = duration > 0 ? position / duration : 0;
  return screenKit({
    title: "NOW PLAYING",
    subtitle: `${title} // ${artist}`,
    density: "DENSE",
    sections: [
      { title: "PLAYBACK", lines: [cinematicMeter(percent, 32), pixelTelemetry([{ label: "POSITION", value: position, max: Math.max(1, duration) }, { label: "QUEUE", value: queueLength, max: 100 }])] },
      { title: "SIGNAL", lines: [pixelSpark([0.2, 0.45, 0.72, 0.54, 0.88, 0.62, 0.76, percent])] },
    ],
    actions,
  });
}

export function queueScreen(items: string[], page: number, pageSize: number): string {
  const view = uiPage(items, page, pageSize);
  return screenKit({
    title: "QUEUE MATRIX",
    subtitle: `${view.start + 1}-${view.end} / ${view.total} // PAGE ${view.page}/${view.pages}`,
    density: "DENSE",
    sections: [{ title: "TRACK RAIL", lines: [cinematicStack(view.items.map((item, i) => `${view.start + i + 1}. ${item}`), 54)] }],
  });
}

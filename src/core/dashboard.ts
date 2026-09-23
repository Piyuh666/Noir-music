import type { UiCoreInput, UiCoreSurface, UiViewport } from './contracts';
import { bar, frame } from './glyph';

export function dashboardSurface(input: UiCoreInput, viewport: UiViewport): UiCoreSurface {
  const activeEffects = input.effects.filter((effect) => effect.enabled).length;
  const commandReady = input.commands.filter((command) => command.enabled).length;
  const progress = input.player.durationMs > 0 ? input.player.positionMs / input.player.durationMs : 0;
  const rows = [
    `PLAYBACK   ${input.player.state} · ${Math.round(progress * 100)}% ${bar(progress, Math.max(8, viewport.width - 30))}`,
    `QUEUE      ${input.queue.length}/${input.player.queueSize} VISIBLE`,
    `COMMANDS   ${commandReady}/${input.commands.length} READY`,
    `EFFECTS    ${activeEffects}/${input.effects.length} ACTIVE`,
    `ACTIONS    ${input.actions.filter((action) => action.enabled).length}/${input.actions.length} AVAILABLE`,
    `SIGNAL     ◆ LIVE · ${input.player.state} · ${input.player.title.slice(0, Math.max(8, viewport.width - 28))}`,
  ];
  return Object.freeze({ surface: 'TELEMETRY', lines: frame('NOIR CONTROL MATRIX', rows, viewport.width, 'OPERATOR'), rows: rows.length + 4, priority: 90 });
}

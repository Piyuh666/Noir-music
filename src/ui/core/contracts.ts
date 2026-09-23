/**
 * NOIR MUSIC // ULTRA UI CORE CONTRACTS
 * Pure runtime contracts shared by all canonical surfaces.
 */
export type UiState = "IDLE" | "READY" | "ACTIVE" | "BUSY" | "SUCCESS" | "WARNING" | "ERROR" | "STALE" | "EMPTY" | "LOCKED";
export type UiDensity = "MINI" | "COMPACT" | "STANDARD" | "DENSE" | "OPERATOR";
export type UiTone = "VOID" | "PANEL" | "DENSE" | "SIGNAL" | "ALERT" | "OPERATOR";
export type UiSurface = "PLAYER" | "QUEUE" | "COMMAND" | "EFFECTS" | "NAVIGATION" | "TELEMETRY" | "ACCESSIBILITY";

export interface UiViewport { readonly width: number; readonly maxRows: number; readonly density: UiDensity; readonly columns: number; }
export interface UiTrack { readonly id: string; readonly title: string; readonly artist: string; readonly durationMs: number; readonly index: number; readonly active: boolean; }
export interface UiAction { readonly id: string; readonly label: string; readonly enabled: boolean; readonly destructive?: boolean; readonly reason?: string; }
export interface UiCommand { readonly name: string; readonly category: string; readonly description: string; readonly usage: string; readonly enabled: boolean; }
export interface UiMetric { readonly label: string; readonly value: string; readonly ratio?: number; readonly state?: UiState; }
export interface UiPlayerState { readonly title: string; readonly artist: string; readonly source: string; readonly requester: string; readonly positionMs: number; readonly durationMs: number; readonly volume: number; readonly queueSize: number; readonly state: UiState; readonly paused: boolean; readonly loop: string; readonly shuffle: boolean; readonly autoplay: boolean; }

export interface UiCoreInput {
  readonly width: number;
  readonly design?: import('./design').UiDesign;
  readonly state: UiState;
  readonly player: UiPlayerState;
  readonly queue: readonly UiTrack[];
  readonly commands: readonly UiCommand[];
  readonly actions: readonly UiAction[];
  readonly effects: readonly { readonly id: string; readonly label: string; readonly enabled: boolean; readonly value?: number }[];
}

export interface UiCoreSurface { readonly surface: UiSurface; readonly lines: readonly string[]; readonly rows: number; readonly priority: number; }
export interface UiCoreResult { readonly viewport: UiViewport; readonly surfaces: readonly UiCoreSurface[]; readonly lines: readonly string[]; readonly diagnostics: readonly string[]; }

import type { UiAction, UiPlayerState } from "./contracts";

export interface ActionPolicy { readonly canControl: boolean; readonly canManageQueue: boolean; readonly canUseEffects: boolean; }

export function resolveActions(player: UiPlayerState, policy: ActionPolicy): readonly UiAction[] {
  const locked = (id: string, label: string, reason: string): UiAction => ({ id, label, enabled: false, reason });
  return Object.freeze([
    { id: "previous", label: "PREVIOUS", enabled: player.queueSize > 0 && policy.canControl },
    { id: "playpause", label: player.paused || player.state !== "ACTIVE" ? "PLAY" : "PAUSE", enabled: policy.canControl },
    { id: "skip", label: "SKIP", enabled: player.queueSize > 0 && policy.canControl },
    { id: "queue", label: "QUEUE", enabled: policy.canManageQueue },
    policy.canUseEffects ? { id: "effects", label: "EFFECTS", enabled: true } : locked("effects", "EFFECTS", "PERMISSION REQUIRED"),
    { id: "stop", label: "STOP", enabled: policy.canControl, destructive: true, reason: policy.canControl ? undefined : "PERMISSION REQUIRED" },
  ]);
}

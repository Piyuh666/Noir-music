/**
 * NOIR MUSIC — Canonical UI Core
 *
 * This is the only public runtime UI barrel. Older Glyph/UX generations remain
 * available by direct legacy imports where migration is still required, but
 * they are deliberately not part of the canonical runtime surface.
 */
export * from "./actions";
export * from "./actionRegistry";
export * from "./router";
export * from "./state";
export * from "./validation";
export * from "./player";
export * from "./queue";
export * from "./help";
export * from "./renderer";
export * from "./errors";
export * from "./runtimeWiring";
export * from "./components";
export * from "./handlers";
export * from "./embeds";
export * from "./glyphInterface";

import { NOIR_UI_VERSION } from "./uiVersion";
export const CANONICAL_UI_VERSION = NOIR_UI_VERSION;
export const CANONICAL_UI_ARCHITECTURE = Object.freeze({
  version: CANONICAL_UI_VERSION,
  direction: "Discord → UI Router → Application/Domain → State → Renderer",
  actionSourceOfTruth: "./actions",
  handlerSourceOfTruth: "./router",
  stateSourceOfTruth: "live-domain-state",
  legacyGenerationPolicy: "direct-import-only",
  failClosed: true,
});

export * from "./glyphRuntime";

export * from "./ultraWiring";
export * from "./core";

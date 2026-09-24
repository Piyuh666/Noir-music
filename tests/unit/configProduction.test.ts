import { describe, expect, it } from "vitest";
import { BOT_CONFIG, validateProductionConfig } from "../../src/config/botConfig";

describe("production configuration", () => {
  it("accepts the repository's deliberately fake configuration outside production", () => {
    const result = validateProductionConfig();
    if (BOT_CONFIG.app.environment.toLowerCase() === "production") {
      expect(result.valid).toBe(false);
    } else {
      expect(result.valid).toBe(true);
    }
    expect(result.environment).toBe(BOT_CONFIG.app.environment.toLowerCase());
  });

  it("contains multiple configured Lavalink nodes", () => {
    expect(BOT_CONFIG.lavalink.nodes.length).toBeGreaterThanOrEqual(3);
  });
});

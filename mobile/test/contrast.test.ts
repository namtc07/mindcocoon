import { describe, expect, it } from "vitest";
import { contrast, readableFill } from "../src/theme/contrast";
import { MIDNIGHT, tokens } from "../src/theme/tokens";

describe("text on mood colours", () => {
  it("measures contrast like WCAG", () => {
    expect(contrast("#ffffff", "#000000")).toBeCloseTo(21, 0);
  });

  it("keeps the mood colour itself when it already reads well", () => {
    expect(readableFill(tokens.dusk.mood.heavy).background).toBe(tokens.dusk.mood.heavy);
  });

  it.each([
    ["dusk", tokens.dusk],
    ["mist", tokens.mist],
    ["midnight", MIDNIGHT],
  ] as const)("every selected feeling tile is readable in %s (≥ 4.5:1)", (_, palette) => {
    for (const color of Object.values(palette.mood)) {
      const { background, ink } = readableFill(color);
      expect(contrast(ink, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

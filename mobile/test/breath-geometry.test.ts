import { breathAt, BREATH_PHASES } from "@mindcocoon/core/breathing";
import { describe, expect, it } from "vitest";
import { breathAtWorklet, dotPosition, innerScale, PAD, SIZE } from "../src/lib/breath-geometry";

describe("box-breathing geometry", () => {
  it("the dot climbs the left side on inhale", () => {
    expect(SIZE).toBe(220);
    expect(PAD).toBe(20);
    expect(dotPosition("inhale", 0)).toEqual({ x: 20, y: 200 });
    expect(dotPosition("inhale", 1)).toEqual({ x: 20, y: 20 });
    expect(dotPosition("hold-in", 0.5)).toEqual({ x: 110, y: 20 });
    expect(dotPosition("exhale", 1)).toEqual({ x: 200, y: 200 });
    expect(dotPosition("hold-out", 1)).toEqual({ x: 20, y: 200 });
  });

  it("innerScale grows on inhale and shrinks on exhale", () => {
    expect(innerScale("inhale", 0)).toBeCloseTo(0.6);
    expect(innerScale("inhale", 1)).toBeCloseTo(1);
    expect(innerScale("hold-in", 0.3)).toBe(1);
    expect(innerScale("exhale", 0)).toBeCloseTo(1);
    expect(innerScale("exhale", 1)).toBeCloseTo(0.6);
    expect(innerScale("hold-out", 0.3)).toBe(0.6);
  });

  it("breathAtWorklet agrees with core breathAt", () => {
    for (const ms of [0, 3_999, 4_000, 37_500, 63_999]) {
      const core = breathAt(ms);
      const w = breathAtWorklet(ms);
      expect(BREATH_PHASES[w.phaseIndex]).toBe(core.phase);
      expect(w.progress).toBeCloseTo(core.progress);
    }
  });
});

import { describe, expect, it } from "vitest";
import { BREATH_PATTERNS, CYCLES, PHASE_MS, TOTAL_MS, breathAt, breathAtPattern, cyclesFor, totalMsFor } from "@mindcocoon/core/breathing";

describe("breathAt", () => {
  it("starts with a 4-second inhale", () => {
    expect(breathAt(0)).toMatchObject({ phase: "inhale", secondsLeft: 4, cycle: 1, done: false });
  });

  it("moves through hold, exhale and hold", () => {
    expect(breathAt(4_000).phase).toBe("hold-in");
    expect(breathAt(8_000).phase).toBe("exhale");
    expect(breathAt(15_999)).toMatchObject({ phase: "hold-out", secondsLeft: 1 });
  });

  it("reports progress within a phase", () => {
    expect(breathAt(2_000).progress).toBeCloseTo(0.5);
  });

  it("counts cycles and finishes after four", () => {
    expect(breathAt(16_000).cycle).toBe(2);
    expect(breathAt(CYCLES * 4 * PHASE_MS - 1).done).toBe(false);
    expect(breathAt(64_000).done).toBe(true);
  });
});

describe("breathing patterns", () => {
  it("4-7-8 phases fall on 4 s, 11 s and 19 s", () => {
    const p = BREATH_PATTERNS.relax;
    expect(breathAtPattern(p, 2, 0)).toMatchObject({ phase: "inhale", secondsLeft: 4, phaseMs: 4_000 });
    expect(breathAtPattern(p, 2, 4_000)).toMatchObject({ phase: "hold-in", secondsLeft: 7, phaseMs: 7_000 });
    expect(breathAtPattern(p, 2, 10_999)).toMatchObject({ phase: "hold-in", secondsLeft: 1 });
    expect(breathAtPattern(p, 2, 11_000)).toMatchObject({ phase: "exhale", secondsLeft: 8, phaseMs: 8_000 });
    expect(breathAtPattern(p, 2, 19_000)).toMatchObject({ phase: "inhale", cycle: 2 });
    expect(breathAtPattern(p, 2, 15_000).progress).toBeCloseTo(0.5);
    expect(breathAtPattern(p, 2, 38_000).done).toBe(true);
  });

  it("calm has no holds", () => {
    const p = BREATH_PATTERNS.calm;
    expect(p.phases.map((x) => x.phase)).toEqual(["inhale", "exhale"]);
    expect(breathAtPattern(p, 1, 4_000)).toMatchObject({ phase: "exhale", secondsLeft: 6 });
    expect(totalMsFor(p, 3)).toBe(30_000);
  });

  it("cyclesFor rounds to whole cycles and never below 1", () => {
    expect(cyclesFor(BREATH_PATTERNS.box, 1)).toBe(4);
    expect(cyclesFor(BREATH_PATTERNS.relax, 3)).toBe(9);
    expect(cyclesFor(BREATH_PATTERNS.calm, 5)).toBe(30);
    expect(cyclesFor(BREATH_PATTERNS.relax, 0)).toBe(1);
  });

  it("breathAt still matches the old box timing", () => {
    for (const ms of [0, 3_999, 4_000, 37_500, 63_999, 64_000]) {
      const { phaseMs: _ignored, ...rest } = breathAtPattern(BREATH_PATTERNS.box, 4, ms);
      expect(rest).toEqual(breathAt(ms));
    }
    expect(TOTAL_MS).toBe(64_000);
  });
});

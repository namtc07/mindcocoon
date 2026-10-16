import { describe, expect, it } from "vitest";
import { CYCLES, PHASE_MS, breathAt } from "@/lib/breathing";

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

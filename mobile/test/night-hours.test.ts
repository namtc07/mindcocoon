import { describe, expect, it } from "vitest";
import { isNightHour } from "../src/theme/night-hours";

describe("night hours", () => {
  it("flips at 22:00 and 06:00", () => {
    expect(isNightHour(new Date(2026, 9, 19, 21, 59))).toBe(false);
    expect(isNightHour(new Date(2026, 9, 19, 22, 0))).toBe(true);
    expect(isNightHour(new Date(2026, 9, 20, 3, 0))).toBe(true);
    expect(isNightHour(new Date(2026, 9, 20, 5, 59))).toBe(true);
    expect(isNightHour(new Date(2026, 9, 20, 6, 0))).toBe(false);
  });
});

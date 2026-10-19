import { describe, expect, it } from "vitest";
import { occasionFor } from "@mindcocoon/core/occasions";

const d = (y: number, m: number, day: number, h = 21) => new Date(y, m - 1, day, h);

describe("occasions", () => {
  it("Tết, a few days either side of the Lunar New Year", () => {
    expect(occasionFor(d(2026, 2, 17))).toBe("tet");
    expect(occasionFor(d(2026, 2, 14))).toBe("tet");
    expect(occasionFor(d(2026, 2, 21))).toBe("tet");
    expect(occasionFor(d(2026, 2, 25))).not.toBe("tet");
    expect(occasionFor(d(2027, 2, 6))).toBe("tet");
  });

  it("Mid-autumn around the full moon of the eighth lunar month", () => {
    expect(occasionFor(d(2026, 9, 25))).toBe("mid-autumn");
    expect(occasionFor(d(2027, 9, 15))).toBe("mid-autumn");
  });

  it("Christmas week and New Year's Eve", () => {
    expect(occasionFor(d(2026, 12, 24))).toBe("christmas");
    expect(occasionFor(d(2026, 12, 31))).toBe("new-year");
    expect(occasionFor(d(2027, 1, 1))).toBe("new-year");
  });

  it("a full-moon night every month or so; ordinary nights have none", () => {
    expect(occasionFor(d(2026, 11, 24))).toBe("full-moon");
    expect(occasionFor(d(2026, 11, 10))).toBeNull();
  });
});

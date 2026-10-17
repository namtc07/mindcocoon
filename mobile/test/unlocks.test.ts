import { describe, expect, it } from "vitest";
import { DAY_MS, isUnlockedIn, unlockedUntilIn, withUnlock } from "../src/lib/unlocks-core";

describe("rewarded unlocks", () => {
  it("unlock lasts 24 hours", () => {
    const now = 1_000_000;
    const record = withUnlock({}, "thunder", now);
    expect(record).toEqual({ thunder: now + DAY_MS });
    expect(DAY_MS).toBe(24 * 60 * 60 * 1000);
    expect(isUnlockedIn(record, "thunder", now + DAY_MS - 1)).toBe(true);
    expect(isUnlockedIn(record, "thunder", now + DAY_MS)).toBe(false);
    expect(unlockedUntilIn(record, "thunder", now)).toBe(now + DAY_MS);
    expect(unlockedUntilIn(record, "stream", now)).toBeNull();
  });

  it("expired unlocks are pruned", () => {
    const now = 10 * DAY_MS;
    const record = withUnlock({ thunder: now - 1, stream: now + 5 }, "deep-hum", now);
    expect(record).toEqual({ stream: now + 5, "deep-hum": now + DAY_MS });
  });

  it("watching again extends from now", () => {
    const now = 5 * DAY_MS;
    expect(withUnlock({ thunder: now + 100 }, "thunder", now)).toEqual({ thunder: now + DAY_MS });
  });
});

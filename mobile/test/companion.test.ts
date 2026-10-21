import { describe, expect, it } from "vitest";
import type { MoodLog } from "@mindcocoon/core/types";
import { eveningDays } from "../src/lib/companion-core";
import type { SleepNight } from "../src/lib/sleep-log-core";

const log = (iso: string): MoodLog => ({ id: iso, mood: "heavy", tags: [], createdAt: iso });
const night = (day: string, windDown = true): SleepNight => ({ night: day, windDown });

describe("eveningDays", () => {
  it("an evening counts once whether it had a check-in, a wind-down, or both", () => {
    const days = eveningDays(
      [log("2026-10-20T21:00:00.000Z"), log("2026-10-19T21:00:00.000Z"), log("2026-10-20T22:30:00.000Z")],
      [night("2026-10-20"), night("2026-10-18", false)],
    );
    expect(days).toEqual(["2026-10-18", "2026-10-19", "2026-10-20"]);
  });

  it("is empty when the person has never shown up", () => {
    expect(eveningDays([], [])).toEqual([]);
  });
});

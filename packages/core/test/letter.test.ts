import { describe, expect, it } from "vitest";
import { letterWeek, weeklyLetter } from "@mindcocoon/core/mood/letter";
import type { MoodLog, MoodType } from "@mindcocoon/core/types";

// Sunday 18 October 2026, 19:00.
const SUNDAY = new Date(2026, 9, 18, 19, 0);
let n = 0;
function log(mood: MoodType, daysAgo: number, feelings?: string[]): MoodLog {
  const d = new Date(SUNDAY);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(21, 0, 0, 0);
  return { id: String(n++), mood, tags: [], feelings, createdAt: d.toISOString() };
}

describe("Kén's weekly letter", () => {
  it("a quiet week gets a quiet letter", () => {
    expect(weeklyLetter([log("heavy", 1)], SUNDAY).lines).toEqual([{ kind: "quiet" }]);
  });

  it("notices showing up, and the overall feel of the week", () => {
    const logs = [6, 5, 4, 3, 2, 1].map((d) => log("heavy", d));
    const { lines } = weeklyLetter(logs, SUNDAY);
    expect(lines).toContainEqual({ kind: "showed-up", amount: "most" });
    expect(lines).toContainEqual({ kind: "mostly", family: "low" });
  });

  it("sees a lighter weekend", () => {
    // Mon–Thu heavy, Sat–Sun peaceful.
    const logs = [log("heavy", 6), log("anxious", 5), log("heavy", 4), log("alone", 3), log("peaceful", 1), log("joyful", 0)];
    expect(weeklyLetter(logs, SUNDAY).lines).toContainEqual({ kind: "lighter-on", when: "weekend" });
  });

  it("names a feeling word that came back", () => {
    const logs = [log("heavy", 3, ["tired"]), log("heavy", 2, ["tired"]), log("numb", 1)];
    expect(weeklyLetter(logs, SUNDAY).lines).toContainEqual({ kind: "word", word: "tired" });
  });

  it("only looks at the last seven days", () => {
    const old = [10, 9, 8].map((d) => log("heavy", d));
    expect(weeklyLetter(old, SUNDAY).lines).toEqual([{ kind: "quiet" }]);
  });

  it("notices when sleep came easier after winding down", () => {
    const logs = [3, 2, 1].map((d) => log("heavy", d));
    const night = (day: string, windDown: boolean, quality: "good" | "okay" | "rough") => ({ night: day, windDown, quality });
    const sleep = [
      night("2026-10-12", true, "good"),
      night("2026-10-13", true, "good"),
      night("2026-10-14", true, "good"),
      night("2026-10-15", false, "rough"),
      night("2026-10-16", false, "okay"),
      night("2026-10-17", false, "rough"),
    ];
    expect(weeklyLetter(logs, SUNDAY, sleep).lines).toContainEqual({ kind: "slept-better" });
    // No clear difference, no line: the letter never invents a pattern.
    const flat = sleep.map((s) => ({ ...s, quality: "okay" as const }));
    expect(weeklyLetter(logs, SUNDAY, flat).lines).not.toContainEqual({ kind: "slept-better" });
    // Too few nights either way, no line.
    expect(weeklyLetter(logs, SUNDAY, sleep.slice(0, 4)).lines).not.toContainEqual({ kind: "slept-better" });
  });

  it("notices a weekday that has been lighter", () => {
    // Wednesdays (daysAgo 4 and 11) peaceful; the other days around them heavy.
    const logs = [
      log("heavy", 6), log("heavy", 5), log("peaceful", 4), log("heavy", 3), log("heavy", 2),
      log("heavy", 13), log("heavy", 12), log("peaceful", 11), log("heavy", 10), log("heavy", 9),
    ];
    expect(weeklyLetter(logs, SUNDAY).lines).toContainEqual({ kind: "lighter-weekday", weekday: 3 });
  });

  it("a rich week reads richer than a sparse one (patterns appear, capped at five lines)", () => {
    const logs = [
      log("heavy", 6), log("heavy", 5), log("peaceful", 4), log("heavy", 3), log("heavy", 2),
      log("heavy", 13), log("heavy", 12), log("peaceful", 11), log("heavy", 10), log("heavy", 9),
    ];
    const { lines } = weeklyLetter(logs, SUNDAY);
    expect(lines.length).toBeGreaterThan(2);
    expect(lines.length).toBeLessThanOrEqual(5);
  });

  it("a day speaks with its latest moment, however many moments it held", () => {
    const at = (daysAgo: number, hour: number, mood: MoodType): MoodLog => {
      const d = new Date(SUNDAY);
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, 0, 0, 0);
      return { id: `m-${daysAgo}-${hour}`, mood, tags: [], createdAt: d.toISOString() };
    };
    // One heavy day told three times; two days with a single peaceful moment each.
    // Counted per moment the week would read "mostly low" (3 of 5); per day it is light (2 of 3).
    const logs = [at(3, 9, "heavy"), at(3, 12, "heavy"), at(3, 21, "heavy"), at(2, 21, "peaceful"), at(1, 21, "peaceful")];
    expect(weeklyLetter(logs, SUNDAY).lines).toContainEqual({ kind: "mostly", family: "light" });
    // And when the day's LAST moment turns heavy, the day counts as heavy.
    const turned = [at(3, 9, "peaceful"), at(3, 21, "heavy"), at(2, 21, "heavy"), at(1, 21, "heavy")];
    expect(weeklyLetter(turned, SUNDAY).lines).toContainEqual({ kind: "mostly", family: "low" });
  });

  it("the letter belongs to its Sunday: from Sunday 18:00 through Monday", () => {
    expect(letterWeek(new Date(2026, 9, 18, 17, 59))).toBeNull();
    expect(letterWeek(new Date(2026, 9, 18, 18, 0))).toBe("2026-10-18");
    expect(letterWeek(new Date(2026, 9, 19, 23, 0))).toBe("2026-10-18");
    expect(letterWeek(new Date(2026, 9, 20, 9, 0))).toBeNull();
  });
});

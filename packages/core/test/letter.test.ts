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

  it("the letter belongs to its Sunday: from Sunday 18:00 through Monday", () => {
    expect(letterWeek(new Date(2026, 9, 18, 17, 59))).toBeNull();
    expect(letterWeek(new Date(2026, 9, 18, 18, 0))).toBe("2026-10-18");
    expect(letterWeek(new Date(2026, 9, 19, 23, 0))).toBe("2026-10-18");
    expect(letterWeek(new Date(2026, 9, 20, 9, 0))).toBeNull();
  });
});

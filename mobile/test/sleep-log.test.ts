import { describe, expect, it } from "vitest";
import { nightOf, questionFor, sleepInsight, withNight, withQuality, type SleepNight } from "../src/lib/sleep-log-core";

describe("sleep log", () => {
  it("an evening and the small hours after it are the same night", () => {
    expect(nightOf(new Date(2026, 9, 19, 23, 0))).toBe("2026-10-19");
    expect(nightOf(new Date(2026, 9, 20, 2, 0))).toBe("2026-10-19");
    expect(nightOf(new Date(2026, 9, 20, 14, 0))).toBeNull();
  });

  it("asks in the morning only about a night that used wind-down or the sleep timer, once", () => {
    let log: SleepNight[] = [];
    expect(questionFor(log, new Date(2026, 9, 20, 8, 0))).toBeNull();
    log = withNight(log, new Date(2026, 9, 19, 23, 0), true);
    expect(questionFor(log, new Date(2026, 9, 20, 8, 0))).toBe("2026-10-19");
    expect(questionFor(log, new Date(2026, 9, 20, 15, 0))).toBeNull();
    log = withQuality(log, "2026-10-19", "good");
    expect(questionFor(log, new Date(2026, 9, 20, 8, 0))).toBeNull();
  });

  it("a wind-down mark is never downgraded by a later sleep-timer mark the same night", () => {
    let log = withNight([], new Date(2026, 9, 19, 23, 0), true);
    log = withNight(log, new Date(2026, 9, 19, 23, 30), false);
    expect(log).toEqual([{ night: "2026-10-19", windDown: true }]);
  });

  it("only says wind-down helps when it clearly does, with enough nights", () => {
    const n = (i: number, windDown: boolean, quality: SleepNight["quality"]): SleepNight => ({ night: `2026-10-${String(i).padStart(2, "0")}`, windDown, quality });
    const better = [n(1, true, "good"), n(2, true, "good"), n(3, true, "okay"), n(4, false, "rough"), n(5, false, "okay"), n(6, false, "rough")];
    expect(sleepInsight(better)).toBe("wind-down-helps");
    expect(sleepInsight(better.slice(0, 4))).toBeNull();
    const same = [n(1, true, "good"), n(2, true, "rough"), n(3, true, "okay"), n(4, false, "good"), n(5, false, "rough"), n(6, false, "okay")];
    expect(sleepInsight(same)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { companionState, eveningsThisWeek, overnightReveal, weekRhythm } from "@mindcocoon/core/companion";

// Wednesday 21 October 2026, 21:00. Its week starts Monday 19 October.
const NOW = new Date(2026, 9, 21, 21, 0);
const days = (n: number, from = 21) => Array.from({ length: n }, (_, i) => `2026-10-${String(from - i).padStart(2, "0")}`);

describe("companion state", () => {
  it("grows in quiet stages as evenings add up, and only ever grows", () => {
    expect(companionState([], NOW)).toEqual({ stage: 0, ornament: null, totalEvenings: 0 });
    expect(companionState(days(1), NOW).stage).toBe(1);
    expect(companionState(days(2), NOW).stage).toBe(1);
    expect(companionState(days(3), NOW).stage).toBe(2);
    expect(companionState(days(7), NOW).stage).toBe(3);
    expect(companionState(days(14, 28), NOW).stage).toBe(3); // September days are not <= today... see below
    expect(companionState([...days(14), "2026-09-30", "2026-09-29"], NOW).stage).toBe(4);
  });

  it("wears a sprout early and a star when fully grown; duplicates and future days do not count", () => {
    expect(companionState(days(1), NOW).ornament).toBe("sprout");
    expect(companionState(days(3), NOW).ornament).toBe("sprout");
    const many = [...days(14), "2026-09-30", "2026-09-29", "2026-10-21", "2026-12-25"];
    const state = companionState(many, NOW);
    expect(state.totalEvenings).toBe(16);
    expect(state.ornament).toBe("star");
  });

  it("an overnight change waits only when an evening passed since the last visit, or the stage grew", () => {
    const evenings = ["2026-10-19", "2026-10-20"];
    const state = companionState(evenings, NOW);
    // Visited yesterday morning; last night's evening happened after that visit.
    expect(overnightReveal({ on: "2026-10-20", stage: state.stage }, state, evenings, NOW)).toBe(true);
    // Already here today: nothing new to reveal.
    expect(overnightReveal({ on: "2026-10-21", stage: state.stage }, state, evenings, NOW)).toBe(false);
    // Away for days with no evenings in between and no growth: nothing changed overnight.
    expect(overnightReveal({ on: "2026-10-18", stage: state.stage }, state, ["2026-10-19"], new Date(2026, 9, 19, 9, 0))).toBe(false);
    // First ever visit sets the baseline; it is not a reveal.
    expect(overnightReveal(null, state, evenings, NOW)).toBe(false);
    // Growth alone (stage advanced since last seen) is a change worth revealing.
    const grown = companionState(days(7), NOW);
    expect(overnightReveal({ on: "2026-10-20", stage: 1 }, grown, days(7), NOW)).toBe(true);
  });
});

describe("forgiving weekly rhythm", () => {
  it("counts this week's evenings (Monday first) without counting last week", () => {
    const evenings = ["2026-10-18", "2026-10-19", "2026-10-21", "2026-10-21"];
    expect(eveningsThisWeek(evenings, NOW)).toEqual(["2026-10-19", "2026-10-21"]);
  });

  it("a missed day never takes anything away: the total only grows, even across a week boundary", () => {
    const before = weekRhythm(["2026-10-18"], new Date(2026, 9, 18, 21, 0)); // Sunday
    expect(before).toEqual({ week: ["2026-10-18"], totalEvenings: 1 });
    const monday = weekRhythm(["2026-10-18"], new Date(2026, 9, 19, 9, 0));
    expect(monday.week).toEqual([]); // a fresh week canvas…
    expect(monday.totalEvenings).toBe(1); // …but nothing was lost.
    const later = weekRhythm(["2026-10-18", "2026-10-21"], NOW);
    expect(later.totalEvenings).toBe(2);
  });
});

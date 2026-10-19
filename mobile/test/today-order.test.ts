import { describe, expect, it } from "vitest";
import { todayOrder } from "../src/lib/today-order";

describe("todayOrder", () => {
  it("keeps the usual order without intents", () => {
    expect(todayOrder(true, [])).toEqual(["checkin", "worry", "entries", "prompt"]);
    expect(todayOrder(false, [])).toEqual(["worry", "prompt", "checkin", "entries"]);
  });

  it("puts wind-down first at night for people who came for sleep", () => {
    expect(todayOrder(true, ["sleep"])).toEqual(["entries", "checkin", "worry", "prompt"]);
    expect(todayOrder(false, ["sleep"])).toEqual(["worry", "prompt", "checkin", "entries"]);
  });

  it("puts the check-in before the prompt by day for people who came for their feelings", () => {
    expect(todayOrder(false, ["feelings"])).toEqual(["worry", "checkin", "prompt", "entries"]);
  });
});

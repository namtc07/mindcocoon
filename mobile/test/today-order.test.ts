import { describe, expect, it } from "vitest";
import { todayOrder } from "../src/lib/today-order";

describe("todayOrder", () => {
  it("keeps the usual order without intents", () => {
    expect(todayOrder(true, [])).toEqual(["checkin", "worry", "entries", "prompt"]);
    expect(todayOrder(false, [])).toEqual(["worry", "checkin", "prompt", "entries"]);
  });

  it("puts wind-down first at night for people who came for sleep", () => {
    expect(todayOrder(true, ["sleep"])).toEqual(["entries", "checkin", "worry", "prompt"]);
    expect(todayOrder(false, ["sleep"])).toEqual(["worry", "checkin", "prompt", "entries"]);
  });

  it("puts the check-in first by day for people who came for their feelings", () => {
    expect(todayOrder(false, ["feelings"])).toEqual(["checkin", "worry", "prompt", "entries"]);
  });
});

describe("todayOrder — every intent counts", () => {
  it("brings the worry line to the top for people who came for their worries", () => {
    expect(todayOrder(true, ["worries"])).toEqual(["worry", "checkin", "entries", "prompt"]);
    expect(todayOrder(true, ["sleep", "worries"])).toEqual(["worry", "entries", "checkin", "prompt"]);
  });

  it("brings the writing prompt forward for people who came to write", () => {
    expect(todayOrder(false, ["write"])).toEqual(["prompt", "worry", "checkin", "entries"]);
    expect(todayOrder(true, ["write"])).toEqual(["checkin", "worry", "prompt", "entries"]);
  });
});

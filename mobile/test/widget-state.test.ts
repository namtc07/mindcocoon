import { describe, expect, it } from "vitest";
import { companionState } from "@mindcocoon/core/companion";
import { buildTonightWidgetState } from "../src/lib/widget-state-core";

describe("tonight widget state", () => {
  it("is a small JSON contract: companion stage, ornament and tonight's prompt in the person's language", () => {
    const state = companionState(["2026-10-19", "2026-10-20", "2026-10-21"], new Date(2026, 9, 21, 21, 0));
    const widget = buildTonightWidgetState(state, "Tối nay làm gì thì bạn thấy được nghỉ thật sự?", "2026-10-21");
    expect(widget).toEqual({
      version: 1,
      stage: 2,
      ornament: "sprout",
      prompt: "Tối nay làm gì thì bạn thấy được nghỉ thật sự?",
      updatedOn: "2026-10-21",
    });
    expect(JSON.parse(JSON.stringify(widget))).toEqual(widget);
  });
});

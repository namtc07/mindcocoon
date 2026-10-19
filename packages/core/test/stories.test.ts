import { describe, expect, it } from "vitest";
import { getStory, STORIES } from "@mindcocoon/core/stories";

describe("sleep stories", () => {
  it("every story exists in both languages with the same ids and paragraph count", () => {
    expect(STORIES.vi.map((s) => s.id)).toEqual(STORIES.en.map((s) => s.id));
    for (const story of STORIES.en) {
      const vi = getStory("vi", story.id)!;
      expect(vi.paragraphs.length, story.id).toBe(story.paragraphs.length);
      expect(story.paragraphs.every((p) => p.length > 40 && p.length < 400)).toBe(true);
    }
  });

  it("unknown ids give null", () => {
    expect(getStory("en", "nope")).toBeNull();
  });
});

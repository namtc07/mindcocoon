import { describe, expect, it } from "vitest";
import { LOCALES } from "@mindcocoon/core/i18n/config";
import { getStory, STORIES } from "@mindcocoon/core/stories";

describe("sleep stories", () => {
  it.each(LOCALES)("every story exists in %s with the same ids and paragraph count", (locale) => {
    expect(STORIES[locale].map((s) => s.id)).toEqual(STORIES.en.map((s) => s.id));
    for (const story of STORIES.en) {
      const translated = getStory(locale, story.id)!;
      expect(translated.minutes, story.id).toBe(story.minutes);
      expect(translated.paragraphs.length, story.id).toBe(story.paragraphs.length);
      expect(translated.paragraphs.every((p) => p.length > 40 && p.length < 400), story.id).toBe(true);
    }
  });

  it("unknown ids give null", () => {
    expect(getStory("en", "nope")).toBeNull();
  });
});

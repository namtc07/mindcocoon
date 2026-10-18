import { describe, expect, it } from "vitest";
import { REFLECTION_PROMPTS, promptForDay } from "@mindcocoon/core/prompts";

describe("reflection prompts", () => {
  it("exist in both languages with the same count", () => {
    expect(REFLECTION_PROMPTS.vi.length).toBe(REFLECTION_PROMPTS.en.length);
    expect(REFLECTION_PROMPTS.en.length).toBeGreaterThanOrEqual(35);
  });

  it("stay the same all day", () => {
    const morning = new Date(2026, 9, 16, 7, 0);
    const night = new Date(2026, 9, 16, 23, 59);
    expect(promptForDay(morning, "en")).toBe(promptForDay(night, "en"));
  });

  it("match across languages for the same day", () => {
    const day = new Date(2026, 9, 16);
    const index = REFLECTION_PROMPTS.en.indexOf(promptForDay(day, "en"));
    expect(REFLECTION_PROMPTS.vi[index]).toBe(promptForDay(day, "vi"));
  });

  it("change with the offset", () => {
    const day = new Date(2026, 9, 16);
    expect(promptForDay(day, "en", 1)).not.toBe(promptForDay(day, "en"));
  });
});

describe("promptAt", () => {
  it("wraps and matches the lists", async () => {
    const { PROMPT_COUNT, promptAt, REFLECTION_PROMPTS } = await import("@mindcocoon/core/prompts");
    expect(PROMPT_COUNT).toBe(REFLECTION_PROMPTS.en.length);
    expect(PROMPT_COUNT).toBe(REFLECTION_PROMPTS.vi.length);
    expect(promptAt("en", 0)).toBe(REFLECTION_PROMPTS.en[0]);
    expect(promptAt("vi", 3)).toBe(REFLECTION_PROMPTS.vi[3]);
    expect(promptAt("en", PROMPT_COUNT + 2)).toBe(REFLECTION_PROMPTS.en[2]);
    expect(promptAt("en", -1)).toBe(REFLECTION_PROMPTS.en[PROMPT_COUNT - 1]);
  });
});

import { describe, expect, it } from "vitest";
import { LOCALES } from "@mindcocoon/core/i18n/config";
import { REFLECTION_PROMPTS, promptForDay } from "@mindcocoon/core/prompts";

describe("reflection prompts", () => {
  it.each(LOCALES)("exist in %s with the same count, none empty", (locale) => {
    expect(REFLECTION_PROMPTS[locale].length).toBe(REFLECTION_PROMPTS.en.length);
    for (const p of REFLECTION_PROMPTS[locale]) expect(p.trim()).not.toBe("");
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
    for (const locale of LOCALES) expect(REFLECTION_PROMPTS[locale][index]).toBe(promptForDay(day, locale));
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
    for (const locale of LOCALES) expect(PROMPT_COUNT).toBe(REFLECTION_PROMPTS[locale].length);
    expect(promptAt("en", 0)).toBe(REFLECTION_PROMPTS.en[0]);
    expect(promptAt("vi", 3)).toBe(REFLECTION_PROMPTS.vi[3]);
    expect(promptAt("en", PROMPT_COUNT + 2)).toBe(REFLECTION_PROMPTS.en[2]);
    expect(promptAt("en", -1)).toBe(REFLECTION_PROMPTS.en[PROMPT_COUNT - 1]);
  });
});

describe("prompt themes", () => {
  it("every prompt has a theme", async () => {
    const { PROMPT_COUNT, PROMPT_THEME_OF, PROMPT_THEMES } = await import("@mindcocoon/core/prompts");
    expect(PROMPT_THEME_OF).toHaveLength(PROMPT_COUNT);
    for (const theme of PROMPT_THEME_OF) expect(PROMPT_THEMES).toContain(theme);
    for (const theme of PROMPT_THEMES) expect(PROMPT_THEME_OF).toContain(theme);
  });
});

describe("isEveningMode", () => {
  it("is evening from 18:00 until 04:59", async () => {
    const { isEveningMode } = await import("@mindcocoon/core/dates");
    expect(isEveningMode(new Date(2026, 9, 19, 17, 59))).toBe(false);
    expect(isEveningMode(new Date(2026, 9, 19, 18, 0))).toBe(true);
    expect(isEveningMode(new Date(2026, 9, 20, 4, 59))).toBe(true);
    expect(isEveningMode(new Date(2026, 9, 20, 5, 0))).toBe(false);
  });
});

describe("prompt voice", () => {
  it("every prompt is short and plain, like something a friend would ask", () => {
    for (const p of REFLECTION_PROMPTS.en) expect(p.length, p).toBeLessThanOrEqual(70);
    for (const p of REFLECTION_PROMPTS.vi) expect(p.length, p).toBeLessThanOrEqual(80);
    for (const p of REFLECTION_PROMPTS.id) expect(p.length, p).toBeLessThanOrEqual(80);
  });

  it("no quoted words, no lofty therapy phrasing", () => {
    const lofty = [/'/, /trông như thế nào/, /tiếc thương/, /vốn không phải/, /biết nói/, /không mời/, /ngày bé/, /muốn nói với bạn/];
    for (const p of REFLECTION_PROMPTS.vi) for (const re of lofty) expect(p, p).not.toMatch(re);
    for (const p of REFLECTION_PROMPTS.en) expect(p, p).not.toMatch(/'enough'|younger self|uninvited|want you to know/);
  });
});


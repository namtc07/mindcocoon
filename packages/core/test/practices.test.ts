import { describe, expect, it } from "vitest";
import { LOCALES } from "@mindcocoon/core/i18n/config";
import { getPractice, getPractices } from "@mindcocoon/core/practices";

describe("practices", () => {
  it.each(LOCALES)("every practice has the same steps in en and %s", (locale) => {
    const en = getPractices("en");
    const other = getPractices(locale);
    expect(other.map((p) => p.id)).toEqual(en.map((p) => p.id));
    en.forEach((p, i) => {
      expect(other[i].minutes).toBe(p.minutes);
      expect(other[i].steps.map((s) => [s.seconds, s.input])).toEqual(p.steps.map((s) => [s.seconds, s.input]));
      for (const text of [other[i].title, other[i].summary, ...other[i].steps.map((s) => s.text)]) expect(text.trim()).not.toBe("");
    });
  });

  it("three good things asks three times", () => {
    expect(getPractice("en", "three-good-things")?.steps.filter((s) => s.input === "line")).toHaveLength(3);
    expect(getPractice("vi", "kind-letter")?.steps.some((s) => s.input === "letter")).toBe(true);
    expect(getPractice("en", "nope")).toBeUndefined();
  });

  it("has nine practices", () => {
    expect(getPractices("en").map((p) => p.id)).toEqual([
      "grounding", "body-scan", "three-good-things", "kind-letter", "unsent-letter", "safe-place", "muscle-release",
      "self-compassion", "brain-dump",
    ]);
  });
});

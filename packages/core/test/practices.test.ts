import { describe, expect, it } from "vitest";
import { getPractice, getPractices } from "@mindcocoon/core/practices";

describe("practices", () => {
  it("every practice has the same steps in en and vi", () => {
    const en = getPractices("en");
    const vi = getPractices("vi");
    expect(vi.map((p) => p.id)).toEqual(en.map((p) => p.id));
    en.forEach((p, i) => {
      expect(vi[i].minutes).toBe(p.minutes);
      expect(vi[i].steps.map((s) => [s.seconds, s.input])).toEqual(p.steps.map((s) => [s.seconds, s.input]));
    });
  });

  it("three good things asks three times", () => {
    expect(getPractice("en", "three-good-things")?.steps.filter((s) => s.input === "line")).toHaveLength(3);
    expect(getPractice("vi", "kind-letter")?.steps.some((s) => s.input === "letter")).toBe(true);
    expect(getPractice("en", "nope")).toBeUndefined();
  });

  it("has seven practices", () => {
    expect(getPractices("en").map((p) => p.id)).toEqual([
      "grounding", "body-scan", "three-good-things", "kind-letter", "unsent-letter", "safe-place", "muscle-release",
    ]);
  });
});

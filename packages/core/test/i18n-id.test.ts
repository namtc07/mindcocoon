import { describe, expect, it } from "vitest";
import { en } from "@mindcocoon/core/i18n/dictionaries/en";
import { id } from "@mindcocoon/core/i18n/dictionaries/id";
import { getDictionary } from "@mindcocoon/core/i18n/get-dictionary";
import { getPractices } from "@mindcocoon/core/practices";
import { REFLECTION_PROMPTS } from "@mindcocoon/core/prompts";
import { STORIES } from "@mindcocoon/core/stories";

function leaves(obj: unknown, prefix = ""): [string, unknown][] {
  if (typeof obj !== "object" || obj === null) return [[prefix, obj]];
  return Object.entries(obj).flatMap(([key, value]) => leaves(value, prefix ? `${prefix}.${key}` : key));
}

describe("Indonesian (id)", () => {
  it("is what getDictionary returns for id", () => {
    expect(getDictionary("id")).toBe(id);
  });

  it("has every key of the English dictionary, and no empty strings", () => {
    const keys = new Map(leaves(id));
    for (const [path] of leaves(en)) {
      expect(keys.has(path), path).toBe(true);
      const value = keys.get(path);
      expect(typeof value, path).toBe("string");
      expect((value as string).trim(), path).not.toBe("");
    }
    expect(keys.size).toBe(leaves(en).length);
  });

  it("speaks like a calm friend: no exclamation marks, no formal 'Anda'", () => {
    const texts = [
      ...leaves(id).map(([, v]) => v as string),
      ...REFLECTION_PROMPTS.id,
      ...getPractices("id").flatMap((p) => [p.title, p.summary, ...p.steps.map((s) => s.text)]),
      ...STORIES.id.flatMap((s) => [s.title, s.summary, ...s.paragraphs]),
    ];
    for (const t of texts) {
      expect(t, t).not.toMatch(/!/);
      expect(t, t).not.toMatch(/\bAnda\b/);
    }
  });

  it("has as many prompts, practices and stories as English", () => {
    expect(REFLECTION_PROMPTS.id).toHaveLength(REFLECTION_PROMPTS.en.length);
    expect(getPractices("id").map((p) => [p.id, p.steps.length])).toEqual(getPractices("en").map((p) => [p.id, p.steps.length]));
    expect(STORIES.id.map((s) => [s.id, s.paragraphs.length])).toEqual(STORIES.en.map((s) => [s.id, s.paragraphs.length]));
  });
});

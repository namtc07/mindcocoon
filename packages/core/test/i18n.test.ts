import { describe, expect, it } from "vitest";
import { isLocale, LOCALES, resolveLocale } from "@mindcocoon/core/i18n/config";
import { en } from "@mindcocoon/core/i18n/dictionaries/en";
import { getDictionary } from "@mindcocoon/core/i18n/get-dictionary";

function leafPaths(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj)
    .flatMap(([key, value]) => leafPaths(value, prefix ? `${prefix}.${key}` : key))
    .sort();
}

function leafValues(obj: unknown): unknown[] {
  if (typeof obj !== "object" || obj === null) return [obj];
  return Object.values(obj).flatMap(leafValues);
}

describe("resolveLocale", () => {
  it("picks Vietnamese for Vietnamese browsers", () => {
    expect(resolveLocale({ acceptLanguage: "vi-VN,vi;q=0.9,en;q=0.8" })).toBe("vi");
  });

  it("picks the best supported language by weight", () => {
    expect(resolveLocale({ acceptLanguage: "fr-FR,en;q=0.5" })).toBe("en");
    expect(resolveLocale({ acceptLanguage: "fr-FR,en;q=0.5,vi;q=0.7" })).toBe("vi");
  });

  it("falls back to English when nothing matches", () => {
    expect(resolveLocale({ acceptLanguage: "fr-FR" })).toBe("en");
    expect(resolveLocale({ acceptLanguage: null })).toBe("en");
    expect(resolveLocale({})).toBe("en");
  });

  it("prefers a valid cookie over the header", () => {
    expect(resolveLocale({ cookie: "vi", acceptLanguage: "en-US" })).toBe("vi");
  });

  it("picks Indonesian for Indonesian browsers", () => {
    expect(resolveLocale({ acceptLanguage: "id-ID,id;q=0.9,en;q=0.8" })).toBe("id");
  });

  it("ignores an invalid cookie", () => {
    expect(resolveLocale({ cookie: "xx", acceptLanguage: "vi" })).toBe("vi");
  });
});

describe("isLocale", () => {
  it("accepts only supported locales", () => {
    expect(isLocale("vi")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("id")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("dictionaries", () => {
  it("cover vi, en and id", () => {
    expect([...LOCALES]).toEqual(["vi", "en", "id"]);
  });

  it.each(LOCALES)("%s has identical keys to en", (locale) => {
    expect(leafPaths(getDictionary(locale))).toEqual(leafPaths(en));
  });

  it.each(LOCALES)("%s has only non-empty strings", (locale) => {
    for (const value of leafValues(getDictionary(locale))) {
      expect(typeof value).toBe("string");
      expect((value as string).trim()).not.toBe("");
    }
  });

  it.each(LOCALES)("%s keeps every {placeholder} of en", (locale) => {
    const placeholders = (d: unknown) => leafValues(d).map((v) => ((v as string).match(/\{\w+\}/g) ?? []).sort().join(","));
    expect(placeholders(getDictionary(locale))).toEqual(placeholders(en));
  });
});

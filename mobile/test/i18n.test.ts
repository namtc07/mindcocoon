import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FakeKvStore } from "./fakes/expo-sqlite-kv-store";

// One fake SQLite store shared across module reloads, like the real database across launches.
vi.mock("expo-sqlite/kv-store", async () => {
  const { FakeKvStore } = await import("./fakes/expo-sqlite-kv-store");
  const g = globalThis as { __kv?: FakeKvStore };
  g.__kv ??= new FakeKvStore();
  return { default: g.__kv };
});
vi.mock("expo-localization", () => ({ getLocales: () => [{ languageCode: "vi", languageTag: "vi-VN" }] }));

beforeEach(() => {
  (globalThis as { __kv?: FakeKvStore }).__kv?.data.clear();
  vi.resetModules();
});

describe("deviceLocale", () => {
  it.each([
    [[{ languageCode: "vi" }], "vi"],
    [[{ languageCode: "en" }], "en"],
    [[{ languageCode: "fr" }, { languageCode: "vi" }], "vi"],
    [[{ languageCode: "fr" }], "en"],
    [[], "en"],
    [[{ languageCode: null }], "en"],
  ])("%j → %s", async (locales, expected) => {
    const { deviceLocale } = await import("../src/i18n/locale");
    expect(deviceLocale(locales)).toBe(expected);
  });
});

describe("preferences", () => {
  it("uses the device language until the person chooses", async () => {
    const { currentLocale, loadPrefs } = await import("../src/i18n/locale");
    await loadPrefs();
    expect(currentLocale()).toBe("vi");
  });

  it("keeps an explicit choice across launches", async () => {
    const first = await import("../src/i18n/locale");
    await first.loadPrefs();
    await first.setLocale("en");
    expect(first.currentLocale()).toBe("en");

    vi.resetModules(); // next launch
    const second = await import("../src/i18n/locale");
    expect(second.currentLocale()).toBe("vi"); // before prefs load
    await second.loadPrefs();
    expect(second.currentLocale()).toBe("en");
  });
});

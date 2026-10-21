import { describe, expect, it } from "vitest";
import { proOfferVisible, withMoment } from "../src/lib/purchases/placement";

describe("pro offer placement", () => {
  it("never shows during onboarding or the first session, however ready the store is", () => {
    expect(proOfferVisible({ isPro: false, storeAvailable: true, moments: ["letter"], firstRunSeen: false })).toBe(false);
    expect(proOfferVisible({ isPro: false, storeAvailable: true, moments: [], firstRunSeen: false })).toBe(false);
  });

  it("stays hidden until a value moment has actually happened", () => {
    expect(proOfferVisible({ isPro: false, storeAvailable: true, moments: [], firstRunSeen: true })).toBe(false);
    expect(proOfferVisible({ isPro: false, storeAvailable: true, moments: undefined, firstRunSeen: true })).toBe(false);
    for (const moment of ["sleep-fade", "letter", "mix-limit"] as const) {
      expect(proOfferVisible({ isPro: false, storeAvailable: true, moments: [moment], firstRunSeen: true })).toBe(true);
    }
  });

  it("needs a store that can sell, and owners always see their Pro status", () => {
    expect(proOfferVisible({ isPro: false, storeAvailable: false, moments: ["letter"], firstRunSeen: true })).toBe(false);
    expect(proOfferVisible({ isPro: true, storeAvailable: false, moments: [], firstRunSeen: false })).toBe(true);
  });

  it("records each moment once", () => {
    expect(withMoment(undefined, "letter")).toEqual(["letter"]);
    expect(withMoment(["letter"], "letter")).toEqual(["letter"]);
    expect(withMoment(["letter"], "sleep-fade")).toEqual(["letter", "sleep-fade"]);
  });
});

import { getPref, setPref } from "../prefs";
import type { PlanId } from "./plan";

export type { PlanId };

export interface Plan {
  id: PlanId;
  /** As the store shows it, in the person's currency (e.g. "$2.99"). */
  price: string;
}

export type PurchaseResult = "purchased" | "cancelled" | "failed";

/**
 * Where purchases come from. Today only a test store exists (development builds): nothing is
 * charged. A real one (RevenueCat or StoreKit / Play Billing) plugs in behind the same interface.
 */
export interface Store {
  readonly test: boolean;
  plans(): Promise<Plan[]>;
  purchase(id: PlanId): Promise<PurchaseResult>;
  /** The plan this person already owns, if any. */
  restore(): Promise<PlanId | null>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Simulated store for development: test prices, instant "purchases", remembered on this device. */
export const testStore: Store = {
  test: true,
  async plans() {
    return [
      { id: "monthly", price: "$2.99" },
      { id: "yearly", price: "$19.99" },
      { id: "lifetime", price: "$39.99" },
    ];
  },
  async purchase(id) {
    await wait(300);
    await setPref("testPurchases", [...new Set([...(getPref("testPurchases") ?? []), id])]);
    return "purchased";
  },
  async restore() {
    const owned = getPref("testPurchases") ?? [];
    return (["lifetime", "yearly", "monthly"] as const).find((p) => owned.includes(p)) ?? null;
  },
};

/** The store this build can sell from, or null (then Pro isn't offered at all). */
export function activeStore(): Store | null {
  return __DEV__ ? testStore : null;
}

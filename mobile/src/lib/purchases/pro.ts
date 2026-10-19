import { useSyncExternalStore } from "react";
import { getPref, setPref, subscribePrefs } from "../prefs";
import { activeStore, type PlanId } from "./store";

/** With Pro, saved mixes can grow to this many. */
export const PRO_MIX_LIMIT = 20;

const read = () => getPref("pro") !== undefined;

/** Pro is on (bought or restored on this device). */
export function useIsPro(): boolean {
  return useSyncExternalStore(subscribePrefs, read, read);
}

export async function buy(plan: PlanId) {
  const store = activeStore();
  if (!store) return "failed" as const;
  const result = await store.purchase(plan).catch(() => "failed" as const);
  if (result === "purchased") await setPref("pro", { plan, since: Date.now() });
  return result;
}

/** Brings back a plan bought before; returns it, or null when there is nothing to restore. */
export async function restore(): Promise<PlanId | null> {
  const plan = (await activeStore()?.restore().catch(() => null)) ?? null;
  if (plan) await setPref("pro", { plan, since: Date.now() });
  return plan;
}

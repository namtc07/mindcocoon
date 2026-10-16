import type { Locale } from "@/lib/i18n/config";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Anonymous open counts. Preference: on by default, stored locally, exposed as an
 * external store; sending lives below.
 */

const ENABLED_KEY = "mc:analytics";
const listeners = new Set<() => void>();

export function isAnalyticsEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setAnalyticsEnabled(on: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: nothing is sent without storage anyway.
  }
  listeners.forEach((l) => l());
}

export function subscribeAnalyticsPref(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// --- Sending -------------------------------------------------------------------

const DEVICE_KEY = "mc:device-id";
let trackedThisLoad = false;

/** Random id for counting returning devices. Not linked to any person or account. */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** ISO timestamp truncated to the UTC hour. */
export function hourBucket(date: Date): string {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

/**
 * Records one anonymous "opened" event per page load: device id, hour, locale.
 * Never content, moods, tags or anything typed.
 */
export async function trackAppOpen(now: Date, locale: Locale): Promise<void> {
  if (trackedThisLoad || !isAnalyticsEnabled()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  trackedThisLoad = true;
  const { error } = await supabase
    .from("app_opens")
    .insert({ device_id: getDeviceId(), hour_bucket: hourBucket(now), locale });
  // 23505: already counted this device for this hour.
  if (error && error.code !== "23505") console.warn("Open count not recorded", error.message);
}

export function __resetAnalyticsForTests() {
  trackedThisLoad = false;
}

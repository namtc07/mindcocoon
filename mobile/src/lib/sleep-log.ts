import { getPref, setPref } from "./prefs";
import { withNight, withQuality, type SleepQuality } from "./sleep-log-core";

/** Remember that tonight is a sleep night (wind-down "Goodnight", or a sleep timer set in the evening). */
export function markSleepNight(now = new Date(), windDown = false) {
  return setPref("sleepLog", withNight(getPref("sleepLog") ?? [], now, windDown));
}

export function answerSleep(night: string, quality: SleepQuality) {
  return setPref("sleepLog", withQuality(getPref("sleepLog") ?? [], night, quality));
}

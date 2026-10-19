import { useEffect, useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/i18n";
import { syncLetterNotification } from "@/lib/letter-notification";
import { getPref, subscribePrefs } from "@/lib/prefs";
import { rescheduleReminder } from "@/lib/reminder";

const readLetter = () => getPref("weeklyLetter") !== false;
const readReminder = () => getPref("reminder")?.hour ?? null;

/** Keeps the evening reminder and the Sunday letter scheduled, in the app's language. Renders nothing. */
export function ReminderSync() {
  const { t } = useI18n();
  // The Sunday letter follows its switch and the evening reminder (which is how permission is given).
  const letterOn = useSyncExternalStore(subscribePrefs, readLetter, readLetter);
  const reminder = useSyncExternalStore(subscribePrefs, readReminder, readReminder);
  useEffect(() => {
    rescheduleReminder(t).catch(() => {});
  }, [t]);
  useEffect(() => {
    syncLetterNotification(t).catch(() => {});
  }, [t, letterOn, reminder]);
  return null;
}

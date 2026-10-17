import { useEffect } from "react";
import { useI18n } from "@/i18n/i18n";
import { rescheduleReminder } from "@/lib/reminder";

/** Keeps a scheduled evening reminder in the app's language. Renders nothing. */
export function ReminderSync() {
  const { t } = useI18n();
  useEffect(() => {
    rescheduleReminder(t).catch(() => {});
  }, [t]);
  return null;
}

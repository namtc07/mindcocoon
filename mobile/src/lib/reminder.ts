import type { Dictionary } from "@mindcocoon/core/i18n/get-dictionary";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { getPref, setPref } from "./prefs";

/** Optional evening reminder: one local notification a day, off unless the person turns it on. */

export type ReminderHour = 21 | 22 | 23;
export const REMINDER_HOURS: ReminderHour[] = [21, 22, 23];
const ID = "mindcocoon-evening";
const CHANNEL = "evening";

async function schedule(hour: ReminderHour, t: Dictionary) {
  await Notifications.cancelScheduledNotificationAsync(ID);
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: t.settings.reminderTitle, importance: AndroidImportance.DEFAULT, showBadge: false });
  }
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title: t.reminder.title, body: t.reminder.body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: CHANNEL },
  });
}

/** null turns it off. Asks for permission when turning on (no badges: no red dots, ever). */
export async function setReminder(hour: ReminderHour | null, t: Dictionary): Promise<"scheduled" | "off" | "denied"> {
  if (hour === null) {
    await Notifications.cancelScheduledNotificationAsync(ID);
    await setPref("reminder", null);
    return "off";
  }
  const current = await Notifications.getPermissionsAsync();
  const granted =
    current.granted || (await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } })).granted;
  if (!granted) return "denied";
  await schedule(hour, t);
  await setPref("reminder", { hour });
  return "scheduled";
}

/** Re-applies the saved reminder (e.g. in the new language). */
export async function rescheduleReminder(t: Dictionary) {
  const saved = getPref("reminder");
  if (saved) await schedule(saved.hour, t);
}

export function cancelReminder() {
  return Notifications.cancelScheduledNotificationAsync(ID);
}

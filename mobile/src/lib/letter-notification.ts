import type { Dictionary } from "@mindcocoon/core/i18n/get-dictionary";
import * as Notifications from "expo-notifications";
import { getPref } from "./prefs";

const ID = "mindcocoon-letter";
const CHANNEL = "evening";

/**
 * Sunday 19:00, once a week: "Kén left you a few lines." Nothing private on the lock screen.
 * Only when the person already allowed notifications (never asks by itself) and the letter is on.
 */
export async function syncLetterNotification(t: Dictionary) {
  await Notifications.cancelScheduledNotificationAsync(ID);
  if (getPref("weeklyLetter") === false) return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title: t.letter.title, body: t.letter.notification, data: { url: "/letter" } },
    // Weekdays count from 1 = Sunday.
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 19, minute: 0, channelId: CHANNEL },
  });
}

import * as Notifications from "expo-notifications";
import { router, type Href } from "expo-router";
import { useEffect } from "react";

const handled = new Set<string>();
const ALLOWED = new Set(["/wind-down"]);

/** Opens the screen a tapped notification points to (cold start or running), once per tap. Renders nothing. */
export function NotificationRouter() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const key = `${response.notification.request.identifier}:${response.notification.date}`;
    const url = response.notification.request.content.data?.url;
    if (handled.has(key) || typeof url !== "string" || !ALLOWED.has(url)) return;
    handled.add(key);
    router.push(url as Href);
  }, [response]);
  return null;
}

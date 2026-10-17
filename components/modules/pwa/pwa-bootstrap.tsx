"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { stripLocale } from "@/components/providers/i18n-provider";
import { onMoodChange } from "@mindcocoon/core/mood/store";
import {
  isStandalone,
  markInstallHintShown,
  recordVisit,
  requestPersistentStorage,
  setInstallHintVisible,
  shouldShowInstallHint,
} from "@/lib/pwa";
import { onVaultChange } from "@mindcocoon/core/vault/session";

/**
 * Registers the service worker (production), asks the browser to keep our data
 * once something worth keeping exists, and decides whether to show the iOS
 * install hint (rendered inline by <InstallHint />, never over the page).
 */
export function PwaBootstrap() {
  const path = stripLocale(usePathname());

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => console.warn("Service worker failed", error));
    }
    if (isStandalone()) void requestPersistentStorage();
    const persist = () => void requestPersistentStorage();
    const offVault = onVaultChange(persist);
    const offMood = onMoodChange(persist);
    return () => {
      offVault();
      offMood();
    };
  }, []);

  useEffect(() => {
    const state = recordVisit(path);
    if (shouldShowInstallHint(Date.now(), state)) {
      markInstallHintShown(Date.now());
      setInstallHintVisible(true);
    }
    // Count a visit once per page load, not on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

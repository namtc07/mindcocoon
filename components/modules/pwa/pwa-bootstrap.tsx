"use client";

import { Share, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { stripLocale, useI18n } from "@/components/providers/i18n-provider";
import { onMoodChange } from "@/lib/mood/store";
import {
  isStandalone,
  markInstallHintShown,
  recordVisit,
  requestPersistentStorage,
  shouldShowInstallHint,
} from "@/lib/pwa";
import { onVaultChange } from "@/lib/vault/session";

/**
 * Registers the service worker (production), asks the browser to keep our data
 * once something worth keeping exists, and shows the iOS install hint rarely.
 */
export function PwaBootstrap() {
  const { t } = useI18n();
  const path = stripLocale(usePathname());
  const [hint, setHint] = useState(false);

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
      queueMicrotask(() => setHint(true));
    }
    // Count a visit once per page load, not on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hint || path.startsWith("/vent")) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-3 top-3 z-50 flex items-start gap-3 rounded-2xl border border-border bg-popover/95 p-4 shadow-lg backdrop-blur md:left-auto md:w-96"
    >
      <Share className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="text-sm">
        <p className="font-medium text-foreground">{t.pwa.installTitle}</p>
        <p className="mt-1 text-muted-foreground">{t.pwa.installBody}</p>
      </div>
      <button type="button" aria-label={t.safety.dismiss} onClick={() => setHint(false)} className="text-muted-foreground hover:text-foreground">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

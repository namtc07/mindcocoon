"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { trackAppOpen } from "@/lib/analytics";

/** Counts one anonymous open per page load (see lib/analytics.ts). */
export function TrackOpen() {
  const { locale } = useI18n();
  useEffect(() => {
    void trackAppOpen(new Date(), locale);
  }, [locale]);
  return null;
}

"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useNow } from "@/hooks/use-now";
import { canShowAd, getAdsConfig, type AdPlacement } from "@/lib/ads/config";

export type { AdPlacement };

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
  }
}

const config = getAdsConfig();

/**
 * A single, static, non-personalised banner. Only placed at the bottom of Today
 * and Mood; never on vent, vault, breathing, after-release or help. Renders
 * nothing unless ads are enabled, configured, and outside quiet hours.
 */
export function AdBanner({ placement }: { placement: AdPlacement }) {
  const { t } = useI18n();
  const now = useNow();
  const pushed = useRef(false);
  const visible = now !== null && canShowAd({ placement, now, config });

  useEffect(() => {
    if (!visible || pushed.current) return;
    pushed.current = true;
    const queue = (window.adsbygoogle = window.adsbygoogle || []);
    queue.requestNonPersonalizedAds = 1;
    queue.push({});
  }, [visible]);

  if (!visible) return null;

  return (
    <aside aria-label={t.ads.label} className="space-y-1 pt-6">
      <p className="text-xs text-muted-foreground">{t.ads.label}</p>
      <Script
        id="adsbygoogle"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.client}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      <div className="h-[100px] overflow-hidden rounded-xl bg-surface/60">
        <ins
          className="adsbygoogle block h-[100px]"
          data-ad-client={config.client}
          data-ad-slot={config.slots[placement]}
          data-ad-format="horizontal"
          data-full-width-responsive="false"
        />
      </div>
    </aside>
  );
}

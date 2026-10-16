"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useHydrated } from "@/hooks/use-hydrated";
import { isAnalyticsEnabled, setAnalyticsEnabled, subscribeAnalyticsPref } from "@/lib/analytics";
import { downloadExport, eraseEverything } from "@/lib/data";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const LANGUAGE_NAMES: Record<Locale, string> = { vi: "Tiếng Việt", en: "English" };
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-sm text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Choice({ options, value, onChange, label }: { options: { id: string; label: string }[]; value: string; onChange: (id: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm transition-colors",
            o.id === value ? "border-primary/60 bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsView({ onErased = () => window.location.reload() }: { onErased?: () => void }) {
  const { t, locale, setLocale, href } = useI18n();
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const analytics = useSyncExternalStore(subscribeAnalyticsPref, isAnalyticsEnabled, () => true);
  const [erasing, setErasing] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const confirmed = confirmText.trim().normalize("NFC").toLowerCase() === t.settings.eraseConfirmWord;

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-4xl">{t.settings.title}</h1>

      <div className="space-y-8">
        <Section title={t.settings.language}>
          <Choice
            label={t.settings.language}
            value={locale}
            onChange={(id) => setLocale(id as Locale)}
            options={LOCALES.map((l) => ({ id: l, label: LANGUAGE_NAMES[l] }))}
          />
        </Section>

        <Section title={t.settings.appearance}>
          <Choice
            label={t.settings.appearance}
            value={hydrated ? (theme ?? "dark") : ""}
            onChange={setTheme}
            options={[
              { id: "dark", label: t.settings.themeDusk },
              { id: "light", label: t.settings.themeMist },
            ]}
          />
        </Section>

        <Section title={t.settings.vault}>
          <Link href={href("/vault")} className="text-primary underline-offset-4 hover:underline">
            {t.settings.vaultLink}
          </Link>
        </Section>

        <Section title={t.settings.privacy}>
          <label className="flex items-start gap-3">
            <Switch checked={analytics} onCheckedChange={setAnalyticsEnabled} aria-label={t.settings.analytics} className="mt-0.5" />
            <span>
              <span className="block text-sm text-foreground">{t.settings.analytics}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{t.settings.analyticsHint}</span>
            </span>
          </label>
        </Section>

        <Section title={t.settings.data}>
          <div className="space-y-2">
            <Button variant="outline" onClick={() => void downloadExport()}>
              {t.settings.export}
            </Button>
            <p className="text-sm text-muted-foreground">{t.settings.exportHint}</p>
          </div>
          <div className="space-y-3 pt-4">
            {!erasing ? (
              <Button variant="destructive" onClick={() => setErasing(true)}>
                {t.settings.erase}
              </Button>
            ) : (
              <div className="max-w-sm space-y-3">
                <p className="text-sm text-muted-foreground">{t.settings.eraseHint}</p>
                <Input
                  aria-label={t.settings.eraseConfirmLabel}
                  placeholder={t.settings.eraseConfirmLabel}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoComplete="off"
                />
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    disabled={!confirmed}
                    onClick={async () => {
                      await eraseEverything();
                      onErased();
                    }}
                  >
                    {t.settings.eraseNow}
                  </Button>
                  <Button variant="ghost" onClick={() => setErasing(false)}>
                    {t.common.cancel}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title={t.settings.about}>
          <p className="max-w-prose text-sm text-muted-foreground">{t.settings.disclaimer}</p>
          <Link href={href("/help")} className="text-primary underline-offset-4 hover:underline">
            {t.settings.helpLink}
          </Link>
        </Section>
      </div>
    </div>
  );
}

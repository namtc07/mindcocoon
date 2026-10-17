"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@mindcocoon/core/i18n/config";
import type { Dictionary } from "@mindcocoon/core/i18n/get-dictionary";

interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
  /** Prefixes an app path with the current locale: href("/vent") → "/vi/vent". */
  href: (path: string) => string;
  setLocale: (next: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function localizePath(locale: Locale, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** Removes a leading locale segment: "/vi/vent" → "/vent". */
export function stripLocale(pathname: string) {
  const [, first, ...rest] = pathname.split("/");
  if ((LOCALES as readonly string[]).includes(first)) return `/${rest.join("/")}`;
  return pathname;
}

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const href = useCallback((path: string) => localizePath(locale, path), [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      router.replace(localizePath(next, stripLocale(pathname)) + window.location.search);
    },
    [pathname, router],
  );

  const value = useMemo(
    () => ({ locale, t: dictionary, href, setLocale }),
    [locale, dictionary, href, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

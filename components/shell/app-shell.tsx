"use client";

import { Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BackupController } from "@/components/modules/account/backup-controller";
import { FirstRunNotice } from "@/components/modules/onboarding/first-run-notice";
import { PwaBootstrap } from "@/components/modules/pwa/pwa-bootstrap";
import { stripLocale, useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { MiniAudioBar } from "./mini-audio-bar";
import { NAV_ITEMS, isActive } from "./nav-items";

/** Desktop left rail, mobile header + bottom tab bar. Vent is full-screen and hides it. */
export function AppShell({ children }: { children: ReactNode }) {
  const { t, href } = useI18n();
  const path = stripLocale(usePathname());
  const immersive = isActive(path, "/vent");

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        {t.shell.skipToContent}
      </a>

      {!immersive && (
        <>
          <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border px-4 py-8 md:flex">
            <Link href={href("/")} className="px-3 font-serif text-xl tracking-tight">
              MindCocoon
            </Link>
            <nav aria-label={t.nav.primary} className="mt-10 flex flex-1 flex-col gap-1">
              {NAV_ITEMS.map(({ href: to, labelKey, icon: Icon }) => {
                const active = isActive(path, to);
                return (
                  <Link
                    key={to}
                    href={href(to)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                      active && "bg-accent text-foreground",
                      to === "/settings" && "mt-auto",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {t.nav[labelKey]}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <header className="sticky top-0 z-30 flex items-center justify-between bg-background/85 px-4 py-3 backdrop-blur md:hidden">
            <Link href={href("/")} className="font-serif text-lg">
              MindCocoon
            </Link>
            <Link
              href={href("/settings")}
              aria-label={t.shell.openSettings}
              className="rounded-full p-2 text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="size-5" aria-hidden />
            </Link>
          </header>
        </>
      )}

      <main
        id="content"
        className={cn(
          !immersive && "px-4 pt-6 pb-32 md:ml-56 md:px-10 md:pt-14 md:pb-24",
        )}
      >
        <div className={cn(!immersive && "mx-auto w-full max-w-[680px] md:mx-0")}>{children}</div>
      </main>

      <MiniAudioBar />
      <FirstRunNotice />
      <PwaBootstrap />
      <BackupController />

      {!immersive && (
        <nav
          aria-label={t.nav.primary}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
          <ul className="grid grid-cols-5">
            {NAV_ITEMS.filter((item) => item.inTabBar).map(({ href: to, labelKey, icon: Icon }) => {
              const active = isActive(path, to);
              return (
                <li key={to}>
                  <Link
                    href={href(to)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground",
                      active && "text-foreground",
                    )}
                  >
                    <Icon className={cn("size-5", active && "text-primary")} aria-hidden />
                    {t.nav[labelKey]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}

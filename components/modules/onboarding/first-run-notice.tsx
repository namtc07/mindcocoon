"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { stripLocale, useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SEEN_KEY = "mc:first-run-seen";
const listeners = new Set<() => void>();

function hasSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    // Storage blocked: don't show a notice that could never be dismissed for good.
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** One-time welcome with the not-a-substitute disclaimer. Never covers the help page. */
export function FirstRunNotice() {
  const { t, href } = useI18n();
  const path = stripLocale(usePathname());
  const seen = useSyncExternalStore(subscribe, hasSeen, () => true);
  const open = !seen && !path.startsWith("/help");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && markSeen()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">{t.settings.firstRunTitle}</DialogTitle>
          <DialogDescription>{t.settings.firstRunBody}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t.settings.disclaimer}</p>
        <DialogFooter className="items-center gap-4 sm:justify-between">
          <Link href={href("/help")} onClick={markSeen} className="text-sm text-primary underline-offset-4 hover:underline">
            {t.settings.helpLink}
          </Link>
          <Button onClick={markSeen}>{t.settings.firstRunOk}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

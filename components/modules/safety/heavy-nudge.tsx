"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { shouldShowHeavyNudge } from "@/lib/mood/selectors";

const STORAGE_KEY = "mc:heavy-nudge";

function readLastShown(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

/** One quiet line after a week of heavy days, at most once a week, computed on this device. */
export function HeavyNudge({ now }: { now: Date }) {
  const { t, href } = useI18n();
  const { status, logs } = useMoodLogs();
  // Captured once per visit so the line doesn't vanish the moment it is recorded as shown.
  const [lastShownAt] = useState(readLastShown);
  const [dismissed, setDismissed] = useState(false);
  const visible = status === "ready" && !dismissed && shouldShowHeavyNudge(logs, now, lastShownAt);

  useEffect(() => {
    if (!visible) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Storage blocked: the nudge may show again next visit, which is acceptable.
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <p className="flex items-start gap-3 rounded-xl bg-surface px-4 py-3 text-sm text-foreground/90">
      <span className="flex-1">
        {t.safety.heavyNudge}{" "}
        <Link href={href("/help")} className="text-primary underline-offset-4 hover:underline">
          {t.safety.heavyNudgeLink}
        </Link>
      </span>
      <button
        type="button"
        aria-label={t.safety.dismiss}
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
    </p>
  );
}

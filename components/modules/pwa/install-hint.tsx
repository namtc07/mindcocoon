"use client";

import { Share, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { getInstallHintVisible, setInstallHintVisible, subscribeInstallHint } from "@/lib/pwa";

/** iOS "Add to Home Screen" explanation, as a quiet inline note on Today. */
export function InstallHint() {
  const { t } = useI18n();
  const visible = useSyncExternalStore(subscribeInstallHint, getInstallHintVisible, () => false);
  if (!visible) return null;

  return (
    <div role="note" className="flex items-start gap-3 rounded-xl bg-surface px-4 py-3">
      <Share className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="flex-1 text-sm">
        <p className="font-medium text-foreground">{t.pwa.installTitle}</p>
        <p className="mt-1 text-muted-foreground">{t.pwa.installBody}</p>
      </div>
      <button
        type="button"
        aria-label={t.safety.dismiss}
        onClick={() => setInstallHintVisible(false)}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

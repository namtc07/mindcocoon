"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Shows the 12 words once. Closing requires confirming they were saved. */
export function RecoveryCodeCard({ code, onClose }: { code: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const words = code?.split(" ") ?? [];

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard blocked — the words are still on screen to copy by hand.
    }
  }

  function close() {
    setSaved(false);
    setCopied(false);
    onClose();
  }

  return (
    <Dialog open={code !== null} onOpenChange={(open) => !open && saved && close()}>
      <DialogContent showCloseButton={false} onEscapeKeyDown={(e) => !saved && e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">{t.vault.recoveryTitle}</DialogTitle>
          <DialogDescription>{t.vault.recoveryBody}</DialogDescription>
        </DialogHeader>

        <ol className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl bg-surface p-4 font-mono text-sm sm:grid-cols-3">
          {words.map((word, i) => (
            <li key={i} className="flex gap-2">
              <span className="w-5 text-right text-muted-foreground">{i + 1}</span>
              <span data-testid="recovery-word" className="text-foreground">
                {word}
              </span>
            </li>
          ))}
        </ol>

        <Button variant="ghost" size="sm" onClick={copy} className="w-fit">
          <Copy aria-hidden />
          {copied ? t.vault.copied : t.vault.copy}
        </Button>

        <p className="text-sm text-ember">{t.vault.recoveryWarning}</p>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          {t.vault.savedIt}
        </label>

        <DialogFooter>
          <Button onClick={close} disabled={!saved}>
            {t.vault.done}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

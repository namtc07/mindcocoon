"use client";

import { HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

let shownThisSession = false;

/** True the first time per page session; the card never nags twice. */
export function claimGentleCard(): boolean {
  if (shownThisSession) return false;
  shownThisSession = true;
  return true;
}

export function __resetGentleCardForTests() {
  shownThisSession = false;
}

interface GentleCardProps {
  open: boolean;
  continueLabel: string;
  onContinue: () => void;
  onClose: () => void;
}

/** Shown before releasing or saving words that suggest risk. Never blocks, never stores. */
export function GentleCard({ open, continueLabel, onContinue, onClose }: GentleCardProps) {
  const { t, href } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="gap-6">
        <HeartHandshake className="size-7 text-primary" aria-hidden />
        <DialogTitle className="font-serif text-2xl leading-snug font-normal">{t.safety.cardMessage}</DialogTitle>
        <DialogDescription className="sr-only">{t.safety.helpIntro}</DialogDescription>
        <DialogFooter className="gap-3 sm:justify-start">
          <Button asChild size="lg" className="rounded-full">
            <Link href={href("/help")}>{t.safety.callLine}</Link>
          </Button>
          <Button size="lg" variant="ghost" className="rounded-full" onClick={onContinue}>
            {continueLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

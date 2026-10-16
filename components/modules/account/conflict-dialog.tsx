"use client";

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

/** Nothing happens until the person chooses. */
export function ConflictDialog({
  open,
  onKeepLocal,
  onUseBackup,
  onOpenChange,
}: {
  open: boolean;
  onKeepLocal: () => void;
  onUseBackup: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">{t.backup.conflictTitle}</DialogTitle>
          <DialogDescription>{t.backup.conflictBody}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:justify-start">
          <Button onClick={onKeepLocal}>{t.backup.keepLocal}</Button>
          <Button variant="outline" onClick={onUseBackup}>
            {t.backup.useBackup}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

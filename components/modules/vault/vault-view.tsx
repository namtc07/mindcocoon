"use client";

import { Lock, Settings2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BackupNudge } from "@/components/modules/account/backup-nudge";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { useVault } from "@/hooks/use-vault";
import { formatShortDay } from "@/lib/dates";
import { lockVault } from "@/lib/vault/session";
import { EntryReader } from "./entry-reader";
import { RecoveryCodeCard } from "./recovery-code-card";
import { UnlockPanel } from "./unlock-panel";
import { VaultSettings } from "./vault-settings";

const NUDGE_FIVE_KEY = "mc:nudge-5";

function readNudgeFive() {
  try {
    return localStorage.getItem(NUDGE_FIVE_KEY) !== null;
  } catch {
    return true;
  }
}

function markNudgeFive() {
  try {
    localStorage.setItem(NUDGE_FIVE_KEY, "1");
  } catch {
    // ignore
  }
}

export function VaultView() {
  const { t, locale, href } = useI18n();
  const vault = useVault();
  const [openId, setOpenId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const open = vault.entries.find((e) => e.id === openId) ?? null;
  const [nudgeAfterPasscode, setNudgeAfterPasscode] = useState(false);
  const [nudgeFiveSeen] = useState(readNudgeFive);
  const nudgeFive = !nudgeFiveSeen && vault.entries.length >= 5;
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const showNudge = !nudgeDismissed && (nudgeAfterPasscode || nudgeFive);

  useEffect(() => {
    if (nudgeFive) markNudgeFive();
  }, [nudgeFive]);

  if (vault.status === "unsupported") return <p className="text-muted-foreground">{t.vault.unsupported}</p>;
  if (vault.status === "idle" || vault.status === "loading") return <div className="min-h-[50vh]" aria-busy />;
  if (vault.status === "locked") return <UnlockPanel resetReadyAt={vault.resetReadyAt} />;

  return (
    <div className="space-y-10">
      {open ? (
        <EntryReader key={open.id} entry={open} onBack={() => setOpenId(null)} />
      ) : (
        <>
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl">{t.vault.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t.vault.intro}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              {vault.hasPasscode && (
                <Button variant="ghost" size="icon" aria-label={t.vault.lockNow} onClick={lockVault}>
                  <Lock aria-hidden />
                </Button>
              )}
              <Button variant="ghost" size="icon" aria-label={t.vault.settings} onClick={() => setSettingsOpen(true)}>
                <Settings2 aria-hidden />
              </Button>
            </div>
          </header>

          {showNudge && <BackupNudge onDismiss={() => setNudgeDismissed(true)} />}

          {vault.entries.length === 0 ? (
            <div className="space-y-4 py-10">
              <p className="text-muted-foreground">{t.vault.empty}</p>
              <Link href={href("/vent")} className="text-primary underline-offset-4 hover:underline">
                {t.vault.writeFirst}
              </Link>
            </div>
          ) : (
            <ul>
              {vault.entries.map((entry) => (
                <li key={entry.id} className="border-t border-border first:border-t-0">
                  <button
                    type="button"
                    onClick={() => setOpenId(entry.id)}
                    className="flex w-full items-baseline justify-between gap-6 py-5 text-left hover:text-primary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-serif text-xl">
                        {entry.title || entry.body.split("\n")[0].slice(0, 80) || t.vault.untitled}
                      </span>
                      {entry.title && (
                        <span className="mt-1 block truncate text-sm text-muted-foreground">{entry.body.slice(0, 120)}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {formatShortDay(new Date(entry.createdAt), locale)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <VaultSettings
        open={settingsOpen}
        vault={vault}
        onOpenChange={setSettingsOpen}
        onRecoveryCode={setRecoveryCode}
        onPasscodeSet={() => setNudgeAfterPasscode(true)}
      />
      <RecoveryCodeCard code={recoveryCode} onClose={() => setRecoveryCode(null)} />
    </div>
  );
}

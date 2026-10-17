"use client";

import { ArrowLeft, BookLock } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { GentleCard, claimGentleCard } from "@/components/modules/safety/gentle-card";
import { HelpLink } from "@/components/modules/safety/help-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { promptForDay } from "@mindcocoon/core/prompts";
import { checkText } from "@mindcocoon/core/safety/detect";
import { AfterRelease } from "./after-release";
import { DissolveOverlay, planDissolve, type DissolvePlan } from "./dissolve-overlay";
import { SaveDialog } from "./save-dialog";

type Phase = "writing" | "dissolving" | "released";

function PromptHint() {
  const { locale } = useI18n();
  const params = useSearchParams();
  const now = useNow();
  const offset = params.get("prompt");
  if (offset === null || !now) return null;
  return (
    <p className="mb-6 max-w-[40ch] font-serif text-lg text-muted-foreground italic">
      {promptForDay(now, locale, Number(offset) || 0)}
    </p>
  );
}

/**
 * Full-screen writing surface. Released text is never persisted: it lives only in
 * component state until the dissolve finishes, then the editor is remounted so even
 * the browser's undo history is gone.
 */
export function VentView() {
  const { t, href } = useI18n();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("writing");
  const [plan, setPlan] = useState<DissolvePlan | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);
  const [pending, setPending] = useState<"release" | "save" | null>(null);
  const empty = text.trim().length === 0;

  const clearEditor = useCallback(() => {
    setText("");
    setEditorKey((k) => k + 1);
  }, []);

  function doRelease() {
    setPlan(planDissolve(text));
    clearEditor();
    setPhase("dissolving");
  }

  /** Runs the on-device risk check first; the gentle card shows at most once per session. */
  function attempt(action: "release" | "save") {
    if (empty) return;
    if (checkText(text).flagged && claimGentleCard()) {
      setPending(action);
      return;
    }
    if (action === "release") doRelease();
    else setSaveOpen(true);
  }

  function continuePending() {
    const action = pending;
    setPending(null);
    if (action === "release") doRelease();
    else if (action === "save") setSaveOpen(true);
  }

  const finishDissolve = useCallback(() => {
    setPlan(null);
    setPhase("released");
  }, []);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full w-full max-w-[720px] flex-col px-5 pt-5 pb-10 md:px-8">
        <header className="flex items-center justify-between text-sm text-muted-foreground">
          <Link href={href("/")} className="inline-flex items-center gap-1.5 hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden />
            {t.vent.back}
          </Link>
          <Link href={href("/vault")} className="inline-flex items-center gap-1.5 hover:text-foreground">
            <BookLock className="size-4" aria-hidden />
            {t.vent.openVault}
          </Link>
        </header>

        <div className="flex flex-1 flex-col pt-12 md:pt-20">
          {phase === "released" ? (
            <AfterRelease
              onWriteAgain={() => {
                clearEditor();
                setPhase("writing");
              }}
            />
          ) : phase === "dissolving" && plan ? (
            <>
              <Suspense>
                <PromptHint />
              </Suspense>
              <DissolveOverlay plan={plan} onDone={finishDissolve} />
            </>
          ) : (
            <>
              <Suspense>
                <PromptHint />
              </Suspense>
              <textarea
                key={editorKey}
                aria-label={t.vent.editorLabel}
                placeholder={t.vent.placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                className="vent-type field-sizing-content min-h-[45vh] w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground/60"
              />
              <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-3 bg-background/90 py-4 backdrop-blur">
                <Button
                  size="lg"
                  onClick={() => attempt("release")}
                  disabled={empty}
                  className="rounded-full bg-ember px-5 text-primary-foreground hover:bg-ember/90"
                >
                  {t.vent.release}
                </Button>
                <Button size="lg" variant="ghost" onClick={() => attempt("save")} disabled={empty} className="rounded-full">
                  {t.vent.saveToVault}
                </Button>
              </div>
            </>
          )}
        </div>

        <footer className="pt-6 text-center text-sm">
          <HelpLink />
        </footer>
      </div>

      <GentleCard
        open={pending !== null}
        continueLabel={pending === "save" ? t.safety.continueSave : t.safety.continueRelease}
        onContinue={continuePending}
        onClose={() => setPending(null)}
      />

      <SaveDialog
        open={saveOpen}
        body={text}
        onOpenChange={setSaveOpen}
        onSaved={() => {
          setSaveOpen(false);
          clearEditor();
        }}
      />
    </div>
  );
}

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { MoodPicker } from "@/components/modules/mood/mood-picker";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addMood, removeMood } from "@/lib/mood/store";
import { DEFAULT_TAGS } from "@/lib/moods";
import { cn } from "@/lib/utils";
import { VaultLockedError } from "@/lib/vault/session";
import type { MoodLog, MoodType } from "@/types";

/** One tap saves the mood; details (tags, note) can be added afterwards. */
export function QuickCheckin() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [saved, setSaved] = useState<MoodLog | null>(null);
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function pick(mood: MoodType) {
    if (saved) await removeMood(saved.id);
    const log = await addMood({ mood, tags: saved?.tags ?? [] });
    setSaved(log);
    setMessage(t.today.saved);
  }

  async function saveDetails() {
    if (!saved) return;
    try {
      const log = await addMood({ mood: saved.mood, tags, note });
      await removeMood(saved.id);
      setSaved(log);
      setOpen(false);
      setMessage(t.today.detailsSaved);
    } catch (error) {
      if (error instanceof VaultLockedError) setMessage(t.today.noteLocked);
      else throw error;
    }
  }

  return (
    <section className="space-y-5">
      <h2 className="text-sm text-muted-foreground">{t.today.checkinQuestion}</h2>
      <MoodPicker value={saved?.mood ?? null} onChange={pick} label={t.today.checkinQuestion} size="lg" />

      <div aria-live="polite" className="min-h-5 text-sm">
        {message && (
          <span className="inline-flex items-center gap-1.5 text-primary">
            <Check className="size-4" aria-hidden />
            {message}
          </span>
        )}
      </div>

      {saved && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t.today.addDetails}
        </button>
      )}

      <AnimatePresence initial={false}>
        {saved && open && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TAGS.map((tag) => {
                const on = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTags((cur) => (on ? cur.filter((x) => x !== tag) : [...cur, tag]))}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      on
                        ? "border-primary/60 bg-primary/15 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.mood.tags[tag]}
                  </button>
                );
              })}
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.today.notePlaceholder}
              rows={2}
              maxLength={280}
              className="resize-none"
            />
            <div className="flex gap-3">
              <Button onClick={saveDetails}>{t.today.saveDetails}</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useVault } from "@/hooks/use-vault";
import { addMood } from "@/lib/mood/store";
import { DEFAULT_TAGS } from "@/lib/moods";
import { cn } from "@/lib/utils";
import type { MoodType } from "@/types";
import { MoodPicker } from "./mood-picker";
import { tagLabel } from "./tag-label";

const CUSTOM_TAGS_KEY = "mc:custom-tags";
const MAX_CUSTOM_TAGS = 12;

function readCustomTags(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_TAGS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function CheckinForm() {
  const { t } = useI18n();
  const vault = useVault();
  const [mood, setMood] = useState<MoodType | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>(readCustomTags);
  const [newTag, setNewTag] = useState("");
  const [note, setNote] = useState("");
  const locked = vault.status === "locked";

  function toggle(tag: string) {
    setTags((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]));
  }

  function addCustomTag() {
    const tag = newTag.trim().slice(0, 24);
    if (!tag || customTags.includes(tag)) return;
    const next = [...customTags, tag].slice(-MAX_CUSTOM_TAGS);
    setCustomTags(next);
    try {
      localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: the tag still works for this check-in.
    }
    setTags((cur) => [...cur, tag]);
    setNewTag("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!mood) return;
    await addMood({ mood, tags, note: locked ? undefined : note });
    toast.success(t.moodPage.saved);
    setMood(null);
    setTags([]);
    setNote("");
  }

  return (
    <form aria-label={t.moodPage.checkIn} onSubmit={submit} className="space-y-6">
      <MoodPicker value={mood} onChange={setMood} label={t.today.checkinQuestion} size="lg" />

      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm text-muted-foreground">{t.moodPage.tagsLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {[...DEFAULT_TAGS, ...customTags].map((tag) => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(tag)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  on ? "border-primary/60 bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {tagLabel(t, tag)}
              </button>
            );
          })}
        </div>
        <div className="flex max-w-xs gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
            placeholder={t.moodPage.addTag}
            aria-label={t.moodPage.addTag}
            maxLength={24}
          />
          <Button type="button" variant="outline" onClick={addCustomTag} disabled={!newTag.trim()}>
            {t.moodPage.addTagButton}
          </Button>
        </div>
      </fieldset>

      {locked ? (
        <p className="text-sm text-muted-foreground">{t.today.noteLocked}</p>
      ) : (
        <Textarea
          aria-label={t.moodPage.noteLabel}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.today.notePlaceholder}
          rows={2}
          maxLength={280}
          className="resize-none"
        />
      )}

      <Button type="submit" disabled={!mood}>
        {t.moodPage.save}
      </Button>
    </form>
  );
}

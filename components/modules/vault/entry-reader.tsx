"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDay, formatTime } from "@mindcocoon/core/dates";
import { deleteVaultEntry, updateVaultEntry } from "@mindcocoon/core/vault/session";
import type { DecryptedJournalEntry } from "@mindcocoon/core/types";

export function EntryReader({ entry, onBack }: { entry: DecryptedJournalEntry; onBack: () => void }) {
  const { t, locale } = useI18n();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title ?? "");
  const [body, setBody] = useState(entry.body);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    await updateVaultEntry(entry.id, { title, body });
    toast.success(t.vault.updated);
    setEditing(false);
  }

  async function remove() {
    await deleteVaultEntry(entry.id);
    toast.success(t.vault.deleted);
    onBack();
  }

  return (
    <article className="space-y-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        {t.vault.backToList}
      </button>

      <p className="text-sm text-muted-foreground">
        {formatDay(new Date(entry.createdAt), locale)}, {formatTime(entry.createdAt, locale)}
      </p>

      {editing ? (
        <div className="space-y-4">
          <Input aria-label={t.vault.titleLabel} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.vault.titleLabel} />
          <Textarea aria-label={t.vault.bodyLabel} value={body} onChange={(e) => setBody(e.target.value)} className="vent-type field-sizing-content min-h-60" />
          <div className="flex gap-3">
            <Button onClick={save} disabled={!body.trim()}>
              {t.common.save}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              {t.common.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="font-serif text-3xl">{entry.title ?? t.vault.untitled}</h1>
          <p className="vent-type whitespace-pre-wrap">{entry.body}</p>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <Button variant="outline" onClick={() => setEditing(true)}>
              {t.vault.edit}
            </Button>
            {confirmDelete ? (
              <>
                <span className="text-sm text-muted-foreground">{t.vault.deleteConfirm}</span>
                <Button variant="destructive" onClick={remove}>
                  {t.common.delete}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  {t.common.cancel}
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                {t.common.delete}
              </Button>
            )}
          </div>
        </>
      )}
    </article>
  );
}

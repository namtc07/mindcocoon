"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { promptForDay } from "@mindcocoon/core/prompts";

export function ReflectionPrompt({ now }: { now: Date }) {
  const { t, locale, href } = useI18n();
  const [offset, setOffset] = useState(0);
  const prompt = promptForDay(now, locale, offset);

  return (
    <section aria-label={t.today.promptLabel}>
      <p className="max-w-[22ch] font-serif text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.18] text-balance text-foreground">
        {prompt}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <Link
          href={href(`/vent?prompt=${offset}`)}
          className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          {t.today.promptWrite}
        </Link>
        <button
          type="button"
          onClick={() => setOffset((o) => o + 1)}
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          {t.today.promptAnother}
        </button>
      </div>
    </section>
  );
}

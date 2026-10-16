"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/i18n-provider";

export default function NotFound() {
  const { t, href } = useI18n();
  return (
    <main className="mx-auto max-w-2xl px-4 py-24">
      <h1 className="font-serif text-3xl">{t.common.notFoundTitle}</h1>
      <p className="mt-3 text-muted-foreground">{t.common.notFoundBody}</p>
      <Link href={href("/")} className="mt-8 inline-block text-primary underline-offset-4 hover:underline">
        {t.common.goToday}
      </Link>
    </main>
  );
}

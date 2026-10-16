"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/components/providers/i18n-provider";

/** The quiet moment after letting go. No ads, no prompts to do more. */
export function AfterRelease({ onWriteAgain }: { onWriteAgain: () => void }) {
  const { t, href } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="flex min-h-[60vh] flex-col justify-center"
    >
      <h1 className="font-serif text-5xl text-foreground">{t.vent.releasedTitle}</h1>
      <p className="mt-4 text-muted-foreground">{t.vent.releasedBody}</p>
      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <Link
          href={href("/sanctuary")}
          className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
        >
          {t.vent.listenRain}
        </Link>
        <button
          type="button"
          onClick={onWriteAgain}
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t.vent.writeAgain}
        </button>
        <Link href={href("/")} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          {t.vent.back}
        </Link>
      </div>
    </motion.div>
  );
}

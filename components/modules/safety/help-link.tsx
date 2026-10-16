"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

/** The always-available, low-key link to support lines. */
export function HelpLink({ className }: { className?: string }) {
  const { t, href } = useI18n();
  return (
    <Link
      href={href("/help")}
      className={cn("text-muted-foreground underline-offset-4 hover:text-foreground hover:underline", className)}
    >
      {t.vent.helpLink}
    </Link>
  );
}

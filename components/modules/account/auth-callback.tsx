"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useAuth } from "@/hooks/use-auth";

/** OAuth lands here; supabase-js exchanges the PKCE code on init, then we go to Settings. */
export function AuthCallback() {
  const { t, href } = useI18n();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "signed-in" || auth.status === "signed-out" || auth.status === "disabled") {
      router.replace(href("/settings"));
    }
  }, [auth.status, href, router]);

  return <p className="py-24 text-center text-muted-foreground">{t.account.completing}</p>;
}

import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALES, resolveLocale } from "@/lib/i18n/config";

/** Sends every un-prefixed page request to its locale: "/vent" → "/vi/vent". */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;

  const locale = resolveLocale({
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
  });
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes, the service worker, the manifest and any file with an extension.
  matcher: ["/((?!_next|api|sw\\.js|manifest\\.webmanifest|.*\\..*).*)"],
};

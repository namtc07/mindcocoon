import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import { notFound } from "next/navigation";
import { TrackOpen } from "@/components/modules/analytics/track-open";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { AppShell } from "@/components/shell/app-shell";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { LOCALES, isLocale } from "@mindcocoon/core/i18n/config";
import { getDictionary } from "@mindcocoon/core/i18n/get-dictionary";
import "../globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin", "vietnamese"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.meta.title, description: t.meta.description };
}

export const viewport: Viewport = {
  themeColor: "#0F172A",
  colorScheme: "dark light",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      className={`${newsreader.variable} ${hanken.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>
          <I18nProvider locale={lang} dictionary={getDictionary(lang)}>
            <AppShell>{children}</AppShell>
            <TrackOpen />
            <Toaster position="top-center" />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

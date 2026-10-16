import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// Replaced by the Today screen in Task 6.
export default async function TodayPage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-4xl">{t.nav.today}</h1>
    </main>
  );
}

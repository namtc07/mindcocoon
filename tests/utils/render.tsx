import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nProvider } from "@/components/providers/i18n-provider";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { navigation } from "./navigation";

export { navigation };

/** Renders inside the i18n provider; `rerender` keeps the provider too. */
export function renderWithProviders(ui: ReactElement, locale: Locale = "en") {
  navigation.pathname = `/${locale}`;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nProvider locale={locale} dictionary={getDictionary(locale)}>
      {children}
    </I18nProvider>
  );
  return render(ui, { wrapper });
}

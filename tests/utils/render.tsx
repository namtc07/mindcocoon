import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nProvider } from "@/components/providers/i18n-provider";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { navigation } from "./navigation";

export { navigation };

export function renderWithProviders(ui: ReactElement, locale: Locale = "en") {
  navigation.pathname = `/${locale}`;
  return render(
    <I18nProvider locale={locale} dictionary={getDictionary(locale)}>
      {ui}
    </I18nProvider>,
  );
}

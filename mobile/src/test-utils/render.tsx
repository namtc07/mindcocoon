import { __resetMoodsForTests } from "@mindcocoon/core/mood/store";
import { setStorage } from "@mindcocoon/core/storage/index";
import { createMemoryDriver } from "@mindcocoon/core/storage/driver";
import { createLocalAdapter } from "@mindcocoon/core/storage/local";
import { __setIterationsForTests } from "@mindcocoon/core/vault/keyring";
import { __resetVaultForTests } from "@mindcocoon/core/vault/session";
import type { Locale } from "@mindcocoon/core/i18n/config";
import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setPref } from "@/lib/prefs";
import type { ThemeName } from "@/theme/tokens";

/** Fresh in-memory core storage + stores, chosen language/theme, then render. */
export async function renderWithApp(ui: ReactElement, opts: { locale?: Locale; theme?: ThemeName } = {}) {
  __setIterationsForTests(1_000);
  setStorage(createLocalAdapter(createMemoryDriver()));
  __resetVaultForTests();
  __resetMoodsForTests();
  await setPref("locale", opts.locale ?? "en");
  await setPref("theme", opts.theme ?? "dusk");
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      {ui}
    </SafeAreaProvider>,
  );
}

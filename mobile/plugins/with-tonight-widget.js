// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withEntitlementsPlist } = require("expo/config-plugins");

/**
 * Tonight widget — foundation only, honestly scoped.
 *
 * What this plugin does: adds the App Group `group.app.mindcocoon` to the iOS
 * entitlements, so the app and a future widget extension can share one small JSON
 * document: Kén's growth stage/ornament and tonight's prompt (the contract lives in
 * src/lib/widget-state-core.ts; the app refreshes it into the `widgetState` pref on
 * every Today visit).
 *
 * What it does NOT do: create the native widget target itself. A WidgetKit (iOS) /
 * AppWidget (Android) extension still has to be added (by hand in the generated
 * native projects, or with a widget config plugin) and verified with a development
 * build on the owner's Mac (`npx expo prebuild`, `npx expo run:ios`) — it cannot be
 * generated or run in CI here, so no part of this claims a working home-screen
 * widget yet. Android does not use entitlements; the same JSON contract applies
 * once an Android widget reads the shared file.
 */
const WIDGET_APP_GROUP = "group.app.mindcocoon";
const GROUPS_KEY = "com.apple.security.application-groups";

function addWidgetAppGroup(entitlements) {
  const existing = Array.isArray(entitlements[GROUPS_KEY]) ? entitlements[GROUPS_KEY] : [];
  return { ...entitlements, [GROUPS_KEY]: [...new Set([...existing, WIDGET_APP_GROUP])] };
}

const withTonightWidget = (config) =>
  withEntitlementsPlist(config, (mod) => {
    mod.modResults = addWidgetAppGroup(mod.modResults);
    return mod;
  });

module.exports = withTonightWidget;
module.exports.addWidgetAppGroup = addWidgetAppGroup;
module.exports.WIDGET_APP_GROUP = WIDGET_APP_GROUP;

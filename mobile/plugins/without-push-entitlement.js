// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withEntitlementsPlist } = require("expo/config-plugins");

/**
 * expo-notifications adds the Push Notifications entitlement (aps-environment), but the app
 * only schedules local notifications (the evening reminder). Without it the app can be signed
 * with a free Apple ID ("Personal Team"), which can't sign push. List it BEFORE expo-notifications in
 * app.json: mods run in reverse order, so it then runs after expo-notifications has added the key.
 */
function removePushEntitlement(entitlements) {
  const { "aps-environment": _push, ...rest } = entitlements;
  return rest;
}

const withoutPushEntitlement = (config) =>
  withEntitlementsPlist(config, (mod) => {
    mod.modResults = removePushEntitlement(mod.modResults);
    return mod;
  });

module.exports = withoutPushEntitlement;
module.exports.removePushEntitlement = removePushEntitlement;

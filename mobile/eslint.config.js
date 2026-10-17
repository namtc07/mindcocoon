// Mobile lint config (the web's root config ignores mobile/**).
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([expoConfig, { ignores: ["dist/*", "ios/*", "android/*", ".expo/*"] }]);

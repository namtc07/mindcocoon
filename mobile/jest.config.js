/** Component tests (React Native Testing Library under jest-expo). Pure adapter tests use Vitest. */
module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/__tests__/**/*.test.tsx"],
  setupFiles: ["<rootDir>/jest.setup.ts"],
  // Reanimated 4 / worklets ship a resolver that picks their JS (non-native) builds under Jest.
  resolver: "react-native-reanimated/jest/resolver",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  // jest-expo's list plus the ESM-only packages core uses (@scure/bip39, @noble/*, idb-keyval).
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|lucide-react-native|@scure|@noble|idb-keyval))",
    "/node_modules/react-native-reanimated/plugin/",
    "/node_modules/@react-native/babel-preset/",
  ],
};

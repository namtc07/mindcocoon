/* eslint-disable @typescript-eslint/no-require-imports */
// WebCrypto for @mindcocoon/core (the app gets it from react-native-quick-crypto).
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", { value: require("node:crypto").webcrypto });
}

jest.mock("expo-sqlite/kv-store", () => {
  const { FakeKvStore } = require("./test/fakes/expo-sqlite-kv-store");
  return { __esModule: true, default: new FakeKvStore() };
});

jest.mock("expo-secure-store", () => {
  const { FakeSecureStore, AFTER_FIRST_UNLOCK } = require("./test/fakes/expo-secure-store");
  const store = new FakeSecureStore();
  return {
    AFTER_FIRST_UNLOCK,
    getItemAsync: store.getItemAsync.bind(store),
    setItemAsync: store.setItemAsync.bind(store),
    deleteItemAsync: store.deleteItemAsync.bind(store),
    __store: store,
  };
});

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: "success" },
  ImpactFeedbackStyle: { Light: "light" },
}));

jest.mock("expo-router", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), setParams: jest.fn() };
  const Link = ({ href, children, ...rest }: { href: unknown; children: React.ReactNode }) =>
    React.createElement(Pressable, { accessibilityRole: "link", onPress: () => router.push(href), ...rest }, React.createElement(Text, null, children));
  return {
    router,
    useRouter: () => router,
    Link,
    useLocalSearchParams: jest.fn(() => ({})),
    useNavigation: () => ({ setOptions: jest.fn(), addListener: jest.fn(() => jest.fn()) }),
    useFocusEffect: (cb: () => void | (() => void)) => React.useEffect(cb, [cb]),
    Stack: { Screen: () => null },
  };
});

// Icons are decorative in tests: every lucide icon renders an empty View.
jest.mock("lucide-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  return new Proxy(
    { __esModule: true },
    { get: (target: Record<string, unknown>, name: string) => (name in target ? target[name] : () => React.createElement(View)) },
  );
});

// Reanimated's official Jest mock (animations resolve immediately; timers drive the dissolve).
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

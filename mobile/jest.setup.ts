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
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" },
  ImpactFeedbackStyle: { Light: "light" },
}));

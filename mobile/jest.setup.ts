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
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 6,
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
    usePathname: jest.fn(() => "/"),
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
// Its useSharedValue returns a new object each render; the real one is stable, so keep it per component.
jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const mock = require("react-native-reanimated/mock");
  const create = mock.useSharedValue;
  return { ...mock, useSharedValue: (init: unknown) => React.useState(() => create(init))[0] };
});

jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));

jest.mock("expo-sharing", () => ({ shareAsync: jest.fn(() => Promise.resolve()), isAvailableAsync: jest.fn(() => Promise.resolve(true)) }));
jest.mock("expo-file-system", () => {
  const written = new Map<string, string>();
  class File {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((p) => (typeof p === "string" ? p : p.uri)).join("/");
    }
    get exists() {
      return written.has(this.uri);
    }
    delete() {
      written.delete(this.uri);
    }
    async write(content: string) {
      written.set(this.uri, content);
    }
    async text() {
      return written.get(this.uri) ?? "";
    }
  }
  const cache = {
    uri: "file:///cache",
    list: () => [...written.keys()].filter((k) => k.startsWith("file:///cache/")).map((k) => new File(k)),
  };
  Object.defineProperty(File.prototype, "name", { get(this: File) { return this.uri.split("/").pop(); } });
  return { File, Paths: { cache }, __written: written };
});

// Like iOS: a modal that was shown and is now hidden reports onDismiss once its slide-out "ends".
// Tests end that animation explicitly with finishModalDismissals() (src/test-utils/modals.ts).
jest.mock("react-native/Libraries/Modal/Modal", () => {
  const React = require("react");
  const queue: (() => void)[] = [];
  function Modal(props: { visible?: boolean; onDismiss?: () => void; children?: unknown }) {
    const was = React.useRef(props.visible);
    React.useEffect(() => {
      if (was.current && !props.visible && props.onDismiss) queue.push(props.onDismiss);
      was.current = props.visible;
    }, [props.visible, props.onDismiss]);
    if (props.visible === false) return null;
    return React.createElement("Modal", props, props.children);
  }
  return { __esModule: true, default: Modal, __dismissQueue: queue };
});

// The preset mocks AppState.currentState as a function; on a device it is a string.
require("react-native").AppState.currentState = "active";

// expo-audio: fake players recorded per source (look them up with TRACK_SOURCES[id]).
jest.mock("expo-audio", () => {
  const players = new Map<unknown, Record<string, unknown>>();
  function createAudioPlayer(source: unknown) {
    type MockStatus = { playing: boolean; didJustFinish: boolean };
    let listener: ((s: MockStatus) => void) | null = null;
    const player: Record<string, unknown> & { calls: string[]; lockScreen: { active: boolean; meta?: Record<string, string> } } = {
      volume: 1,
      loop: false,
      calls: [] as string[],
      lockScreen: { active: false } as { active: boolean; meta?: Record<string, string> },
      play: jest.fn(() => player.calls.push("play")),
      pause: jest.fn(() => player.calls.push("pause")),
      seekTo: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => player.calls.push("remove")),
      setActiveForLockScreen: jest.fn((active: boolean, meta?: Record<string, string>) => {
        player.lockScreen = { active, meta };
      }),
      updateLockScreenMetadata: jest.fn((meta: Record<string, string>) => {
        if (player.lockScreen.active) player.lockScreen = { active: true, meta };
      }),
      clearLockScreenControls: jest.fn(() => {
        player.lockScreen = { active: false };
      }),
      addListener: jest.fn((_: string, cb: (s: MockStatus) => void) => {
        listener = cb;
        return { remove: () => (listener = null) };
      }),
      emit: (s: Partial<MockStatus>) => listener?.({ playing: false, didJustFinish: false, ...s }),
    };
    players.set(source, player);
    return player;
  }
  return { createAudioPlayer: jest.fn(createAudioPlayer), setAudioModeAsync: jest.fn(() => Promise.resolve()), __players: players };
});

jest.mock("expo-keep-awake", () => ({ activateKeepAwakeAsync: jest.fn(() => Promise.resolve()), deactivateKeepAwake: jest.fn(() => Promise.resolve()) }));

// The native slider: a View that forwards props, so tests can fire "valueChange".
jest.mock("@react-native-community/slider", () => {
  const React = require("react");
  const { View } = require("react-native");
  function Slider(props: { onValueChange?: (v: number) => void }) {
    return React.createElement(View, { ...props, onValueChange: props.onValueChange });
  }
  return { __esModule: true, default: Slider };
});

// AdMob: a shared fake SDK; tests drive rewarded ads through `__rewarded.emit(type, payload)`.
jest.mock("react-native-google-mobile-ads", () => {
  const React = require("react");
  const { View } = require("react-native");
  const sdk = { setRequestConfiguration: jest.fn(() => Promise.resolve()), initialize: jest.fn(() => Promise.resolve([])) };
  const rewardedListeners = new Map<string, Set<(p?: unknown) => void>>();
  const rewarded = {
    load: jest.fn(),
    show: jest.fn(() => Promise.resolve()),
    addAdEventListener: jest.fn((type: string, cb: (p?: unknown) => void) => {
      if (!rewardedListeners.has(type)) rewardedListeners.set(type, new Set());
      rewardedListeners.get(type)!.add(cb);
      return () => rewardedListeners.get(type)?.delete(cb);
    }),
    removeAllListeners: jest.fn(() => rewardedListeners.clear()),
    emit: (type: string, payload?: unknown) => [...(rewardedListeners.get(type) ?? [])].forEach((cb) => cb(payload)),
  };
  function BannerAd(props: Record<string, unknown>) {
    return React.createElement(View, { testID: "admob-banner", ...props });
  }
  return {
    __esModule: true,
    default: () => sdk,
    __sdk: sdk,
    __rewarded: rewarded,
    AdsConsent: { gatherConsent: jest.fn(() => Promise.resolve({ canRequestAds: true })) },
    MaxAdContentRating: { G: "G", PG: "PG", T: "T", MA: "MA" },
    TestIds: { ADAPTIVE_BANNER: "test-adaptive-banner", REWARDED: "test-rewarded" },
    BannerAd,
    BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: "ANCHORED_ADAPTIVE_BANNER" },
    RewardedAd: { createForAdRequest: jest.fn(() => rewarded) },
    AdEventType: { LOADED: "loaded", ERROR: "error", OPENED: "opened", CLOSED: "closed" },
    RewardedAdEventType: { LOADED: "rewarded_loaded", EARNED_REWARD: "rewarded_earned_reward" },
  };
});

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false, canAskAgain: true, status: "undetermined" })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true, status: "granted" })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("mindcocoon-evening")),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DAILY: "daily" },
  AndroidImportance: { DEFAULT: 3 },
}));

jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([2])),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

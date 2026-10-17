# M1 crypto spike — report

Date: 2026-10-17 · Build: Expo SDK 58, React Native 0.88, react-native-quick-crypto 1.1.8,
dev client on **iOS Simulator (iPhone 17 Pro, Xcode 26.3, Apple-silicon Mac)**.

The spike (`mobile/spike/run-spike.ts`) runs `@mindcocoon/core` unchanged after
`react-native-quick-crypto`'s `install()` and compares results with vectors produced by
Node WebCrypto (`packages/core/test/golden-vectors.json`, copied by
`scripts/make-crypto-vectors.mjs`).

| # | Check | iOS | Time (2nd run) |
|---|---|---|---|
| 1 | `crypto.subtle` + `getRandomValues` present | ✓ | 4 ms |
| 2 | PBKDF2-SHA256 × 310 000 equals Node's bits | ✓ | 32 ms |
| 3 | AES-GCM opens a Node-made envelope | ✓ | 3 ms |
| 4 | Encrypt → decrypt round trip, `v1.<iv>.<ct>` shape | ✓ | 1 ms |
| 5 | 12-word recovery code opens a Node-made wrap | ✓ | 27 ms |
| 6 | Vault session: device key, passcode, lock/unlock, field encryption | ✓ | 113 ms |
| 7 | Backup snapshot seal → open | ✓ | 1 ms |
| 8 | Phone → Node: envelope made on the phone decrypts in Node | ✓ | — |

Check 8, verified on the Mac:

```
$ node scripts/make-crypto-vectors.mjs --verify "v1.a+Dlc94zj+xjfXYY.r+L1zXtniiIJiH7gbcGk++PW7Jtgv8BORKI="
from-phone
```

Screenshot: `docs/mobile/m1-spike-ios.png`.

## Decision

**iOS: GO.** Formats are byte-compatible in both directions, so a journal backed up on the
web restores on a phone and vice versa. PBKDF2 timing is from the simulator (Mac CPU) and is
provisional; the native C++ implementation makes a real-device problem unlikely — re-measure
on a physical iPhone in M2.

**Android: pending** — the owner will run the same screen on an emulator
(`cd mobile && npx expo run:android`, needs Android Studio / an AVD). Expected: `ALL PASS`.
If Android fails, the fallback is `@noble/hashes` + `@noble/ciphers` behind a `CryptoProvider`
interface (separate plan).

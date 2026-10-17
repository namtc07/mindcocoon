# Mobile M4 — Native Sanctuary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Tóm tắt (VI):** Làm Nơi trú trên app: thở hộp 1 phút (Reanimated + SVG, giữ màn hình sáng khi thở), trộn âm thanh nền (4 âm miễn phí, âm lượng riêng + tổng, lặp), Nhạc của đêm nay, hẹn giờ tắt (nhỏ dần phút cuối), **nghe tiếp khi khóa máy + điều khiển ở màn hình khóa** (`expo-audio`), thanh phát mini nằm trên thanh tab (kể cả màn Trút bỏ). Âm premium + quảng cáo có thưởng để M6.

**Goal:** Sanctuary works on the phone like the web, and sound keeps playing with the screen locked on iOS and Android, controllable from the lock screen.

**Architecture:** A pure mixer engine (`src/lib/audio/engine.ts`, no React Native imports, Vitest-tested with fake players) owns all playback state; `src/lib/audio/index.ts` wires it to `expo-audio` players, the audio session and persisted prefs, and exposes the app-wide `audio` instance. UI reads it through `useAudio()` (`useSyncExternalStore`). Box-breathing geometry is a pure worklet module; the component drives it with a Reanimated shared value.

**Tech Stack:** Expo SDK 58, `expo-audio` ~58.0.9 (`createAudioPlayer`, `setAudioModeAsync`, `setActiveForLockScreen`), `@react-native-community/slider` 5.x, `expo-keep-awake` ~58.0.3, react-native-svg, Reanimated 4, jest-expo + RNTL 14, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-17-mindcocoon-mobile-design.md` (§4 Nơi trú + native background audio, §8 M4: "Nghe tiếp khi khóa máy trên cả hai nền tảng"); behaviour from `docs/superpowers/specs/2026-10-16-mindcocoon-design.md` §4.5. Web reference code: `lib/audio/engine.ts`, `components/modules/sanctuary/*`, `components/shell/mini-audio-bar.tsx`.

## Global Constraints

- All M3 constraints still hold (strings only from core dictionaries with en/vi parity; colours from `useTheme().c`; Reduce Motion respected; every pressable has role + label; 44 pt targets; no counters/streaks).
- **No ads anywhere in M4.** Breathing is an ad-free zone forever.
- Free catalogue only: ambient `AMBIENT_TRACKS` (rain, ocean, night-wind, campfire) + `MUSIC_TRACKS` from `@mindcocoon/core/sounds`. Premium tracks stay out until M6.
- Breathing timing comes from core `breathAt` / `TOTAL_MS` (4 s × 4 phases × 4 rounds) — do not re-implement.
- Sleep timer options exactly 10 / 20 / 30 / 60 minutes; fade over the final 60 s, then stop everything.
- `expo-audio` config plugin must **not** add microphone permissions: `["expo-audio", { "microphonePermission": false, "recordAudioAndroid": false, "enableBackgroundPlayback": true }]`.
- Install native packages only with `npx expo install`; install-layout guard test stays green. Run from `mobile/`: `npm run typecheck && npx expo lint && npm test`; web `npm test` at root stays green. A dev-client rebuild (`npx expo run:ios`) is needed after Task 2.
- Commit after every task, only when all three mobile commands pass (Conventional Commits + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).

## Decisions taken in this plan [Claude quyết]

- **Lock-screen controls follow one "leader" player** (expo-audio allows one lock-screen player): the first id in `playing`, else in `held`. Its metadata names the whole mix (`"Rain + Ocean"`, artist `MindCocoon`, album = `t.sanctuary.title`). Pause/play pressed on the lock screen shows up as the leader's status changing on its own; the engine turns that into `pauseAll()` / `resumeAll()` for the whole mix.
- **Audio session `interruptionMode: "doNotMix"`**, as lock-screen controls require it. Cost: starting a sound pauses other apps' music (Spotify etc.). The mode is set lazily before the first play, never at app start, so opening the app never interrupts the user's music.
- Playback state is not restored after the app is killed (volumes, master and loop are).
- Evening reminder and Face ID unlock (spec §4 "Native thêm") are not in the M4 roadmap row; they are left for a later milestone.
- The mini player shows on the tab screens (including Vent), not on Settings/Help (stack screens) — web shows it everywhere; Settings/Help are short detours.

## Review Focus

1. **Our own play/pause echoing back as a lock-screen command:** status updates that arrive while a player is still starting or stopping must not trigger `pauseAll`/`resumeAll` → Task 1 test "ignores status updates until a player settles".
2. **OS interruptions (phone call, Siri, headphones unplugged):** every player is paused by the OS → the mix becomes `held` once, the UI shows paused, Resume brings every sound back → Task 1 test "external pause of several players holds the mix once".
3. **Sleep timer while the phone is locked:** a late tick (JS throttled) must still stop immediately, and coming back to the foreground re-checks the timer → Task 1 test "late tick stops at once" + Task 2 AppState wiring test.
4. **Erase everything while sound is playing:** audio stops, lock-screen controls are cleared, volumes return to defaults → Task 2 test in `settings.test.tsx`.
5. **Leaving breathing midway** (switching tab, app to background): the exercise stops and resets, keep-awake is released → Task 4 tests.

---

## File Map

```
mobile/src/lib/audio/engine.ts        createAudioEngine(deps) — pure mixer, sleep timer, lock-screen leader, external-command sync
mobile/src/lib/audio/sources.ts       TRACK_SOURCES: id → require("…m4a") for the free catalogue
mobile/src/lib/audio/index.ts         app-wide `audio` engine wired to expo-audio + prefs + AppState; useAudio()
mobile/src/lib/breath-geometry.ts     dotPosition / innerScale worklets (pure)
mobile/assets/audio/**                copies of public/audio free tracks (placeholders; swap before launch)
mobile/src/components/sanctuary/{BoxBreathing,TonightCard,SoundMixer,SleepTimer,MiniPlayer,AudioLabelsSync}.tsx
mobile/src/app/(tabs)/sanctuary.tsx   real screen; (tabs)/_layout.tsx custom tabBar with MiniPlayer
mobile/test/{audio-engine,breath-geometry}.test.ts   Vitest
mobile/__tests__/{sanctuary,mini-player}.test.tsx    Jest
```

---

### Task 1: Pure mixer engine

**Files:** Create `mobile/src/lib/audio/engine.ts`, `mobile/test/audio-engine.test.ts`.

**Interfaces — Produces:**

```ts
export type SleepMinutes = 10 | 20 | 30 | 60;
export const SLEEP_OPTIONS: SleepMinutes[]; // [10, 20, 30, 60]
export interface AudioState { playing: string[]; held: string[]; volumes: Record<string, number>; master: number; loop: boolean; sleepEndsAt: number | null }
export interface AudioPrefs { volumes: Record<string, number>; master: number; loop: boolean }
export interface PlayerStatus { playing: boolean; didJustFinish: boolean }
export interface MixPlayer {            // the subset of expo-audio's AudioPlayer we use
  volume: number; loop: boolean;
  play(): void; pause(): void; seekTo(seconds: number): Promise<void>; remove(): void;
  setActiveForLockScreen(active: boolean, metadata?: { title?: string; artist?: string; albumTitle?: string }): void;
  updateLockScreenMetadata(metadata: { title?: string; artist?: string; albumTitle?: string }): void;
  clearLockScreenControls(): void;
  addListener(event: "playbackStatusUpdate", cb: (s: PlayerStatus) => void): { remove(): void };
}
export interface AudioEngineDeps {
  trackIds: string[];                              // ids that may be played
  createPlayer(id: string): MixPlayer;
  prepareSession(): Promise<void>;                 // called once, before the first play; a rejection fails that play
  loadPrefs(): Partial<AudioPrefs> | undefined;
  savePrefs(prefs: AudioPrefs): void;
  now?: () => number;                              // default Date.now
}
export interface AudioEngine {
  getState(): AudioState; subscribe(l: () => void): () => void;
  play(id: string): Promise<void>; pause(id: string): void; toggle(id: string): Promise<void>;
  pauseAll(): void; resumeAll(): Promise<void>; stopAll(): void;
  setTrackVolume(id: string, v: number): void; setMasterVolume(v: number): void; setLoop(loop: boolean): void;
  setSleepTimer(minutes: SleepMinutes | null): void;
  tick(): void;                                    // sleep-timer check; also called by an interval while a timer is set
  setLabels(labels: { names: Record<string, string>; album: string }): void;
  reset(): void;                                   // stop everything, drop players, back to defaults (ignores stored prefs)
}
export function createAudioEngine(deps: AudioEngineDeps): AudioEngine;
export function minutesLeft(ms: number): number;  // Math.max(1, Math.ceil(ms / 60_000))
```

Defaults as web: each volume 0.6, master 0.8, loop true. Effective volume = `clamp(volume[id] * master * fade)`. One player per id, created lazily and reused. Sleep timer: `setInterval(tick, 1000)` while set; `fade = min(1, remaining / 60_000)`; `remaining <= 0` → `stopAll()`.

**Status sync (the algorithm the tests pin):** each player record keeps `wanted: boolean` (set by engine commands) and `settled: boolean` (reset to false on every command). On a status: if `status.didJustFinish && !loop` → drop the id from `playing`. Else if `status.playing === wanted` → `settled = true`. Else if `settled` (a change the engine didn't ask for): `playing === false` → `pauseAll()`; `playing === true` and the id is in `held` → `resumeAll()`; otherwise pause that player again. Unsettled mismatches are ignored.

**Lock screen:** after every state change, leader = `playing[0] ?? held[0]`. When the leader changes: old leader `clearLockScreenControls()`, new leader `setActiveForLockScreen(true, meta)`; otherwise, if the title changed, `updateLockScreenMetadata(meta)`. No leader → clear. `meta = { title: names joined " + " (falling back to ids before setLabels), artist: "MindCocoon", albumTitle: album }`.

- [ ] **Step 1: Write the failing tests** in `test/audio-engine.test.ts` with a `FakePlayer` (records calls, `emit(status)`), fake timers, `prepareSession = vi.fn().mockResolvedValue(undefined)`:
  - `play starts a player at volume 0.6*0.8 and marks it playing`; `toggle pauses a playing track`.
  - `prepareSession runs once, before the first play`; `a failed prepareSession rolls the track back and rejects` (state.playing stays `[]`).
  - `pauseAll holds the mix and resumeAll plays it again`; `stopAll seeks every player to 0 and clears held and the sleep timer`.
  - `volume, master and loop are saved and loaded` (savePrefs called with `{volumes, master, loop}`; a second engine with that loadPrefs starts with them).
  - `sleep timer fades over the last minute and stops` (set 10 → advance 9.5 min → player.volume ≈ 0.24 (0.6 × 0.8 × fade 0.5); advance to 10 min → playing `[]`, `sleepEndsAt` null).
  - `late tick stops at once` (set 10, `now` jumps +15 min without timers firing, call `tick()` → stopped).
  - `the first playing track leads the lock screen with the mix name` (play rain, ocean after `setLabels({names:{rain:"Rain",ocean:"Ocean"}, album:"Sanctuary"})` → rain player got `setActiveForLockScreen(true, {title:"Rain", …})` then `updateLockScreenMetadata({title:"Rain + Ocean", …})`); `pausing the leader hands the lock screen to the next track`; `stopAll clears the lock screen`.
  - `ignores status updates until a player settles` (play rain, emit `{playing:false}` → still playing, no pauseAll).
  - `a lock-screen pause pauses the whole mix` (rain+ocean playing and settled; rain emits `{playing:false}` → state.held = both, ocean.pause called); `a lock-screen play resumes the whole mix`.
  - `external pause of several players holds the mix once` (both emit `{playing:false}` → held = `["rain","ocean"]`, not emptied by the second event).
  - `a finished track leaves the mix when loop is off`.
  - `reset stops, drops players and ignores stored prefs` (`remove()` called; volumes back to 0.6).
  - `minutesLeft rounds up and never shows 0`.
- [ ] **Step 2: Run** `cd mobile && npx vitest run test/audio-engine.test.ts` — Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `createAudioEngine` per the interfaces above (module has no `react-native`/`expo-*` imports).
- [ ] **Step 4: Run** the test file — Expected: PASS; then `npm run typecheck && npx expo lint && npm test` — all green.
- [ ] **Step 5: Commit** `feat(mobile): audio mixer engine with sleep timer and lock-screen sync`.

### Task 2: Native audio wiring, assets, erase integration

**Files:** Modify `mobile/package.json` / `app.json` (plugin), `mobile/jest.setup.ts`, `mobile/src/lib/prefs.ts` (`audio?: AudioPrefs`), `mobile/src/lib/export.ts` (`eraseEverything`), `mobile/src/app/_layout.tsx`; create `mobile/assets/audio/*`, `src/lib/audio/sources.ts`, `src/lib/audio/index.ts`, `src/components/sanctuary/AudioLabelsSync.tsx`; tests in `__tests__/audio-wiring.test.tsx` and `__tests__/settings.test.tsx`.

**Interfaces:**
- Consumes: `createAudioEngine`, `AudioPrefs` (Task 1).
- Produces: `TRACK_SOURCES: Record<string, number>`; `audio: AudioEngine` (app-wide); `useAudio(): AudioState`; `startAudioLifecycle(): () => void` (AppState `active` → `audio.tick()`); `<AudioLabelsSync/>` (calls `audio.setLabels({ names: t.sounds, album: t.sanctuary.title })` when the locale changes).

Wiring: `createPlayer(id) = createAudioPlayer(TRACK_SOURCES[id], { updateInterval: 500 })`; `prepareSession = () => setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" })`; prefs via `getPref("audio")` / `setPref("audio", …)`; `trackIds` = free ambient + music ids. `eraseEverything()` calls `audio.reset()` before wiping. Root layout renders `<AudioLabelsSync/>` and starts `startAudioLifecycle()` in the same effect as `appAutoLock.start()`.

- [ ] **Step 1: Failing tests.** `audio-wiring.test.tsx`: `every free ambient and music track has a bundled source`; `the audio session is set for background playback before the first sound` (`setAudioModeAsync` called with `{ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" }`); `returning to the foreground re-checks the sleep timer` (set a timer, move the clock past its end, emit AppState `active` → `audio.getState().playing` is `[]`); `labels follow the language` (render `<AudioLabelsSync/>` with locale `vi`, play rain → lock-screen title is `t.sounds.rain` in Vietnamese). `settings.test.tsx`: `erase everything stops sound and resets volumes` (play rain, set its volume 0.2, erase → nothing playing, lock screen cleared, volume 0.6).
- [ ] **Step 2: Run** `npx jest __tests__/audio-wiring.test.tsx __tests__/settings.test.tsx` — Expected: FAIL (modules missing).
- [ ] **Step 3:** `npx expo install expo-audio expo-keep-awake @react-native-community/slider`; add the plugin entry from Global Constraints; copy the free files from `public/audio` (+ `music/`) to `mobile/assets/audio`; jest mocks: `expo-audio` (`createAudioPlayer` returns a fake player recording calls into an exported `__players` map; `setAudioModeAsync` = `jest.fn(() => Promise.resolve())`), `expo-keep-awake` (`activateKeepAwakeAsync`, `deactivateKeepAwake` as `jest.fn`), slider (a `View` passing props through, so tests can `fireEvent(slider, "valueChange", 0.3)`). Then implement.
- [ ] **Step 4: Run** — Expected: PASS; `npm run typecheck && npx expo lint && npm test` green; `npx expo config --type introspect | grep -E "UIBackgroundModes|RECORD_AUDIO|NSMicrophone"` — Expected: `audio` background mode present, no microphone entries.
- [ ] **Step 5: Commit** `feat(mobile): expo-audio wiring with background playback`.

### Task 3: Sanctuary screen — tonight's music, sound mixer, sleep timer

**Files:** Create `src/components/sanctuary/{TonightCard,SoundMixer,SleepTimer}.tsx`; modify `src/app/(tabs)/sanctuary.tsx`, `src/components/Screen.tsx` (optional `scrollRef` prop); test `__tests__/sanctuary.test.tsx`.

**Interfaces:** Consumes `audio`, `useAudio`, `SLEEP_OPTIONS`, `minutesLeft`; `useMoodLogs`, `useNow`; core `pickTonightTrack`, `SOUND_TRACKS`, `AMBIENT_TRACKS`. Produces `<SleepTimer/>`, `<SoundMixer/>`, `<TonightCard now/>`; sanctuary screen sections with `testID` `section-breathe` and `section-tonight` (used by Task 5).

Port the web components one-to-one in RN: play buttons are 44 pt circles, `accessibilityRole="button"`, label `"{Play|Pause}: {name}"`, `accessibilityState.selected` when playing; per-track `Slider` (0–1, label `t.sanctuary.volumeFor`), master slider, loop `Switch` (label `t.sanctuary.loop`); sleep chips use `Chip` (Off + `t.sanctuary.minutes`), "Stops in …" line while set. A play failure shows `toast.show(t.sanctuary.playError)`. Tonight card: today's latest check-in mood → `tonightFor`, else `tonightAny`.

- [ ] **Step 1: Failing tests:** `tapping Rain plays it and the button shows Pause`; `a sound that fails to play shows a toast` (`setAudioModeAsync` rejects once); `moving a volume slider changes that track's volume`; `loop switch turns looping off`; `tonight's music follows today's check-in` (add a `heavy` mood today → card text `tonightFor` with heavy label and the picked track name from `pickTonightTrack(SOUND_TRACKS, "heavy", now)`); `choosing 20 min sets the sleep timer and shows Stops in 20 min`; `Off cancels it`.
- [ ] **Step 2: Run** `npx jest __tests__/sanctuary.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement.** Sanctuary screen order as web: title + intro, Box breathing (placeholder `View testID="section-breathe"` until Task 4), Tonight, Sounds, Sleep timer.
- [ ] **Step 4: Run** — PASS; full mobile gate green.
- [ ] **Step 5: Commit** `feat(mobile): Sanctuary mixer, tonight's music and sleep timer`.

### Task 4: Box breathing

**Files:** Create `src/lib/breath-geometry.ts`, `test/breath-geometry.test.ts`, `src/components/sanctuary/BoxBreathing.tsx`; modify sanctuary screen; tests in `__tests__/sanctuary.test.tsx`.

**Interfaces:** Produces `dotPosition(phase: BreathPhase, progress: number): {x: number; y: number}` and `innerScale(phase, progress): number` (both `"worklet"`, constants `SIZE = 220`, `PAD = 20` exported), and `breathAtWorklet(elapsedMs)` returning `{ phaseIndex: 0|1|2|3, progress }` for use on the UI thread (must agree with core `breathAt`). `<BoxBreathing/>`.

Behaviour: SVG outer rounded square (`c.border`), inner square (`c.primary`, scaled by `innerScale`) and a dot travelling the square, driven by `useSharedValue` animated with `withTiming(TOTAL_MS, { duration: TOTAL_MS, easing: Easing.linear })` and `useAnimatedProps`. Phase label (`t.sanctuary.inhale|holdIn|exhale|holdOut`) and seconds come from core `breathAt(Date.now() - startedAt)` on a 250 ms JS interval, in an `accessibilityLiveRegion="polite"` text. Button: Begin → Stop while running → Again when done (`t.sanctuary.done` shown). Reduce Motion: no dot, inner square stays still, labels still change. While running: `activateKeepAwakeAsync("breathing")`; released on stop/finish/unmount. Stops and resets on tab blur (`useFocusEffect` cleanup) and when AppState leaves `active`.

- [ ] **Step 1: Failing tests.** Vitest: `the dot climbs the left side on inhale` (`dotPosition("inhale", 0)` = `{x:20,y:200}`, `(…, 1)` = `{x:20,y:20}`); `innerScale grows on inhale and shrinks on exhale` (0.6→1, 1→0.6); `breathAtWorklet agrees with core breathAt` for 0, 3 999, 4 000, 37 500, 63 999 ms. Jest: `Begin shows Breathe in, then Hold after 4 seconds` (fake timers); `finishes with the done message and Again`; `Stop resets`; `keeps the screen awake only while breathing`; `leaving the tab stops the exercise` (run focus cleanup → button back to Begin, `deactivateKeepAwake` called); `the app going to background stops the exercise`.
- [ ] **Step 2: Run** both files — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — PASS; full mobile gate green.
- [ ] **Step 5: Commit** `feat(mobile): box breathing with keep-awake`.

### Task 5: Mini player above the tab bar + links into Sanctuary

**Files:** Create `src/components/sanctuary/MiniPlayer.tsx`, `__tests__/mini-player.test.tsx`; modify `src/app/(tabs)/_layout.tsx` (`tabBar={(props) => <><MiniPlayer/><BottomTabBar {...props}/></>}`, `BottomTabBar` from `expo-router/js-tabs`), `src/components/today/EntryLinks.tsx` (Breathe → `{ pathname: "/sanctuary", params: { section: "breathe" } }`, Tonight's music → `section: "tonight"`), sanctuary screen (scroll to the section's `onLayout` y when `section` is set on focus, then `router.setParams({ section: undefined })`).

**Interfaces:** Consumes `audio`, `useAudio`, `minutesLeft`, `useNow`. `<MiniPlayer/>` renders nothing when `playing` and `held` are empty; otherwise a `View` with `accessibilityLabel={t.sanctuary.nowPlaying}` with the mix names (pressable → `router.navigate("/sanctuary")`), a moon + minutes left when a sleep timer is set, Pause/Resume (`t.sanctuary.pauseAll|resumeAll`) and Stop (`t.sanctuary.stopAll`).

- [ ] **Step 1: Failing tests:** `hidden when nothing plays`; `shows the mix and pauses everything` (play rain + ocean → text `Rain + Ocean`; press Pause → state held both; button now Resume; press → playing again); `Stop clears it`; `shows minutes left on the sleep timer`; `names open Sanctuary`; `Today's Breathe link opens Sanctuary at breathing` (`router.push` called with `{ pathname: "/sanctuary", params: { section: "breathe" } }`); `Sanctuary scrolls to the requested section` (mock `useLocalSearchParams` → `{ section: "tonight" }`, fire `layout` on `section-tonight` with y 640 → the ScrollView's `scrollTo` called with `{ y: 640 - space.lg, animated: true }`, then `router.setParams` with `{ section: undefined }`).
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — PASS; full gate green; web `npm test` green.
- [ ] **Step 5: Commit** `feat(mobile): mini player and Sanctuary deep links`.

### Task 6: Owner checklist

**Files:** Create `docs/mobile/M4-report.md` (features, tests, known gaps, rebuild note).

Checklist (device/simulator, after `npx expo run:ios` / `run:android`): 1) play Rain + Ocean, lock the phone → keeps playing ≥ 10 min (Android too — the ~3 min background cut-off must not happen); 2) lock screen / notification shows "Rain + Ocean · MindCocoon", Pause there pauses both and the in-app bar shows Resume, Play resumes both; 3) phone call / Siri / unplugging headphones pauses everything and Resume restores the mix; 4) sleep timer 10 min with the phone locked: fades in the last minute and stops; lock screen cleared; 5) start Spotify, open MindCocoon without playing → Spotify keeps playing; play Rain → Spotify pauses (expected, `doNotMix`); 6) silent switch on (iPhone) → sound still plays; 7) breathing 64 s: screen does not dim, animation smooth on a mid-range Android, Reduce Motion shows no moving dot; 8) mini player visible on every tab including Vent and does not cover the Vent buttons; 9) Today → Breathe / Tonight's music scroll to the right section; 10) Erase everything while playing stops sound and clears the lock screen; 11) Settings → language vi → lock-screen title in Vietnamese after the next play.

- [ ] Write the report; run the full gate (mobile three commands + web `npm test`); commit `docs(mobile): M4 report and device checklist`.

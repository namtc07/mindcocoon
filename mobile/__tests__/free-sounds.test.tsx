import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import { __resetAdsForTests, startAds } from "@/lib/ads/admob";
import { audio } from "@/lib/audio";
import { setPref } from "@/lib/prefs";
import { remoteConfig } from "@/lib/remote-config";
import { renderWithApp } from "@/test-utils/render";

beforeEach(async () => {
  jest.clearAllMocks();
  __resetAdsForTests();
  await act(async () => {
    audio.reset();
    await setPref("unlocks", undefined);
    await setPref("mixes", undefined);
    await setPref("sanctuaryTab", undefined);
    // Ads and rewarded on, but sounds not locked (the default).
    await setPref("flags", { value: { adsEnabled: true, rewardedEnabled: true, quietHours: null }, fetchedAt: Date.now() });
    remoteConfig.reload();
    await startAds();
  });
});

describe("All eight sounds are free (premium_sounds_locked off)", () => {
  it("every sound is a plain tile, nothing to unlock", async () => {
    await renderWithApp(<SanctuaryScreen />, { keepState: true });
    for (const name of ["Rain", "Ocean", "Night wind", "Campfire", "Distant thunder", "Forest stream", "Singing bowl", "Deep hum"]) {
      expect(await screen.findByRole("button", { name: `Play: ${name}` })).toBeOnTheScreen();
    }
    expect(screen.queryByText("More sounds")).not.toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: /^Watch .*ad/ })).not.toBeOnTheScreen();
  });

  it("a saved mix with a former premium sound plays all of it", async () => {
    const user = userEvent.setup();
    await act(() => setPref("mixes", [{ id: "a", n: 1, mix: { volumes: { rain: 0.5, thunder: 0.5 } }, createdAt: "2026-10-18T00:00:00.000Z" }]));
    await renderWithApp(<SanctuaryScreen />, { keepState: true });
    await user.press(await screen.findByRole("button", { name: "My mix 1" }));
    await waitFor(() => expect([...audio.getState().playing].sort()).toEqual(["rain", "thunder"]));
  });
});

import { act } from "@testing-library/react-native";
import { DEFAULT_FLAGS } from "@/lib/ads/policy";
import { setPref } from "@/lib/prefs";
import { remoteConfig, startRemoteConfig } from "@/lib/remote-config";

const ON = { adsEnabled: true, rewardedEnabled: true, quietHours: [23, 5] as [number, number] };

it("uses the flags cached on this device once prefs have loaded", async () => {
  await act(() => setPref("flags", undefined));
  expect(remoteConfig.getFlags()).toEqual(DEFAULT_FLAGS);
  await act(() => setPref("flags", { value: ON, fetchedAt: Date.now() }));
  const stop = startRemoteConfig({ addEventListener: () => ({ remove() {} }) });
  await act(async () => {});
  expect(remoteConfig.getFlags()).toEqual(ON);
  stop();
});

import { initVault, setVaultPasscode } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import VentScreen from "@/app/(tabs)/vent";
import VaultScreen from "@/app/(tabs)/vault";
import SettingsScreen from "@/app/settings";
import WindDownScreen from "@/app/wind-down";
import { __resetVaultHookForTests } from "@/hooks/use-vault";
import { captureFocusEffects } from "@/test-utils/focus";
import { renderWithApp } from "@/test-utils/render";

afterEach(() => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
  jest.restoreAllMocks();
});

describe("Small fixes", () => {
  it("removing the passcode asks first", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    await renderWithApp(<></>);
    __resetVaultHookForTests();
    await act(async () => {
      await initVault();
      await setVaultPasscode("2468");
    });
    const user = userEvent.setup();
    await renderWithApp(<VaultScreen />, { keepState: true });
    await user.press(await screen.findByRole("button", { name: "Vault settings" }));
    await user.press(await screen.findByRole("button", { name: "Remove passcode" }));
    expect(alert).toHaveBeenCalledWith(
      "Remove passcode",
      "Remove the passcode? Your vault will open without one on this phone.",
      expect.any(Array),
    );
  });

  it.each(["xóa", "xoá", "xóa".normalize("NFD"), " XÓA "])("the Vietnamese erase word accepts %j", async (typed) => {
    const user = userEvent.setup();
    await renderWithApp(<SettingsScreen />, { locale: "vi" });
    await user.press(await screen.findByRole("button", { name: "Xóa toàn bộ" }));
    await user.type(screen.getByLabelText(/Gõ/), typed);
    expect(screen.getByRole("button", { name: "Xóa vĩnh viễn" })).toBeEnabled();
  });

  it("wind-down's breathing step has no duplicate Skip and no chooser text", async () => {
    const user = userEvent.setup();
    await renderWithApp(<WindDownScreen />);
    await user.press(await screen.findByRole("button", { name: "Skip" }));
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeOnTheScreen();
    expect(screen.queryByText("Pick a rhythm and how long, then follow the shape.")).not.toBeOnTheScreen();
  });

  it("Vent forgets a library prompt when you leave it", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ promptIndex: "5" });
    const focus = captureFocusEffects();
    try {
      await renderWithApp(<VentScreen />);
      await act(async () => focus.blur());
      // Vent's own route (not whatever screen is focused next).
      const { __navigation } = jest.requireMock("expo-router") as { __navigation: { setParams: jest.Mock } };
      expect(__navigation.setParams).toHaveBeenCalledWith({ prompt: undefined, promptIndex: undefined });
      expect(router.setParams).not.toHaveBeenCalled();
    } finally {
      focus.restore();
    }
  });
});

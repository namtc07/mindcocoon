import { getVaultState, initVault, lockVault, setVaultPasscode } from "@mindcocoon/core/vault/session";
import { act, fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import VaultScreen from "@/app/(tabs)/vault";
import { __resetVaultHookForTests } from "@/hooks/use-vault";
import { BIOMETRIC_KEY } from "@/lib/biometric";
import { eraseEverything } from "@/lib/export";
import { getPref, setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

const store = () => (jest.requireMock("expo-secure-store") as { __store: { data: Map<string, string>; lastOptions: unknown } }).__store;

async function setup({ passcode = true } = {}) {
  const user = userEvent.setup();
  await renderWithApp(<></>);
  __resetVaultHookForTests();
  await act(async () => {
    await setPref("biometric", undefined);
    store().data.delete(BIOMETRIC_KEY);
    await initVault();
    if (passcode) await setVaultPasscode("2468");
  });
  await renderWithApp(<VaultScreen />, { keepState: true });
  return user;
}

async function turnOn(user: ReturnType<typeof userEvent.setup>, code = "2468") {
  await user.press(await screen.findByRole("button", { name: "Vault settings" }));
  const toggle = await screen.findByRole("switch", { name: "Unlock with Face ID" });
  await act(async () => fireEvent(toggle, "valueChange", true));
  await user.type(screen.getByLabelText("Enter your passcode to turn this on"), code);
  await user.press(screen.getByRole("button", { name: "Turn on" }));
}

beforeEach(() => jest.clearAllMocks());

describe("Face ID unlock", () => {
  it("toggle appears only with a passcode and enrolled biometrics", async () => {
    const user = await setup({ passcode: false });
    await user.press(await screen.findByRole("button", { name: "Vault settings" }));
    expect(screen.queryByRole("switch", { name: "Unlock with Face ID" })).not.toBeOnTheScreen();
  });

  it("no toggle without enrolled biometrics", async () => {
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
    try {
      const user = await setup();
      await user.press(await screen.findByRole("button", { name: "Vault settings" }));
      await screen.findAllByRole("button", { name: "Lock now" });
      expect(screen.queryByRole("switch", { name: "Unlock with Face ID" })).not.toBeOnTheScreen();
    } finally {
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    }
  });

  it("turning it on needs the passcode", async () => {
    const user = await setup();
    await turnOn(user, "1111");
    expect(await screen.findByText("That passcode didn't match.")).toBeOnTheScreen();
    expect(store().data.has(BIOMETRIC_KEY)).toBe(false);
    await user.clear(screen.getByLabelText("Enter your passcode to turn this on"));
    await user.type(screen.getByLabelText("Enter your passcode to turn this on"), "2468");
    await user.press(screen.getByRole("button", { name: "Turn on" }));
    await waitFor(() => expect(store().data.get(BIOMETRIC_KEY)).toBe("2468"));
    expect(store().lastOptions).toMatchObject({ requireAuthentication: true, keychainAccessible: 6 });
    expect(getPref("biometric")).toBe(true);
  });

  it("Unlock with Face ID opens the vault", async () => {
    const user = await setup();
    await act(async () => {
      await setPref("biometric", true);
      store().data.set(BIOMETRIC_KEY, "2468");
      lockVault();
    });
    await user.press(await screen.findByRole("button", { name: "Unlock with Face ID" }));
    await waitFor(() => expect(getVaultState().status).toBe("unlocked"));
  });

  it("cancelling keeps the passcode field", async () => {
    const user = await setup();
    await act(async () => {
      await setPref("biometric", true);
      store().data.set(BIOMETRIC_KEY, "2468");
      lockVault();
    });
    jest.spyOn(SecureStore, "getItemAsync").mockRejectedValueOnce(new Error("User canceled"));
    await user.press(await screen.findByRole("button", { name: "Unlock with Face ID" }));
    expect(getVaultState().status).toBe("locked");
    expect(screen.getByLabelText("Passcode")).toBeOnTheScreen();
    expect(store().data.has(BIOMETRIC_KEY)).toBe(true);
  });

  it("changing or removing the passcode turns it off", async () => {
    const user = await setup();
    await turnOn(user);
    await waitFor(() => expect(store().data.has(BIOMETRIC_KEY)).toBe(true));
    await user.press(screen.getByRole("button", { name: "Remove passcode" }));
    await waitFor(() => expect(store().data.has(BIOMETRIC_KEY)).toBe(false));
    expect(getPref("biometric")).toBeUndefined();
  });

  it("changing the passcode turns it off", async () => {
    const user = await setup();
    await turnOn(user);
    await waitFor(() => expect(store().data.has(BIOMETRIC_KEY)).toBe(true));
    await user.press(screen.getByRole("button", { name: "Change passcode" }));
    await user.type(screen.getByLabelText("New passcode"), "1357");
    await user.type(screen.getByLabelText("Type it again"), "1357");
    await user.press(screen.getByRole("button", { name: "Save passcode" }));
    await waitFor(() => expect(store().data.has(BIOMETRIC_KEY)).toBe(false));
    expect(getPref("biometric")).toBeUndefined();
  });

  it("a stale stored passcode is deleted and falls back to the passcode field", async () => {
    const user = await setup();
    await act(async () => {
      await setPref("biometric", true);
      store().data.set(BIOMETRIC_KEY, "0000");
      lockVault();
    });
    await user.press(await screen.findByRole("button", { name: "Unlock with Face ID" }));
    expect(await screen.findByText("Couldn't use Face ID. Enter your passcode.")).toBeOnTheScreen();
    expect(store().data.has(BIOMETRIC_KEY)).toBe(false);
    expect(screen.queryByRole("button", { name: "Unlock with Face ID" })).not.toBeOnTheScreen();
    expect(getVaultState().status).toBe("locked");
  });

  it("erase everything deletes it", async () => {
    await setup();
    await act(async () => {
      await setPref("biometric", true);
      store().data.set(BIOMETRIC_KEY, "2468");
      await eraseEverything();
    });
    expect(store().data.has(BIOMETRIC_KEY)).toBe(false);
  });
});

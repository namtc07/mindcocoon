import { createMemoryDriver } from "@mindcocoon/core/storage/driver";
import { createLocalAdapter } from "@mindcocoon/core/storage/local";
import { DEVICE_RESET_WAIT_MS } from "@mindcocoon/core/vault/keyring";
import { initVault, lockVault, saveVaultEntry, setVaultPasscode, unlockWithPasscode } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import VaultScreen from "@/app/(tabs)/vault";
import { __resetVaultHookForTests } from "@/hooks/use-vault";
import { finishModalDismissals } from "@/test-utils/modals";
import { renderWithApp } from "@/test-utils/render";

async function setup() {
  const user = userEvent.setup();
  await renderWithApp(<></>);
  __resetVaultHookForTests();
  await initVault();
  await saveVaultEntry({ title: "First night", body: "hello vault" });
  await renderWithApp(<VaultScreen />, { keepState: true });
  return user;
}

async function setPasscodeViaSettings(user: ReturnType<typeof userEvent.setup>, code = "2468") {
  await user.press(await screen.findByRole("button", { name: "Vault settings" }));
  await user.press(await screen.findByRole("button", { name: "Set a passcode" }));
  await user.type(screen.getByLabelText("New passcode"), code);
  await user.type(screen.getByLabelText("Type it again"), code);
  await user.press(screen.getByRole("button", { name: "Save passcode" }));
  await waitFor(() => expect(screen.queryByLabelText("New passcode")).not.toBeOnTheScreen());
}

async function setPasscodeAndSeeCode(user: ReturnType<typeof userEvent.setup>) {
  await setPasscodeViaSettings(user);
  await finishModalDismissals();
}

afterEach(() => jest.useRealTimers());

describe("Vault", () => {
  it("lists entries", async () => {
    await setup();
    expect(await screen.findByText("First night")).toBeOnTheScreen();
  });

  it("shows a 12-word recovery code that must be acknowledged", async () => {
    const user = await setup();
    await setPasscodeViaSettings(user);
    // iOS can't present a second modal while the first is still sliding away.
    expect(screen.queryAllByTestId("recovery-word")).toHaveLength(0);
    await finishModalDismissals();
    expect(await screen.findAllByTestId("recovery-word")).toHaveLength(12);
    const done = screen.getByRole("button", { name: "Done" });
    expect(done).toBeDisabled();
    await user.press(screen.getByRole("checkbox", { name: "I've saved my recovery code" }));
    expect(done).toBeEnabled();
  });

  it("locks and unlocks with the passcode", async () => {
    const user = await setup();
    await setPasscodeAndSeeCode(user);
    await user.press(await screen.findByRole("checkbox", { name: "I've saved my recovery code" }));
    await user.press(screen.getByRole("button", { name: "Done" }));
    await user.press(await screen.findByRole("button", { name: "Lock now" }));
    expect(await screen.findByText("Your vault is locked")).toBeOnTheScreen();
    expect(screen.queryByText("First night")).not.toBeOnTheScreen();
    await user.type(screen.getByLabelText("Passcode"), "0000");
    await user.press(screen.getByRole("button", { name: "Unlock" }));
    expect(await screen.findByText("That passcode didn't match.")).toBeOnTheScreen();
    await user.clear(screen.getByLabelText("Passcode"));
    await user.type(screen.getByLabelText("Passcode"), "2468");
    await user.press(screen.getByRole("button", { name: "Unlock" }));
    expect(await screen.findByText("First night")).toBeOnTheScreen();
  });

  it("sets a new passcode after unlocking with the recovery code", async () => {
    const user = await setup();
    const { recoveryCode } = await act(() => setVaultPasscode("2468"));
    await act(async () => lockVault());
    expect(await screen.findByText("Your vault is locked")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Forgot passcode?" }));
    await user.type(await screen.findByLabelText("Recovery code"), recoveryCode!);
    await user.press(screen.getByRole("button", { name: "Continue" }));
    await user.type(await screen.findByLabelText("New passcode"), "1357");
    await user.type(screen.getByLabelText("Type it again"), "1357");
    await user.press(screen.getByRole("button", { name: "Save passcode" }));
    expect(await screen.findByText("First night")).toBeOnTheScreen();
    await act(async () => lockVault());
    expect(await act(() => unlockWithPasscode("2468"))).toBe(false);
    expect(await act(() => unlockWithPasscode("1357"))).toBe(true);
  });

  it("resets on this device only after an hour", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-17T22:00:00Z") });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<></>);
    __resetVaultHookForTests();
    await initVault();
    await saveVaultEntry({ title: "First night", body: "x" });
    await setVaultPasscode("2468");
    lockVault();
    await renderWithApp(<VaultScreen />, { keepState: true });
    await user.press(await screen.findByRole("button", { name: "Forgot passcode?" }));
    await user.press(screen.getByRole("button", { name: "Reset on this device" }));
    expect(await screen.findByText(/you can set a new passcode at/i)).toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(DEVICE_RESET_WAIT_MS - 10_000));
    expect(screen.queryByLabelText("New passcode")).not.toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(15_000));
    await user.type(await screen.findByLabelText("New passcode"), "1111");
    await user.type(screen.getByLabelText("Type it again"), "1111");
    await user.press(screen.getByRole("button", { name: "Set a new passcode" }));
    expect(await screen.findByText("First night")).toBeOnTheScreen();
  });

  it("says 'unavailable' (with retry) when the device key can't be read — never offers a reset", async () => {
    const user = userEvent.setup();
    let fail = true;
    const base = createLocalAdapter(createMemoryDriver());
    const flaky = {
      ...base,
      vaultKeys: {
        ...base.vaultKeys,
        getOrCreateDeviceKey: () => (fail ? Promise.reject(new Error("keychain busy")) : base.vaultKeys.getOrCreateDeviceKey()),
      },
    };
    __resetVaultHookForTests();
    await renderWithApp(<VaultScreen />, { storage: flaky });
    expect(await screen.findByText(/can't open your vault right now/i)).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Forgot passcode?" })).not.toBeOnTheScreen();
    fail = false;
    await user.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByText(/nothing here yet/i)).toBeOnTheScreen());
  });

  it("leaves the unavailable state when the vault opens from anywhere else", async () => {
    let fail = true;
    const base = createLocalAdapter(createMemoryDriver());
    const flaky = {
      ...base,
      vaultKeys: {
        ...base.vaultKeys,
        getOrCreateDeviceKey: () => (fail ? Promise.reject(new Error("keychain busy")) : base.vaultKeys.getOrCreateDeviceKey()),
      },
    };
    __resetVaultHookForTests();
    await renderWithApp(<VaultScreen />, { storage: flaky });
    await screen.findByText(/can't open your vault right now/i);
    fail = false;
    await act(() => initVault());
    await waitFor(() => expect(screen.getByText(/nothing here yet/i)).toBeOnTheScreen());
  });
});

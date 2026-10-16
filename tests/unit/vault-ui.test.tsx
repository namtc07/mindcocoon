import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VaultView } from "@/components/modules/vault/vault-view";
import { setStorage } from "@/lib/storage";
import { createMemoryDriver } from "@/lib/storage/driver";
import { createLocalAdapter } from "@/lib/storage/local";
import { DEVICE_RESET_WAIT_MS, __setIterationsForTests } from "@/lib/vault/keyring";
import { __resetVaultForTests, initVault, lockVault, saveVaultEntry, setVaultPasscode, unlockWithPasscode } from "@/lib/vault/session";
import { renderWithProviders } from "../utils/render";

const clock = vi.hoisted(() => ({ now: new Date("2026-10-16T22:00:00Z") }));
vi.mock("@/hooks/use-now", () => ({ useNow: () => clock.now }));

beforeEach(async () => {
  __setIterationsForTests(1_000);
  setStorage(createLocalAdapter(createMemoryDriver()));
  __resetVaultForTests();
  clock.now = new Date("2026-10-16T22:00:00Z");
  await initVault();
  await saveVaultEntry({ title: "First night", body: "hello vault" });
});

async function setPasscode(user: ReturnType<typeof userEvent.setup>, code = "2468") {
  await user.click(await screen.findByRole("button", { name: /vault settings/i }));
  await user.click(await screen.findByRole("button", { name: /set a passcode/i }));
  await user.type(screen.getByLabelText(/^new passcode/i), code);
  await user.type(screen.getByLabelText(/type it again/i), code);
  await user.click(screen.getByRole("button", { name: /^save passcode$/i }));
}

describe("Vault screen", () => {
  it("lists entries", async () => {
    renderWithProviders(<VaultView />);
    expect(await screen.findByText("First night")).toBeInTheDocument();
  });

  it("shows a 12-word recovery code that must be acknowledged", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VaultView />);
    await setPasscode(user);

    const words = await screen.findAllByTestId("recovery-word");
    expect(words).toHaveLength(12);
    const done = screen.getByRole("button", { name: /^done$/i });
    expect(done).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /i've saved my recovery code/i }));
    expect(done).toBeEnabled();
  });

  it("locks and unlocks with the passcode", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VaultView />);
    await setPasscode(user);
    await user.click(await screen.findByRole("checkbox", { name: /i've saved my recovery code/i }));
    await user.click(screen.getByRole("button", { name: /^done$/i }));

    await user.click(await screen.findByRole("button", { name: /lock now/i }));
    expect(await screen.findByText(/your vault is locked/i)).toBeInTheDocument();
    expect(screen.queryByText("First night")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/^passcode$/i), "0000");
    await user.click(screen.getByRole("button", { name: /^unlock$/i }));
    expect(await screen.findByText("That passcode didn't match.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^passcode$/i));
    await user.type(screen.getByLabelText(/^passcode$/i), "2468");
    await user.click(screen.getByRole("button", { name: /^unlock$/i }));
    expect(await screen.findByText("First night")).toBeInTheDocument();
  });

  it("resets on this device only after an hour", async () => {
    const user = userEvent.setup();
    const now = vi.spyOn(Date, "now");
    const t0 = new Date("2026-10-16T22:00:00Z").getTime();
    now.mockReturnValue(t0);

    const { rerender } = renderWithProviders(<VaultView />);
    await setPasscode(user);
    await user.click(await screen.findByRole("checkbox", { name: /i've saved my recovery code/i }));
    await user.click(screen.getByRole("button", { name: /^done$/i }));
    await user.click(await screen.findByRole("button", { name: /lock now/i }));

    await user.click(await screen.findByRole("button", { name: /forgot passcode/i }));
    await user.click(await screen.findByRole("button", { name: /reset on this device/i }));
    expect(await screen.findByText(/you can set a new passcode at/i)).toBeInTheDocument();

    clock.now = new Date(t0 + DEVICE_RESET_WAIT_MS - 1_000);
    rerender(<VaultView />);
    expect(screen.queryByLabelText(/^new passcode/i)).not.toBeInTheDocument();

    clock.now = new Date(t0 + DEVICE_RESET_WAIT_MS);
    now.mockReturnValue(t0 + DEVICE_RESET_WAIT_MS);
    rerender(<VaultView />);
    await user.type(await screen.findByLabelText(/^new passcode/i), "1111");
    await user.type(screen.getByLabelText(/type it again/i), "1111");
    await user.click(screen.getByRole("button", { name: /set a new passcode/i }));
    await waitFor(() => expect(screen.getByText("First night")).toBeInTheDocument());
  });

  it("sets a new passcode after unlocking with the recovery code", async () => {
    const user = userEvent.setup();
    const { recoveryCode } = await setVaultPasscode("2468");
    lockVault();
    renderWithProviders(<VaultView />);

    await user.click(await screen.findByRole("button", { name: /forgot passcode/i }));
    await user.type(screen.getByRole("textbox", { name: /recovery code/i }), recoveryCode!);
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    await user.type(await screen.findByLabelText(/^new passcode/i), "1357");
    await user.type(screen.getByLabelText(/type it again/i), "1357");
    await user.click(screen.getByRole("button", { name: /^save passcode$/i }));
    expect(await screen.findByText("First night")).toBeInTheDocument();

    lockVault();
    expect(await unlockWithPasscode("2468")).toBe(false);
    expect(await unlockWithPasscode("1357")).toBe(true);
  });
});

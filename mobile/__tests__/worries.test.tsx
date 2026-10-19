import { getVaultState, initVault, lockVault, setVaultPasscode } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import VentScreen from "@/app/(tabs)/vent";
import TodayScreen from "@/app/(tabs)/index";
import WorriesScreen from "@/app/worries";
import { __resetGentleCardForTests } from "@/components/safety/GentleCard";
import { ToastHost } from "@/components/ui/Toast";
import { eraseEverything } from "@/lib/export";
import { __resetWorriesForTests, addWorry, getWorries, nextMorning } from "@/lib/worries";
import { renderWithApp } from "@/test-utils/render";

const kv = () => (jest.requireMock("expo-sqlite/kv-store") as { default: { __data?: Map<string, string> } }).default;

async function fresh() {
  await renderWithApp(<></>);
  await act(() => __resetWorriesForTests());
  await act(async () => {
    await initVault();
  });
}

afterEach(() => jest.useRealTimers());

describe("Worry box", () => {
  it("next morning is 06:00 the same night or the next day", () => {
    expect(nextMorning(new Date(2026, 9, 19, 23, 10))).toEqual(new Date(2026, 9, 20, 6, 0));
    expect(nextMorning(new Date(2026, 9, 20, 1, 30))).toEqual(new Date(2026, 9, 20, 6, 0));
  });

  it("a worry is stored encrypted and waits until morning", async () => {
    await fresh();
    await act(() => addWorry("the exam tomorrow", new Date(2026, 9, 19, 23, 0)));
    const stored = JSON.stringify(await getWorries());
    expect(stored).not.toContain("the exam tomorrow");
    expect(stored).toContain("v1.");
    jest.useFakeTimers({ advanceTimers: true, now: new Date(2026, 9, 19, 23, 30) });
    await renderWithApp(<WorriesScreen />, { keepState: true });
    expect(await screen.findByText("Some worries are resting until morning.")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Read" })).not.toBeOnTheScreen();
  });

  it("Vent can set a worry down; heavy words get the gentle card first", async () => {
    await fresh();
    __resetGentleCardForTests();
    const user = userEvent.setup();
    await renderWithApp(
      <>
        <VentScreen />
        <ToastHost />
      </>,
      { keepState: true },
    );
    await user.type(screen.getByLabelText("Write what's on your mind"), "I want to die");
    await user.press(screen.getByRole("button", { name: "Set it down until tomorrow" }));
    expect(await screen.findByText(/sounds really heavy/i)).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("In the worry box until morning.")).toBeOnTheScreen();
    expect(screen.getByLabelText("Write what's on your mind")).toHaveDisplayValue("");
    expect(await getWorries()).toHaveLength(1);
  });

  it("ready worries can be let go, kept in the vault, or kept another day", async () => {
    await fresh();
    await act(async () => {
      await addWorry("first", new Date(2026, 9, 18, 23, 0));
      await addWorry("second", new Date(2026, 9, 18, 23, 5));
      await addWorry("third", new Date(2026, 9, 18, 23, 10));
    });
    jest.useFakeTimers({ advanceTimers: true, now: new Date(2026, 9, 19, 8, 0) });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<WorriesScreen />, { keepState: true });
    const reads = await screen.findAllByRole("button", { name: "Read" });
    await user.press(reads[0]);
    expect(await screen.findByText("first")).toBeOnTheScreen();
    expect(screen.getByText("Is this still heavy?")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Let it go" }));
    await waitFor(async () => expect(await getWorries()).toHaveLength(2));

    await user.press((await screen.findAllByRole("button", { name: "Read" }))[0]);
    await user.press(await screen.findByRole("button", { name: "Keep in my vault" }));
    await waitFor(() => expect(getVaultState().entries.map((e) => e.body)).toContain("second"));

    await user.press((await screen.findAllByRole("button", { name: "Read" }))[0]);
    await user.press(await screen.findByRole("button", { name: "Another day" }));
    await waitFor(async () => expect((await getWorries())[0].openAt).toBe(new Date(2026, 9, 20, 6, 0).toISOString()));
  });

  it("can't set a worry down while the vault is locked", async () => {
    await fresh();
    await act(async () => {
      await setVaultPasscode("2468");
      lockVault();
    });
    const user = userEvent.setup();
    await renderWithApp(
      <>
        <VentScreen />
        <ToastHost />
      </>,
      { keepState: true },
    );
    await user.type(screen.getByLabelText("Write what's on your mind"), "money");
    await user.press(screen.getByRole("button", { name: "Set it down until tomorrow" }));
    expect(await screen.findByText("Unlock your vault first to set a worry down.")).toBeOnTheScreen();
    expect(screen.getByLabelText("Write what's on your mind")).toHaveDisplayValue("money");
  });

  it("Today shows the line only when one is ready", async () => {
    await fresh();
    await act(() => addWorry("x", new Date(2026, 9, 18, 23, 0)));
    jest.useFakeTimers({ advanceTimers: true, now: new Date(2026, 9, 18, 23, 30) });
    await renderWithApp(<TodayScreen />, { keepState: true });
    await screen.findByText(/Vent|Let it out/);
    expect(screen.queryByText("Something you set down last night is ready to look at.")).not.toBeOnTheScreen();
    jest.useFakeTimers({ advanceTimers: true, now: new Date(2026, 9, 19, 7, 0) });
    await renderWithApp(<TodayScreen />, { keepState: true });
    expect(await screen.findByText("Something you set down last night is ready to look at.")).toBeOnTheScreen();
  });

  it("erase everything removes worries", async () => {
    await fresh();
    await act(() => addWorry("x", new Date()));
    await act(() => eraseEverything());
    expect(await getWorries()).toEqual([]);
    expect(kv()).toBeDefined();
  });
});

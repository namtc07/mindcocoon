import { getStorage } from "@mindcocoon/core/storage/index";
import { getVaultState } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import VentScreen from "@/app/(tabs)/vent";
import { __resetGentleCardForTests } from "@/components/safety/GentleCard";
import { ToastHost } from "@/components/ui/Toast";
import { finishModalDismissals } from "@/test-utils/modals";
import { renderWithApp } from "@/test-utils/render";
import { planDissolve } from "@/components/vent/Dissolve";
import { getPref, setPref } from "@/lib/prefs";
import * as Reanimated from "react-native-reanimated";
import { createMemoryDriver } from "@mindcocoon/core/storage/driver";
import { createLocalAdapter } from "@mindcocoon/core/storage/local";

const SECRET = "secret words nobody should keep";

async function setup() {
  jest.useFakeTimers();
  __resetGentleCardForTests();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  await renderWithApp(
    <>
      <VentScreen />
      <ToastHost />
    </>,
  );
  return user;
}

afterEach(() => jest.useRealTimers());

describe("Vent", () => {
  it("releases text into the void without a trace", async () => {
    const user = await setup();
    await user.type(screen.getByLabelText("Write what's on your mind"), SECRET);
    await user.press(screen.getByRole("button", { name: "Release into the void" }));
    await act(async () => jest.advanceTimersByTime(4_000));
    expect(await screen.findByText("Let go.")).toBeOnTheScreen();
    expect(await getStorage().journal.list()).toEqual([]);
    expect(screen.queryByText(new RegExp(SECRET))).not.toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Write again" }));
    expect(screen.getByLabelText("Write what's on your mind")).toHaveDisplayValue("");
  });

  it("disables both actions while empty", async () => {
    await setup();
    expect(screen.getByRole("button", { name: "Release into the void" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save to vault" })).toBeDisabled();
  });

  it("offers support once before releasing heavy words", async () => {
    const user = await setup();
    const editor = screen.getByLabelText("Write what's on your mind");
    await user.type(editor, "khong muon song nua");
    await user.press(screen.getByRole("button", { name: "Release into the void" }));
    expect(await screen.findByText(/sounds really heavy/i)).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Continue releasing" }));
    await act(async () => jest.advanceTimersByTime(4_000));
    await user.press(await screen.findByRole("button", { name: "Write again" }));

    await user.type(screen.getByLabelText("Write what's on your mind"), "I want to die");
    await user.press(screen.getByRole("button", { name: "Release into the void" }));
    expect(screen.queryByText(/sounds really heavy/i)).not.toBeOnTheScreen();
  });

  it("saves to the vault encrypted", async () => {
    const user = await setup();
    await user.type(screen.getByLabelText("Write what's on your mind"), SECRET);
    await user.press(screen.getByRole("button", { name: "Save to vault" }));
    await user.type(await screen.findByLabelText("Title (optional)"), "t");
    await user.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(async () => expect(await getStorage().journal.list()).toHaveLength(1));
    const [stored] = await getStorage().journal.list();
    expect(stored.content).toMatch(/^v1\./);
    expect(JSON.stringify(stored)).not.toContain("secret words");
    expect(getVaultState().entries[0]).toMatchObject({ title: "t", body: SECRET });
    expect(await screen.findByText("Saved to your vault")).toBeOnTheScreen();
    expect(screen.getByLabelText("Write what's on your mind")).toHaveDisplayValue("");
  });

  it("opens the save sheet only after the gentle card has gone", async () => {
    const user = await setup();
    await user.type(screen.getByLabelText("Write what's on your mind"), "I want to die");
    await user.press(screen.getByRole("button", { name: "Save to vault" }));
    await user.press(await screen.findByRole("button", { name: "Continue saving" }));
    expect(screen.queryByLabelText("Title (optional)")).not.toBeOnTheScreen();
    await finishModalDismissals();
    expect(await screen.findByLabelText("Title (optional)")).toBeOnTheScreen();
  });

  it("says so when saving fails, and keeps the words", async () => {
    jest.useFakeTimers();
    __resetGentleCardForTests();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const base = createLocalAdapter(createMemoryDriver());
    const broken = { ...base, journal: { ...base.journal, put: () => Promise.reject(new Error("disk full")) } };
    await renderWithApp(
      <>
        <VentScreen />
        <ToastHost />
      </>,
      { storage: broken },
    );
    await user.type(screen.getByLabelText("Write what's on your mind"), SECRET);
    await user.press(screen.getByRole("button", { name: "Save to vault" }));
    await user.press(await screen.findByRole("button", { name: "Save" }));
    expect(await screen.findByText(/can't open your vault right now/i)).toBeOnTheScreen();
    expect(screen.getByLabelText("Write what's on your mind")).toHaveDisplayValue(SECRET);
  });

  it("covers what is being written when the app goes to the background", async () => {
    let handler: ((s: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, fn) => {
      handler = fn as (s: AppStateStatus) => void;
      return { remove: () => {} };
    });
    const user = await setup();
    await user.type(screen.getByLabelText("Write what's on your mind"), SECRET);
    const state = jest.replaceProperty(AppState, "currentState", "inactive");
    await act(async () => handler?.("inactive"));
    expect(screen.getByLabelText("Hidden while you're away")).toBeOnTheScreen();
    state.replaceValue("active");
    await act(async () => handler?.("active"));
    expect(screen.queryByLabelText("Hidden while you're away")).not.toBeOnTheScreen();
  });

  describe("ways to let go", () => {
    afterEach(async () => {
      await act(() => setPref("ritual", undefined));
    });

    it("each ritual has its own motion; only burning leaves embers", () => {
      const text = "one two three four five six";
      const words = (r: Parameters<typeof planDissolve>[1]) => planDissolve(text, r).tokens.filter((t) => t.text.trim());
      expect(planDissolve(text, "burn").embers.length).toBeGreaterThan(0);
      expect(words("burn").every((t) => t.dy < 0)).toBe(true);
      for (const r of ["float", "scatter", "fade"] as const) expect(planDissolve(text, r).embers).toEqual([]);
      expect(words("float").every((t) => t.dy > 0 && t.dx > 0)).toBe(true);
      expect(words("scatter").every((t) => Math.abs(t.dx) >= 120)).toBe(true);
      expect(words("fade").every((t) => t.dx === 0 && t.rotate === 0)).toBe(true);
    });

    it.each([
      ["Burn", "burn"],
      ["Float away", "float"],
      ["Scatter in the wind", "scatter"],
      ["Fade into the night", "fade"],
    ])("%s releases and clears the text", async (label, id) => {
      const user = await setup();
      await user.press(screen.getByRole("button", { name: label }));
      expect(getPref("ritual")).toBe(id);
      await user.type(screen.getByLabelText("Write what's on your mind"), SECRET);
      await user.press(screen.getByRole("button", { name: "Release into the void" }));
      await act(async () => jest.advanceTimersByTime(4_500));
      expect(await screen.findByText("Let go.")).toBeOnTheScreen();
      expect(screen.queryByText(new RegExp(SECRET))).not.toBeOnTheScreen();
    });

    it("the chosen ritual is remembered", async () => {
      await act(() => setPref("ritual", "scatter"));
      await setup();
      expect(screen.getByRole("button", { name: "Scatter in the wind" })).toBeSelected();
      expect(screen.getByRole("button", { name: "Burn" })).not.toBeSelected();
    });

    it("Reduce Motion uses the short fade for every ritual", async () => {
      const reduce = jest.spyOn(Reanimated, "useReducedMotion").mockReturnValue(true);
      try {
        await act(() => setPref("ritual", "float"));
        const user = await setup();
        await user.type(screen.getByLabelText("Write what's on your mind"), SECRET);
        await user.press(screen.getByRole("button", { name: "Release into the void" }));
        await act(async () => jest.advanceTimersByTime(700));
        expect(await screen.findByText("Let go.")).toBeOnTheScreen();
      } finally {
        reduce.mockRestore();
      }
    });
  });
});

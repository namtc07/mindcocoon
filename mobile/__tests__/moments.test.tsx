import { addMood } from "@mindcocoon/core/mood/store";
import { initVault } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import TodayScreen from "@/app/(tabs)/index";
import MoodScreen from "@/app/(tabs)/mood";
import MomentsScreen from "@/app/moments";
import PracticeScreen from "@/app/practices/[id]";
import { eraseEverything } from "@/lib/export";
import { moments } from "@/lib/moments";
import { setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

const DAY = 24 * 3600_000;

async function fresh() {
  jest.clearAllMocks();
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
  await renderWithApp(<></>);
  await act(async () => {
    await moments.__reset();
    await initVault();
    await setPref("momentShownOn", undefined);
  });
}

describe("A jar of light moments", () => {
  it("lives on the Mood tab", async () => {
    await fresh();
    const user = userEvent.setup();
    await renderWithApp(<MoodScreen />, { keepState: true });
    await user.press(screen.getByRole("button", { name: "Open the jar" }));
    expect(router.push).toHaveBeenCalledWith("/moments");
  });

  it("a moment is kept encrypted", async () => {
    await fresh();
    const user = userEvent.setup();
    await renderWithApp(<MomentsScreen />, { keepState: true });
    await user.type(screen.getByLabelText("A small good moment"), "Tea with mum on the balcony");
    await user.press(screen.getByRole("button", { name: "Put it in the jar" }));
    const stored = JSON.stringify(await moments.list());
    expect(stored).toContain("v1.");
    expect(stored).not.toContain("balcony");
    expect(await screen.findByText("Tea with mum on the balcony")).toBeOnTheScreen();
  });

  it("three good things can go into the jar", async () => {
    await fresh();
    const user = userEvent.setup();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "three-good-things" });
    await renderWithApp(<PracticeScreen />, { keepState: true });
    const fields = () => screen.queryByLabelText("Your answer");
    for (let i = 0; i < 8 && !screen.queryByRole("button", { name: "Finish" }); i++) {
      if (fields()) await user.type(fields()!, `good thing ${i}`);
      await user.press(screen.getByRole("button", { name: "Next" }));
    }
    await user.press(screen.getByRole("button", { name: "Finish" }));
    await user.press(await screen.findByRole("button", { name: "Put them in the jar" }));
    expect((await moments.list()).length).toBeGreaterThan(0);
  });

  it("on a heavy day, Kén brings one back (once a day), never on a light day", async () => {
    await fresh();
    const user = userEvent.setup();
    await act(async () => {
      await moments.add("The sea at Quy Nhơn", new Date(Date.now() - 10 * DAY));
      await addMood({ mood: "heavy", tags: [] });
    });
    await renderWithApp(<TodayScreen />, { keepState: true });
    await user.press(await screen.findByRole("button", { name: "Kén found something you kept" }));
    expect(await screen.findByText("The sea at Quy Nhơn")).toBeOnTheScreen();
    await renderWithApp(<TodayScreen />, { keepState: true });
    expect(screen.queryByRole("button", { name: "Kén found something you kept" })).not.toBeOnTheScreen();
  });

  it("nothing is brought back on a light day", async () => {
    await fresh();
    await act(async () => {
      await moments.add("The sea at Quy Nhơn", new Date(Date.now() - 10 * DAY));
      await addMood({ mood: "joyful", tags: [] });
    });
    await renderWithApp(<TodayScreen />, { keepState: true });
    await screen.findByText(/Today: Joyful/);
    expect(screen.queryByRole("button", { name: "Kén found something you kept" })).not.toBeOnTheScreen();
  });

  it("erase everything empties the jar", async () => {
    await fresh();
    await act(() => moments.add("x", new Date()));
    await act(() => eraseEverything());
    expect(await moments.list()).toEqual([]);
  });
});

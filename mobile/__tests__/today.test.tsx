import * as moodStore from "@mindcocoon/core/mood/store";
import { changeMood, getMoodState, readNote } from "@mindcocoon/core/mood/store";
import { getStorage } from "@mindcocoon/core/storage/index";
import { initVault, lockVault, setVaultPasscode } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import TodayScreen from "@/app/(tabs)/index";
import { renderWithApp } from "@/test-utils/render";

type User = ReturnType<typeof userEvent.setup>;

/** Choose a mood, then Save (choosing alone saves nothing). */
async function checkIn(user: User, mood: string) {
  await user.press(await screen.findByRole("radio", { name: mood }));
  await user.press(screen.getByRole("button", { name: "Save" }));
  await screen.findByText(`Today: ${mood}`);
}

async function addNote(user: User, mood: string, note: string) {
  await checkIn(user, mood);
  await user.press(await screen.findByRole("button", { name: "Add tags or a note" }));
  await user.type(screen.getByLabelText("A few words, if you want"), note);
}

const stored = async () => (await getStorage().moods.list()).map((l) => l.mood);

afterEach(() => jest.useRealTimers());

describe("Today", () => {
  it("choosing a mood saves nothing until Save", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await user.press(await screen.findByRole("radio", { name: "Heavy" }));
    expect(screen.getByRole("radio", { name: "Heavy" })).toBeChecked();
    expect(await stored()).toEqual([]);
  });

  it("Save and Cancel appear only after choosing; Cancel lets it go", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await screen.findByRole("radio", { name: "Heavy" });
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeOnTheScreen();
    await user.press(screen.getByRole("radio", { name: "Heavy" }));
    await user.press(screen.getByRole("button", { name: "sad" }));
    await user.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("radio", { name: "Heavy" })).not.toBeChecked();
    expect(screen.queryByText("More precisely?")).not.toBeOnTheScreen();
    expect(await stored()).toEqual([]);
  });

  it("Save keeps the check-in and folds the picker into one line", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await checkIn(user, "Heavy");
    expect(await stored()).toEqual(["heavy"]);
    expect(screen.getByText("Saved for today")).toBeOnTheScreen();
    expect(screen.queryByRole("radio")).not.toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Change" })).toBeOnTheScreen();
  });

  it("Change reopens the picker; Cancel keeps what was saved", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await checkIn(user, "Heavy");
    await user.press(screen.getByRole("button", { name: "Change" }));
    expect(screen.getByRole("radio", { name: "Heavy" })).toBeChecked();
    await user.press(screen.getByRole("radio", { name: "Peaceful" }));
    await user.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Today: Heavy")).toBeOnTheScreen();
    expect(await stored()).toEqual(["heavy"]);
  });

  it("if saving fails, says so and keeps the choice to try again", async () => {
    const user = userEvent.setup();
    const add = jest.spyOn(moodStore, "addMood").mockRejectedValueOnce(new Error("disk full"));
    try {
      await renderWithApp(<TodayScreen />);
      await user.press(await screen.findByRole("radio", { name: "Heavy" }));
      await user.press(screen.getByRole("button", { name: "sad" }));
      await user.press(screen.getByRole("button", { name: "Save" }));
      expect(await screen.findByText(/can't open your vault right now/)).toBeOnTheScreen();
      expect(screen.getByRole("radio", { name: "Heavy" })).toBeChecked();
      expect(screen.getByRole("button", { name: "sad" })).toBeSelected();
      await user.press(screen.getByRole("button", { name: "Save" }));
      await screen.findByText("Today: Heavy");
    } finally {
      add.mockRestore();
    }
  });

  it("encrypts a note added right after launch", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await addNote(user, "Heavy", "long day");
    await user.press(screen.getByRole("button", { name: "Save details" }));
    expect(await screen.findByText("Details saved")).toBeOnTheScreen();
    const [log] = await getStorage().moods.list();
    expect(log.note).toMatch(/^v1\./);
    expect(await readNote(log)).toBe("long day");
  });

  it("keeps the note when the mood changes", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await addNote(user, "Heavy", "long day");
    await user.press(screen.getByRole("button", { name: "Save details" }));
    await screen.findByText("Details saved");
    await user.press(screen.getByRole("button", { name: "Change" }));
    await user.press(screen.getByRole("radio", { name: "Peaceful" }));
    await user.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(async () => {
      const logs = await getStorage().moods.list();
      expect(logs.map((l) => l.mood)).toEqual(["peaceful"]);
      expect(await readNote(logs[0])).toBe("long day");
    });
  });

  it("asks for the passcode to add a note while the vault is locked", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await initVault();
    await setVaultPasscode("2468");
    lockVault();
    await addNote(user, "Anxious", "exam");
    await user.type(await screen.findByLabelText("Passcode"), "2468");
    await user.press(screen.getByRole("button", { name: "Save details" }));
    expect(await screen.findByText("Details saved")).toBeOnTheScreen();
    expect(await readNote((await getStorage().moods.list())[0])).toBe("exam");
  });

  it("adds details to the same check-in (same id and time)", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await checkIn(user, "Heavy");
    await waitFor(async () => expect(await getStorage().moods.list()).toHaveLength(1));
    const [first] = await getStorage().moods.list();
    await user.press(screen.getByRole("button", { name: "Add tags or a note" }));
    await user.type(screen.getByLabelText("A few words, if you want"), "long day");
    await user.press(screen.getByRole("button", { name: "Save details" }));
    await screen.findByText("Details saved");
    const logs = await getStorage().moods.list();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ id: first.id, createdAt: first.createdAt });
    // The plaintext note is not kept around in the form afterwards.
    await user.press(screen.getByRole("button", { name: "Add tags or a note" }));
    expect(screen.getByLabelText("A few words, if you want")).toHaveDisplayValue("");
  });

  it("never touches yesterday's check-in when the app stays open overnight", async () => {
    jest.useFakeTimers({ now: new Date(2026, 9, 17, 23, 0) });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithApp(<TodayScreen />);
    await checkIn(user, "Heavy");
    await act(async () => {
      jest.setSystemTime(new Date(2026, 9, 18, 21, 0));
      jest.advanceTimersByTime(6_000);
    });
    await checkIn(user, "Peaceful");
    await waitFor(async () => expect((await stored()).sort()).toEqual(["heavy", "peaceful"]));
    jest.useRealTimers();
  });

  it("opens Vent with today's prompt", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await user.press(await screen.findByRole("button", { name: "Write about this" }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/vent", params: { prompt: "0" } });
  });

  describe("feeling words", () => {
    it("words picked before Save are saved with the mood", async () => {
      const user = userEvent.setup();
      await renderWithApp(<TodayScreen />);
      await user.press(await screen.findByRole("radio", { name: "Heavy" }));
      expect(await screen.findByText("More precisely?")).toBeOnTheScreen();
      await user.press(screen.getByRole("button", { name: "lonely" }));
      expect(screen.getByRole("button", { name: "lonely" })).toBeSelected();
      expect(await stored()).toEqual([]);
      await user.press(screen.getByRole("button", { name: "Save" }));
      await waitFor(async () => expect((await getStorage().moods.list())[0].feelings).toEqual(["lonely"]));
      expect(screen.getByText("lonely")).toBeOnTheScreen();
    });

    it("at most three words", async () => {
      const user = userEvent.setup();
      await renderWithApp(<TodayScreen />);
      await user.press(await screen.findByRole("radio", { name: "Heavy" }));
      for (const w of ["lonely", "sad", "hurt", "exhausted"]) await user.press(await screen.findByRole("button", { name: w }));
      expect(screen.getByRole("button", { name: "exhausted" })).not.toBeSelected();
      await user.press(screen.getByRole("button", { name: "Save" }));
      await waitFor(async () => expect((await getStorage().moods.list())[0].feelings).toEqual(["lonely", "sad", "hurt"]));
    });

    it("changing the mood shows that mood's words and drops the old ones", async () => {
      const user = userEvent.setup();
      await renderWithApp(<TodayScreen />);
      await user.press(await screen.findByRole("radio", { name: "Heavy" }));
      await user.press(await screen.findByRole("button", { name: "lonely" }));
      await user.press(screen.getByRole("radio", { name: "Anxious" }));
      expect(await screen.findByRole("button", { name: "worried" })).toBeOnTheScreen();
      expect(screen.queryByRole("button", { name: "lonely" })).not.toBeOnTheScreen();
      await user.press(screen.getByRole("button", { name: "Save" }));
      await waitFor(async () => expect((await getStorage().moods.list())[0].feelings ?? []).toEqual([]));
    });

    it("changing a saved check-in keeps its words when the mood stays", async () => {
      const user = userEvent.setup();
      await renderWithApp(<TodayScreen />);
      await user.press(await screen.findByRole("radio", { name: "Heavy" }));
      await user.press(await screen.findByRole("button", { name: "sad" }));
      await user.press(screen.getByRole("button", { name: "Save" }));
      await screen.findByText("Today: Heavy");
      await user.press(screen.getByRole("button", { name: "Change" }));
      expect(screen.getByRole("button", { name: "sad" })).toBeSelected();
      await user.press(screen.getByRole("button", { name: "hurt" }));
      await user.press(screen.getByRole("button", { name: "Save" }));
      await waitFor(async () => expect((await getStorage().moods.list())[0].feelings).toEqual(["sad", "hurt"]));
      expect(await getStorage().moods.list()).toHaveLength(1);
    });
  });

  it("going to another mood and back keeps today's saved words", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await user.press(await screen.findByRole("radio", { name: "Heavy" }));
    await user.press(screen.getByRole("button", { name: "sad" }));
    await user.press(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Today: Heavy");
    await user.press(screen.getByRole("button", { name: "Change" }));
    await user.press(screen.getByRole("radio", { name: "Anxious" }));
    await user.press(screen.getByRole("radio", { name: "Heavy" }));
    expect(screen.getByRole("button", { name: "sad" })).toBeSelected();
  });

  it("follows a check-in changed elsewhere (e.g. wind-down)", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await checkIn(user, "Heavy");
    await waitFor(() => expect(getMoodState().logs).toHaveLength(1));
    await act(async () => {
      await changeMood(getMoodState().logs[0], "anxious");
    });
    expect(await screen.findByText("Today: Anxious")).toBeOnTheScreen();
  });
});

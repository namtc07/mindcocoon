import { readNote } from "@mindcocoon/core/mood/store";
import { getStorage } from "@mindcocoon/core/storage/index";
import { initVault, lockVault, setVaultPasscode } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import TodayScreen from "@/app/(tabs)/index";
import { renderWithApp } from "@/test-utils/render";

async function addNote(user: ReturnType<typeof userEvent.setup>, mood: string, note: string) {
  await user.press(await screen.findByRole("radio", { name: mood }));
  await user.press(await screen.findByRole("button", { name: "Add tags or a note" }));
  await user.type(screen.getByLabelText("A few words, if you want"), note);
}

afterEach(() => jest.useRealTimers());

describe("Today", () => {
  it("saves a mood with one tap", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await user.press(await screen.findByRole("radio", { name: "Heavy" }));
    await waitFor(async () => expect((await getStorage().moods.list()).map((l) => l.mood)).toEqual(["heavy"]));
    expect(await screen.findByText("Saved for today")).toBeOnTheScreen();
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
    await user.press(screen.getByRole("radio", { name: "Peaceful" }));
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
    await user.press(await screen.findByRole("radio", { name: "Heavy" }));
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
    await user.press(await screen.findByRole("radio", { name: "Heavy" }));
    await waitFor(async () => expect(await getStorage().moods.list()).toHaveLength(1));
    await act(async () => {
      jest.setSystemTime(new Date(2026, 9, 18, 21, 0));
      jest.advanceTimersByTime(6_000);
    });
    await user.press(screen.getByRole("radio", { name: "Peaceful" }));
    await waitFor(async () => expect((await getStorage().moods.list()).map((l) => l.mood).sort()).toEqual(["heavy", "peaceful"]));
    jest.useRealTimers();
  });

  it("opens Vent with today's prompt", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await user.press(await screen.findByRole("button", { name: "Write about this" }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/vent", params: { prompt: "0" } });
  });

  describe("feeling words", () => {
    it("picking a feeling word after a quick check-in saves it", async () => {
      const user = userEvent.setup();
      await renderWithApp(<TodayScreen />);
      await user.press(await screen.findByRole("radio", { name: "Heavy" }));
      expect(await screen.findByText("More precisely?")).toBeOnTheScreen();
      await user.press(screen.getByRole("button", { name: "lonely" }));
      await waitFor(async () => expect((await getStorage().moods.list())[0].feelings).toEqual(["lonely"]));
      expect(screen.getByRole("button", { name: "lonely" })).toBeSelected();
    });

    it("at most three words", async () => {
      const user = userEvent.setup();
      await renderWithApp(<TodayScreen />);
      await user.press(await screen.findByRole("radio", { name: "Heavy" }));
      for (const w of ["lonely", "sad", "hurt", "exhausted"]) await user.press(await screen.findByRole("button", { name: w }));
      await waitFor(async () => expect((await getStorage().moods.list())[0].feelings).toEqual(["lonely", "sad", "hurt"]));
      expect(screen.getByRole("button", { name: "exhausted" })).not.toBeSelected();
    });

    it("changing the mood shows that mood's words and drops the old ones", async () => {
      const user = userEvent.setup();
      await renderWithApp(<TodayScreen />);
      await user.press(await screen.findByRole("radio", { name: "Heavy" }));
      await user.press(await screen.findByRole("button", { name: "lonely" }));
      await user.press(screen.getByRole("radio", { name: "Anxious" }));
      expect(await screen.findByRole("button", { name: "worried" })).toBeOnTheScreen();
      expect(screen.queryByRole("button", { name: "lonely" })).not.toBeOnTheScreen();
      await waitFor(async () => expect((await getStorage().moods.list())[0].feelings).toBeUndefined());
    });
  });
});

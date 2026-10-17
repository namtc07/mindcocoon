import { readNote } from "@mindcocoon/core/mood/store";
import { getStorage } from "@mindcocoon/core/storage/index";
import { initVault, lockVault, setVaultPasscode } from "@mindcocoon/core/vault/session";
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import TodayScreen from "@/app/(tabs)/index";
import { renderWithApp } from "@/test-utils/render";

async function addNote(user: ReturnType<typeof userEvent.setup>, mood: string, note: string) {
  await user.press(await screen.findByRole("radio", { name: mood }));
  await user.press(await screen.findByRole("button", { name: "Add tags or a note" }));
  await user.type(screen.getByLabelText("A few words, if you want"), note);
}

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

  it("opens Vent with today's prompt", async () => {
    const user = userEvent.setup();
    await renderWithApp(<TodayScreen />);
    await user.press(await screen.findByRole("button", { name: "Write about this" }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/vent", params: { prompt: "0" } });
  });
});

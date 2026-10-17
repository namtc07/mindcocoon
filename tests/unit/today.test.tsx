import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TodayView } from "@/components/modules/today/today-view";
import { __resetMoodsForTests } from "@mindcocoon/core/mood/store";
import { getStorage, setStorage } from "@mindcocoon/core/storage/index";
import { createMemoryDriver } from "@mindcocoon/core/storage/driver";
import { createLocalAdapter } from "@mindcocoon/core/storage/local";
import { readNote } from "@mindcocoon/core/mood/store";
import { __setIterationsForTests } from "@mindcocoon/core/vault/keyring";
import { __resetVaultForTests, initVault, lockVault, setVaultPasscode } from "@mindcocoon/core/vault/session";
import { renderWithProviders } from "../utils/render";

beforeEach(() => {
  setStorage(createLocalAdapter(createMemoryDriver()));
  __resetMoodsForTests();
  __resetVaultForTests();
});

describe("Today", () => {
  it("saves a mood with one tap", async () => {
    renderWithProviders(<TodayView />);
    await userEvent.click(await screen.findByRole("radio", { name: /heavy/i }));
    await waitFor(async () => {
      const logs = await getStorage().moods.list();
      expect(logs.map((l) => l.mood)).toEqual(["heavy"]);
    });
    expect(await screen.findByText("Saved for today")).toBeInTheDocument();
  });

  it("shows today's prompt in Vietnamese", async () => {
    renderWithProviders(<TodayView />, "vi");
    expect(await screen.findByRole("link", { name: "Viết về điều này" })).toBeInTheDocument();
  });

  it("gently suggests talking to someone after a heavy week", async () => {
    localStorage.removeItem("mc:heavy-nudge");
    for (let i = 0; i < 7; i++) {
      await getStorage().moods.add({
        id: `h${i}`,
        mood: "heavy",
        tags: [],
        createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
      });
    }
    renderWithProviders(<TodayView />);
    expect(await screen.findByText(/these last days seem heavy/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see who you can talk to/i })).toHaveAttribute("href", "/en/help");
    expect(localStorage.getItem("mc:heavy-nudge")).not.toBeNull();
  });

  it("stays quiet without a heavy week", async () => {
    renderWithProviders(<TodayView />);
    await screen.findByRole("radiogroup");
    expect(screen.queryByText(/these last days seem heavy/i)).not.toBeInTheDocument();
  });

  it("adds a note right after launch when there is no passcode", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodayView />);
    await user.click(await screen.findByRole("radio", { name: /heavy/i }));
    await user.click(await screen.findByRole("button", { name: /add tags or a note/i }));
    await user.type(screen.getByPlaceholderText(/a few words/i), "long day");
    await user.click(screen.getByRole("button", { name: /save details/i }));
    expect(await screen.findByText("Details saved")).toBeInTheDocument();
    const [log] = await getStorage().moods.list();
    expect(log.note).toMatch(/^v1\./);
    expect(await readNote(log)).toBe("long day");
  });

  it("keeps the note when the mood is changed afterwards", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodayView />);
    await user.click(await screen.findByRole("radio", { name: /heavy/i }));
    await user.click(await screen.findByRole("button", { name: /add tags or a note/i }));
    await user.type(screen.getByPlaceholderText(/a few words/i), "long day");
    await user.click(screen.getByRole("button", { name: /save details/i }));
    await screen.findByText("Details saved");

    await user.click(screen.getByRole("radio", { name: /peaceful/i }));
    await waitFor(async () => {
      const logs = await getStorage().moods.list();
      expect(logs.map((l) => l.mood)).toEqual(["peaceful"]);
      expect(await readNote(logs[0])).toBe("long day");
    });
  });

  it("asks for the passcode to add a note while the vault is locked", async () => {
    __setIterationsForTests(1_000);
    await initVault();
    await setVaultPasscode("2468");
    lockVault();
    const user = userEvent.setup();
    renderWithProviders(<TodayView />);
    await user.click(await screen.findByRole("radio", { name: /anxious/i }));
    await user.click(await screen.findByRole("button", { name: /add tags or a note/i }));
    await user.type(screen.getByPlaceholderText(/a few words/i), "exam");
    await user.type(screen.getByLabelText(/^passcode$/i), "2468");
    await user.click(screen.getByRole("button", { name: /save details/i }));
    expect(await screen.findByText("Details saved")).toBeInTheDocument();
    const [log] = await getStorage().moods.list();
    expect(await readNote(log)).toBe("exam");
  });
});

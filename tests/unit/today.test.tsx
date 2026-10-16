import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TodayView } from "@/components/modules/today/today-view";
import { __resetMoodsForTests } from "@/lib/mood/store";
import { getStorage, setStorage } from "@/lib/storage";
import { createMemoryDriver } from "@/lib/storage/driver";
import { createLocalAdapter } from "@/lib/storage/local";
import { __resetVaultForTests } from "@/lib/vault/session";
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
});

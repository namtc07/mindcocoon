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
});

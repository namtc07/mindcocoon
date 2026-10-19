import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { MoodView } from "@/components/modules/mood/mood-view";
import { __resetMoodsForTests } from "@mindcocoon/core/mood/store";
import { setStorage } from "@mindcocoon/core/storage/index";
import { createMemoryDriver } from "@mindcocoon/core/storage/driver";
import { createLocalAdapter } from "@mindcocoon/core/storage/local";
import { __setIterationsForTests } from "@mindcocoon/core/vault/keyring";
import { __resetVaultForTests, initVault } from "@mindcocoon/core/vault/session";
import { renderWithProviders } from "../utils/render";

beforeEach(async () => {
  __setIterationsForTests(1_000);
  setStorage(createLocalAdapter(createMemoryDriver()));
  __resetVaultForTests();
  __resetMoodsForTests();
  localStorage.clear();
  await initVault();
});

async function checkIn(user: ReturnType<typeof userEvent.setup>) {
  const form = await screen.findByRole("form", { name: /check in/i });
  await user.click(within(form).getByRole("radio", { name: "Anxious" }));
  await user.click(within(form).getByRole("button", { name: "Work" }));
  await user.click(within(form).getByRole("button", { name: "Study" }));
  await user.type(within(form).getByRole("textbox", { name: /note/i }), "exam");
  await user.click(within(form).getByRole("button", { name: /save check-in/i }));
}

describe("Mood journey", () => {
  it("shows a check-in on the week strip, the month map and the day detail", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MoodView />);
    await checkIn(user);

    const week = await screen.findByRole("list", { name: /this week/i });
    await waitFor(() => {
      const items = within(week).getAllByRole("listitem");
      expect(items[6].querySelector("[data-mood]")).toHaveAttribute("data-mood", "anxious");
    });

    const todayCell = await screen.findByRole("button", { name: /anxious/i, description: /today/i });
    await user.click(todayCell);
    expect(await screen.findByText("exam")).toBeInTheDocument();
    expect(screen.getAllByText("Study").length).toBeGreaterThan(0);
  });

  it("keeps a legend for all ten moods", async () => {
    renderWithProviders(<MoodView />);
    const legend = await screen.findByRole("list", { name: /legend/i });
    expect(within(legend).getAllByRole("listitem")).toHaveLength(10);
  });

  it("removes a check-in from history", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MoodView />);
    await checkIn(user);
    const history = await screen.findByRole("list", { name: /history/i });
    await user.click(within(history).getByRole("button", { name: /delete/i }));
    await waitFor(() => {
      const week = screen.getByRole("list", { name: /this week/i });
      expect(within(week).getAllByRole("listitem")[6].querySelector("[data-mood]")).toBeNull();
    });
  });
});

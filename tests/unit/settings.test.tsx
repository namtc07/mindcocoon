import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsView } from "@/components/modules/settings/settings-view";
import { buildExport } from "@/lib/data";
import { __resetMoodsForTests, addMood, loadMoods } from "@/lib/mood/store";
import { getStorage, setStorage } from "@/lib/storage";
import { createMemoryDriver } from "@/lib/storage/driver";
import { createLocalAdapter } from "@/lib/storage/local";
import { __setIterationsForTests } from "@/lib/vault/keyring";
import { __resetVaultForTests, initVault, saveVaultEntry } from "@/lib/vault/session";
import { renderWithProviders } from "../utils/render";

vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "dark", setTheme: vi.fn() }) }));

beforeEach(async () => {
  __setIterationsForTests(1_000);
  setStorage(createLocalAdapter(createMemoryDriver()));
  __resetVaultForTests();
  __resetMoodsForTests();
  localStorage.clear();
  await initVault();
  await loadMoods();
  await saveVaultEntry({ title: "Private", body: "only mine" });
  await addMood({ mood: "numb", tags: ["work"], note: "quiet" });
});

describe("data export", () => {
  it("keeps journal entries and notes encrypted", async () => {
    const file = await buildExport();
    expect(file.journal).toHaveLength(1);
    expect(file.journal[0].content).toMatch(/^v1\./);
    expect(file.moods[0].note).toMatch(/^v1\./);
    expect(JSON.stringify(file)).not.toContain("only mine");
    expect(JSON.stringify(file)).not.toContain("quiet");
  });
});

describe("Settings", () => {
  it("erases everything only after typing the confirmation word", async () => {
    const reload = vi.fn();
    const user = userEvent.setup();
    localStorage.setItem("mc:first-run-seen", "1");
    renderWithProviders(<SettingsView onErased={reload} />);

    await user.click(await screen.findByRole("button", { name: /erase everything/i }));
    const confirm = screen.getByRole("button", { name: /erase permanently/i });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /type erase/i }), "eras");
    expect(confirm).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /type erase/i }), "e");
    await user.click(confirm);

    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(await getStorage().journal.list()).toEqual([]);
    expect(await getStorage().moods.list()).toEqual([]);
    expect(localStorage.getItem("mc:first-run-seen")).toBeNull();
  });

  it("switches language", async () => {
    const user = userEvent.setup();
    const { navigation } = await import("../utils/navigation");
    renderWithProviders(<SettingsView onErased={vi.fn()} />);
    await user.click(await screen.findByRole("radio", { name: "Tiếng Việt" }));
    expect(navigation.router.replace).toHaveBeenCalledWith("/vi");
  });
});

import { addMood } from "@mindcocoon/core/mood/store";
import { getStorage } from "@mindcocoon/core/storage/index";
import { initVault, saveVaultEntry } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import SettingsScreen from "@/app/settings";
import { FirstRunNotice } from "@/components/FirstRunNotice";
import { createMobileAdapter } from "@/lib/storage";
import { getEraseCount } from "@/lib/export";
import { clearPrefs, getPref, setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

const secureStore = () => (jest.requireMock("expo-secure-store") as { __store: { data: Map<string, string> } }).__store.data;

async function seed() {
  await renderWithApp(<></>, { storage: createMobileAdapter() });
  await act(async () => {
    await initVault();
    await saveVaultEntry({ title: "t", body: "private words" });
    await addMood({ mood: "heavy", tags: ["work"], note: "secret note" });
  });
}

describe("Settings", () => {
  it("exports a JSON copy where journal and notes stay encrypted", async () => {
    const user = userEvent.setup();
    const written = (FileSystem as unknown as { __written: Map<string, string> }).__written;
    let text = "";
    (Sharing.shareAsync as jest.Mock).mockImplementationOnce(async (u: string) => {
      text = written.get(u) ?? "";
    });
    await seed();
    await renderWithApp(<SettingsScreen />, { keepState: true });
    await user.press(await screen.findByRole("button", { name: "Download a copy" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalled());
    const uri = (Sharing.shareAsync as jest.Mock).mock.calls[0][0] as string;
    const file = JSON.parse(text);
    expect(file).toMatchObject({ app: "MindCocoon", version: 1 });
    expect(file.journal).toHaveLength(1);
    expect(text).not.toContain("private words");
    expect(text).not.toContain("secret note");
    expect(file.moods[0].note).toMatch(/^v1\./);
    // The readable copy doesn't linger in the cache once shared.
    await waitFor(() => expect(written.has(uri)).toBe(false));
  });

  it("erases everything only after typing the word", async () => {
    const user = userEvent.setup();
    await seed();
    await setPref("customTags", ["Exams"]);
    const keyBefore = [...secureStore().values()][0];
    expect(keyBefore).toBeTruthy();
    const erasesBefore = getEraseCount();
    await renderWithApp(<SettingsScreen />, { keepState: true });
    await user.press(await screen.findByRole("button", { name: "Erase everything" }));
    const confirm = screen.getByRole("button", { name: "Erase permanently" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText("Type erase to confirm"), "erase");
    await user.press(confirm);
    // The whole app remounts (fresh tabs, drafts and forms), back on Today.
    await waitFor(() => expect(getEraseCount()).toBe(erasesBefore + 1));
    expect(await getStorage().journal.list()).toEqual([]);
    expect(await getStorage().moods.list()).toEqual([]);
    expect([...secureStore().values()]).not.toContain(keyBefore);
    expect(getPref("customTags")).toBeUndefined();
  });
});

describe("First-run notice", () => {
  it("shows once", async () => {
    const user = userEvent.setup();
    await renderWithApp(<FirstRunNotice />);
    await setPref("firstRunSeen", undefined);
    await renderWithApp(<FirstRunNotice />);
    await user.press(await screen.findByRole("button", { name: "Got it" }));
    expect(getPref("firstRunSeen")).toBe(true);
    await renderWithApp(<FirstRunNotice />);
    expect(screen.queryByText("Welcome to MindCocoon")).not.toBeOnTheScreen();
    await act(() => clearPrefs());
    expect(await screen.findByText("Welcome to MindCocoon")).toBeOnTheScreen();
  });
});

import { addMood } from "@mindcocoon/core/mood/store";
import { initVault } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent } from "@testing-library/react-native";
import TodayScreen from "@/app/(tabs)/index";
import FutureLettersScreen from "@/app/future-letters";
import { eraseEverything } from "@/lib/export";
import { futureLetters, isOpenable } from "@/lib/future-letters";
import { renderWithApp } from "@/test-utils/render";

const DAY = 24 * 3600_000;

async function fresh() {
  await renderWithApp(<></>);
  await act(async () => {
    await futureLetters.__reset();
    await initVault();
  });
}

describe("Letters to your future self", () => {
  it("a letter is sealed (encrypted, not shown) until its day", async () => {
    await fresh();
    const user = userEvent.setup();
    await renderWithApp(<FutureLettersScreen />, { keepState: true });
    await user.type(screen.getByLabelText("Your letter"), "Dear me, you got through October.");
    await user.press(screen.getByRole("radio", { name: "In a month" }));
    await user.press(screen.getByRole("button", { name: "Seal the letter" }));
    const stored = JSON.stringify(await futureLetters.list());
    expect(stored).toContain("v1.");
    expect(stored).not.toContain("October");
    expect(await screen.findByText(/Sealed until/)).toBeOnTheScreen();
    expect(screen.queryByText("Dear me, you got through October.")).not.toBeOnTheScreen();
  });

  it("when its day comes, Today says a letter is ready, and it can be read", async () => {
    await fresh();
    const user = userEvent.setup();
    await act(() => futureLetters.add({ text: "Hello from the past", when: "week" }, new Date(Date.now() - 8 * DAY)));
    await renderWithApp(<TodayScreen />, { keepState: true });
    expect(await screen.findByText("A letter from you is ready")).toBeOnTheScreen();
    await renderWithApp(<FutureLettersScreen />, { keepState: true });
    await user.press(screen.getByRole("button", { name: "Open the letter" }));
    expect(await screen.findByText("Hello from the past")).toBeOnTheScreen();
  });

  it("“when I have a hard week” opens after a run of low days", async () => {
    await fresh();
    await act(() => futureLetters.add({ text: "You've done this before.", when: "hard-week" }, new Date(Date.now() - 20 * DAY)));
    const [letter] = await futureLetters.list();
    const now = new Date();
    const lowLogs = [1, 2, 3, 4].map((d) => ({ id: `l${d}`, mood: "heavy" as const, tags: [], createdAt: new Date(now.getTime() - d * DAY).toISOString() }));
    expect(isOpenable(letter, now, [])).toBe(false);
    expect(isOpenable(letter, now, lowLogs)).toBe(true);
    await act(async () => {
      await addMood({ mood: "heavy", tags: [] });
    });
  });

  it("erase everything removes letters", async () => {
    await fresh();
    await act(() => futureLetters.add({ text: "x", when: "week" }, new Date()));
    await act(() => eraseEverything());
    expect(await futureLetters.list()).toEqual([]);
  });
});

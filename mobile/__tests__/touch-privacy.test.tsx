import { act, screen, userEvent } from "@testing-library/react-native";
import { AppState, Text, type AppStateStatus } from "react-native";
import { FeelingChips } from "@/components/mood/FeelingChips";
import { PrivacyCover } from "@/components/PrivacyCover";
import { HeavyNudge } from "@/components/safety/HeavyNudge";
import { BoxBreathing } from "@/components/sanctuary/BoxBreathing";
import { Screen } from "@/components/Screen";
import { setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

const flat = (style: unknown) => Object.assign({}, ...[style].flat(5).filter(Boolean));

describe("Privacy, keyboard and touch", () => {
  it("the whole app is covered in the app switcher", async () => {
    const prop = jest.replaceProperty(AppState, "currentState", "inactive");
    await renderWithApp(<PrivacyCover />);
    expect(screen.getByLabelText("Hidden while MindCocoon is in the background")).toBeOnTheScreen();
    prop.restore();
  });

  it("nothing covers the app while it's in use", async () => {
    await renderWithApp(<PrivacyCover />);
    expect(screen.queryByLabelText("Hidden while MindCocoon is in the background")).not.toBeOnTheScreen();
  });

  it("screens keep the field you're typing in above the keyboard", async () => {
    await renderWithApp(
      <Screen title="x">
        <Text>body</Text>
      </Screen>,
    );
    const view = screen.getByTestId("screen-scroll");
    expect(view.props.keyboardShouldPersistTaps).toBe("handled");
    expect(view.props.automaticallyAdjustKeyboardInsets).toBe(true);
  });

  it("pulling down Control Center doesn't end the breathing exercise", async () => {
    let handler: ((s: AppStateStatus) => void) | undefined;
    const original = AppState.addEventListener;
    AppState.addEventListener = ((_t: string, fn: (s: AppStateStatus) => void) => {
      handler = fn;
      return { remove: () => {} };
    }) as unknown as typeof AppState.addEventListener;
    try {
      const user = userEvent.setup();
      await renderWithApp(<BoxBreathing />);
      await user.press(screen.getByRole("button", { name: "Begin" }));
      await act(async () => handler?.("inactive"));
      expect(screen.getByRole("button", { name: "Stop" })).toBeOnTheScreen();
      await act(async () => handler?.("background"));
      expect(screen.getByRole("button", { name: "Begin" })).toBeOnTheScreen();
    } finally {
      AppState.addEventListener = original;
    }
  });

  it("the heavy-week nudge has comfortable touch targets", async () => {
    await act(() => setPref("heavyNudgeAt", undefined));
    const { addMood } = jest.requireActual("@mindcocoon/core/mood/store") as typeof import("@mindcocoon/core/mood/store");
    const { getStorage } = jest.requireActual("@mindcocoon/core/storage/index") as typeof import("@mindcocoon/core/storage/index");
    const { loadMoods } = jest.requireActual("@mindcocoon/core/mood/store") as typeof import("@mindcocoon/core/mood/store");
    const { initVault } = jest.requireActual("@mindcocoon/core/vault/session") as typeof import("@mindcocoon/core/vault/session");
    await renderWithApp(<></>);
    await act(async () => {
      await initVault();
      for (let i = 0; i < 7; i++) await addMood({ mood: "heavy", tags: [] });
      const logs = await getStorage().moods.list();
      await getStorage().moods.replaceAll(logs.map((l, i) => ({ ...l, createdAt: new Date(Date.now() - i * 86_400_000).toISOString() })));
      await loadMoods(true);
    });
    await renderWithApp(<HeavyNudge now={new Date()} />, { keepState: true });
    const dismiss = await screen.findByRole("button");
    expect(flat(dismiss.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(flat(screen.getByRole("link").props.style).minHeight).toBeGreaterThanOrEqual(44);
  });

  it("the fourth feeling word is shown as unavailable", async () => {
    await renderWithApp(<FeelingChips mood="heavy" value={["lonely", "sad", "hurt"]} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "exhausted" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "lonely" })).toBeEnabled();
  });
});

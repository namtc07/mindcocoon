import { getStorage } from "@mindcocoon/core/storage/index";
import { getVaultState, initVault } from "@mindcocoon/core/vault/session";
import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { AccessibilityInfo } from "react-native";
import { __resetGentleCardForTests } from "@/components/safety/GentleCard";
import PracticeScreen from "@/app/practices/[id]";
import PracticesScreen from "@/app/practices/index";
import { ToastHost } from "@/components/ui/Toast";
import { captureFocusEffects } from "@/test-utils/focus";
import { finishModalDismissals } from "@/test-utils/modals";
import { renderWithApp } from "@/test-utils/render";

async function openPractice(id: string) {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id });
  const user = userEvent.setup();
  await renderWithApp(<></>);
  await act(() => initVault());
  await renderWithApp(
    <>
      <PracticeScreen />
      <ToastHost />
    </>,
    { keepState: true },
  );
  return user;
}

afterEach(() => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
  jest.clearAllMocks();
});

describe("Gentle practices", () => {
  it("the list shows four practices with their minutes", async () => {
    const user = userEvent.setup();
    await renderWithApp(<PracticesScreen />);
    expect(screen.getByText("5-4-3-2-1 grounding")).toBeOnTheScreen();
    expect(screen.getByText("Body scan")).toBeOnTheScreen();
    expect(screen.getByText("Three good things")).toBeOnTheScreen();
    expect(screen.getByText("A kind letter to yourself")).toBeOnTheScreen();
    expect(screen.getAllByText("4 min").length).toBeGreaterThan(0);
    await user.press(screen.getByRole("button", { name: /Body scan/ }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/practices/[id]", params: { id: "body-scan" } });
  });

  it("grounding walks through its steps and finishes", async () => {
    const user = await openPractice("grounding");
    expect(screen.getByText(/There's no wrong way/)).toBeOnTheScreen();
    for (let i = 0; i < 6; i++) await user.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/That's enough/)).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Finish" }));
    expect(router.back).toHaveBeenCalled();
    expect(screen.queryByText(/\d+ ?\/ ?\d+/)).not.toBeOnTheScreen();
  });

  it("Back returns to the previous step", async () => {
    const user = await openPractice("grounding");
    await user.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/five things you can see/)).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText(/There's no wrong way/)).toBeOnTheScreen();
  });

  async function writeThreeThings(user: ReturnType<typeof userEvent.setup>) {
    await user.press(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByLabelText("Your answer"), "warm tea");
    await user.press(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByLabelText("Your answer"), "a call with mum");
    await user.press(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByLabelText("Your answer"), "the rain");
    await user.press(screen.getByRole("button", { name: "Next" }));
    await user.press(screen.getByRole("button", { name: "Finish" }));
  }

  it("three good things kept in the vault is encrypted", async () => {
    const user = await openPractice("three-good-things");
    await writeThreeThings(user);
    expect(screen.getByText("Keep what you wrote?")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Keep in my vault" }));
    await user.press(await screen.findByRole("button", { name: "Save" }));
    await waitFor(() => expect(getVaultState().entries).toHaveLength(1));
    expect(getVaultState().entries[0].body).toContain("warm tea");
    const [stored] = await getStorage().journal.list();
    expect(stored.content).toMatch(/^v1\./);
    expect(stored.isEncrypted).toBe(true);
    expect(JSON.stringify(stored)).not.toContain("warm tea");
    await finishModalDismissals();
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it("let it go stores nothing", async () => {
    const user = await openPractice("three-good-things");
    await writeThreeThings(user);
    await user.press(screen.getByRole("button", { name: "Let it go" }));
    expect(router.back).toHaveBeenCalled();
    expect(await getStorage().journal.list()).toEqual([]);
  });

  it("leaving the practice clears what was typed", async () => {
    const focus = captureFocusEffects();
    try {
      const user = await openPractice("kind-letter");
      await user.press(screen.getByRole("button", { name: "Next" }));
      await user.type(screen.getByLabelText("Your answer"), "dear me");
      await act(async () => focus.blur());
      expect(screen.queryByDisplayValue("dear me")).not.toBeOnTheScreen();
      expect(screen.getByText(/You don't have to fix it/)).toBeOnTheScreen();
    } finally {
      focus.restore();
    }
  });

  it("a timed step lets the screen sleep once its time is up", async () => {
    jest.useFakeTimers();
    try {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "body-scan" });
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await renderWithApp(<PracticeScreen />);
      await user.press(screen.getByRole("button", { name: "Next" }));
      expect(activateKeepAwakeAsync).toHaveBeenCalledWith("practice");
      expect(deactivateKeepAwake).not.toHaveBeenCalled();
      await act(async () => jest.advanceTimersByTime(31_000));
      expect(deactivateKeepAwake).toHaveBeenCalledWith("practice");
    } finally {
      jest.useRealTimers();
    }
  });

  it("heavy words in a practice get the same gentle card and help link as Vent", async () => {
    __resetGentleCardForTests();
    const user = await openPractice("kind-letter");
    await user.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("link", { name: "Need to talk to someone now?" })).toBeOnTheScreen();
    await user.type(screen.getByLabelText("Your answer"), "I want to die");
    await user.press(screen.getByRole("button", { name: "Next" }));
    await user.press(screen.getByRole("button", { name: "Finish" }));
    expect(await screen.findByText(/sounds really heavy/i)).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Keep what you wrote?")).toBeOnTheScreen();
  });

  it("VoiceOver hears each new step", async () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
    try {
      const user = await openPractice("grounding");
      await user.press(screen.getByRole("button", { name: "Next" }));
      expect(announce).toHaveBeenLastCalledWith(expect.stringMatching(/five things you can see/));
    } finally {
      announce.mockRestore();
    }
  });
});

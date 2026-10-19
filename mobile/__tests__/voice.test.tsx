import { act, screen, userEvent } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import SettingsScreen from "@/app/settings";
import PracticeScreen from "@/app/practices/[id]";
import StoryScreen from "@/app/stories/[id]";
import SanctuaryScreen from "@/app/(tabs)/sanctuary";
import { BoxBreathing } from "@/components/sanctuary/BoxBreathing";
import { getPref, setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";
import { fireEvent } from "@testing-library/react-native";

const said = () => (jest.requireMock("expo-speech") as { __said: { text: string }[] }).__said.map((s) => s.text);
const finish = () => (jest.requireMock("expo-speech") as { __finish: () => void }).__finish();

beforeEach(async () => {
  jest.clearAllMocks();
  await act(async () => {
    await setPref("voiceGuide", undefined);
    await setPref("breathing", undefined);
    await setPref("sanctuaryTab", undefined);
  });
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
});

describe("Voice guidance", () => {
  it("is off until turned on in Settings", async () => {
    await renderWithApp(<SettingsScreen />);
    const toggle = screen.getByRole("switch", { name: "Voice guidance" });
    expect(toggle.props.value).toBe(false);
    await act(async () => fireEvent(toggle, "valueChange", true));
    expect(getPref("voiceGuide")).toBe(true);
  });

  it("breathing says each phase out loud when on", async () => {
    jest.useFakeTimers();
    try {
      await act(() => setPref("voiceGuide", true));
      await renderWithApp(<BoxBreathing />, { keepState: true });
      await act(async () => fireEvent.press(screen.getByRole("button", { name: "Begin" })));
      await act(async () => jest.advanceTimersByTime(4_300));
      expect((Speech.speak as jest.Mock).mock.calls.map(([text]) => text)).toEqual(["Breathe in", "Hold"]);
      await act(async () => fireEvent.press(screen.getByRole("button", { name: "Stop" })));
      expect(Speech.stop).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("breathing stays silent when off", async () => {
    jest.useFakeTimers();
    try {
      await renderWithApp(<BoxBreathing />);
      await act(async () => fireEvent.press(screen.getByRole("button", { name: "Begin" })));
      await act(async () => jest.advanceTimersByTime(4_300));
      expect(Speech.speak).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("a practice reads each step aloud when on, in the app's language", async () => {
    const user = userEvent.setup();
    await act(() => setPref("voiceGuide", true));
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "grounding" });
    await renderWithApp(<PracticeScreen />, { keepState: true });
    expect(Speech.speak).toHaveBeenLastCalledWith(expect.stringContaining("no wrong way"), expect.objectContaining({ language: "en-US" }));
    await user.press(screen.getByRole("button", { name: "Next" }));
    expect(Speech.speak).toHaveBeenLastCalledWith(expect.stringContaining("five things you can see"), expect.anything());
  });
});

describe("Sleep stories", () => {
  it("are listed in Sanctuary's Practices part", async () => {
    const user = userEvent.setup();
    await renderWithApp(<SanctuaryScreen />);
    await user.press(screen.getByRole("tab", { name: "Practices" }));
    expect(screen.getByRole("header", { name: "Sleep stories" })).toBeOnTheScreen();
    expect(screen.getByRole("link", { name: /The lighthouse keeper's cat/ })).toBeOnTheScreen();
  });

  it("Read to me reads the story paragraph by paragraph, and Stop ends it", async () => {
    const user = userEvent.setup();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "lighthouse" });
    await renderWithApp(<StoryScreen />);
    await user.press(screen.getByRole("button", { name: "Read to me" }));
    expect(said()).toHaveLength(1);
    const first = said()[0];
    await act(async () => finish());
    expect(said()).toHaveLength(1);
    expect(said()[0]).not.toBe(first);
    await user.press(screen.getByRole("button", { name: "Stop reading" }));
    expect(Speech.stop).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Read to me" })).toBeOnTheScreen();
  });

  it("works without voice guidance turned on (reading is the point)", async () => {
    const user = userEvent.setup();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "lighthouse" });
    await renderWithApp(<StoryScreen />);
    await user.press(screen.getByRole("button", { name: "Read to me" }));
    expect(Speech.speak).toHaveBeenCalled();
  });
});

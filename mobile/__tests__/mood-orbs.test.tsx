import { act, fireEvent, screen, userEvent } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import * as Reanimated from "react-native-reanimated";
import { ScrollView } from "react-native";
import TodayScreen from "@/app/(tabs)/index";
import { FeelingChips } from "@/components/mood/FeelingChips";
import type { MoodType } from "@mindcocoon/core/types";
import { useState } from "react";
import { ARC_MIDDLE, middleOf, MoodPicker } from "@/components/mood/MoodPicker";
import { setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";
import { readableFill } from "@/theme/contrast";
import { tokens } from "@/theme/tokens";

describe("Mood orbs", () => {
  it("keeps the five radio names and the selection", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderWithApp(<MoodPicker variant="orbs" value="heavy" onChange={onChange} label="How are you?" />);
    // RNTL cannot query the radiogroup role on a plain View (like listitem); its label still names the group.
    expect(screen.getByLabelText("How are you?")).toHaveProp("accessibilityRole", "radiogroup");
    expect(screen.getByRole("radio", { name: "Heavy" })).toBeChecked();
    await user.press(screen.getByRole("radio", { name: "Anxious" }));
    expect(onChange).toHaveBeenCalledWith("anxious");
  });

  it("lies in one arc from heavier to lighter, not a grid", async () => {
    await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={() => {}} label="How are you?" />);
    expect(screen.getAllByRole("radio").map((r) => r.props.accessibilityLabel)).toEqual([
      "Angry", "Confused", "Anxious", "Lonely", "Heavy", "Numb", "Peaceful", "Hopeful", "Thankful", "Joyful",
    ]);
    expect(screen.queryByText("More energy", { includeHiddenElements: true })).toBeNull();
    expect(screen.queryByText("Pleasant", { includeHiddenElements: true })).toBeNull();
  });

  it("tapping an orb chooses it and glides it to the middle of the arc", async () => {
    const user = userEvent.setup();
    const timing = jest.spyOn(Reanimated, "withTiming");
    const onChange = jest.fn();
    try {
      await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={onChange} label="How are you?" />);
      await user.press(screen.getByRole("radio", { name: "Hopeful" }));
      expect(onChange).toHaveBeenCalledWith("hopeful");
      // An eased glide to Hopeful's slot in the middle copy (the arc repeats the ten moods).
      expect(timing).toHaveBeenCalledWith((ARC_MIDDLE * 10 + 7) * 76, expect.objectContaining({ duration: expect.any(Number) }), expect.any(Function));
    } finally {
      timing.mockRestore();
    }
  });

  it("under Reduce Motion it moves straight there", async () => {
    const user = userEvent.setup();
    const scrollTo = ScrollView.prototype.scrollTo as unknown as jest.Mock;
    const reduce = jest.spyOn(Reanimated, "useReducedMotion").mockReturnValue(true);
    try {
      await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={() => {}} label="How are you?" />);
      scrollTo.mockClear();
      await user.press(screen.getByRole("radio", { name: "Hopeful" }));
      expect(scrollTo).toHaveBeenLastCalledWith({ x: (ARC_MIDDLE * 10 + 7) * 76, animated: false });
    } finally {
      reduce.mockRestore();
    }
  });

  it("choosing a mood just past the seam (Joyful → Angry) swaps copies on the UI thread, never by a JS jump", async () => {
    const user = userEvent.setup();
    const jsScroll = ScrollView.prototype.scrollTo as unknown as jest.Mock;
    const uiScroll = jest.spyOn(Reanimated, "scrollTo");
    function Harness() {
      const [value, setValue] = useState<MoodType | null>(null);
      return <MoodPicker variant="orbs" value={value} onChange={setValue} label="How are you?" />;
    }
    try {
      await renderWithApp(<Harness />);
      await act(async () => fireEvent(screen.getByTestId("feeling-orbs"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 200 } } }));
      const nextCopyAngry = screen.getAllByRole("radio", { name: "Angry", includeHiddenElements: true })[ARC_MIDDLE + 1];
      jsScroll.mockClear();
      await user.press(nextCopyAngry);
      expect(screen.getAllByRole("radio", { name: "Angry" })[0]).toBeChecked();
      expect(uiScroll).toHaveBeenCalledWith(expect.anything(), ARC_MIDDLE * 10 * 76, 0, false);
      expect(jsScroll).not.toHaveBeenCalled();
    } finally {
      uiScroll.mockRestore();
    }
  });

  it("a glide cut short (a finger takes over) neither chooses nor jumps", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const uiScroll = jest.spyOn(Reanimated, "scrollTo");
    // The glide is interrupted: Reanimated reports finished = false.
    const timing = jest.spyOn(Reanimated, "withTiming").mockImplementationOnce(((to: number, _c: unknown, cb?: (f: boolean) => void) => {
      cb?.(false);
      return to;
    }) as never);
    try {
      await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={onChange} label="How are you?" />);
      const nextCopyAngry = screen.getAllByRole("radio", { name: "Angry", includeHiddenElements: true })[ARC_MIDDLE + 1];
      await user.press(nextCopyAngry);
      expect(onChange).not.toHaveBeenCalled();
      expect(uiScroll).not.toHaveBeenCalled();
    } finally {
      timing.mockRestore();
      uiScroll.mockRestore();
    }
  });

  it("choosing gives a light tick you can feel", async () => {
    const user = userEvent.setup();
    (Haptics.selectionAsync as jest.Mock).mockClear();
    await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={() => {}} label="How are you?" />);
    await user.press(screen.getByRole("radio", { name: "Thankful" }));
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it("the caption fades to the chosen mood's words", async () => {
    const { rerender } = await renderWithApp(<MoodPicker variant="orbs" value="heavy" onChange={() => {}} label="How are you?" />);
    const first = screen.getByText("Weighed down, tired");
    await rerender(<MoodPicker variant="orbs" value="joyful" onChange={() => {}} label="How are you?" />);
    expect(screen.getByText("Light, smiling inside")).not.toBe(first);
    expect(screen.getByText("Light, smiling inside")).toHaveProp("entering", expect.anything());
  });

  it("swiping only browses; nothing is chosen until a tap", async () => {
    const onChange = jest.fn();
    await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={onChange} label="How are you?" />);
    await act(async () =>
      fireEvent(screen.getByTestId("feeling-arc"), "momentumScrollEnd", { nativeEvent: { contentOffset: { x: 2 * 76, y: 0 } } }),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("never runs out: wherever a swipe stops, it rests on the same mood in the middle copy", () => {
    expect(middleOf(ARC_MIDDLE * 10 + 22)).toBe(ARC_MIDDLE * 10 + 2);
    expect(middleOf(3)).toBe(ARC_MIDDLE * 10 + 3);
    expect(middleOf(ARC_MIDDLE * 10 + 7)).toBe(ARC_MIDDLE * 10 + 7);
  });

  it("labels are never cut off: the label does not grow with the orb", async () => {
    await renderWithApp(<MoodPicker variant="orbs" value="peaceful" onChange={() => {}} label="How are you?" />);
    expect(screen.getByTestId("feeling-arc")).toHaveProp("contentContainerStyle", expect.objectContaining({ paddingBottom: expect.any(Number) }));
  });

  it("says a few words about the chosen mood, and invites a swipe or tap before", async () => {
    const { rerender } = await renderWithApp(<MoodPicker variant="orbs" value={null} onChange={() => {}} label="How are you?" />);
    expect(screen.getByText("Swipe to see more, tap the one closest to now")).toBeOnTheScreen();
    await rerender(<MoodPicker variant="orbs" value="heavy" onChange={() => {}} label="How are you?" />);
    expect(screen.getByText("Weighed down, tired")).toBeOnTheScreen();
  });

  it("Today checks in with the orbs", async () => {
    await renderWithApp(<TodayScreen />);
    expect(screen.getByTestId("feeling-orbs")).toBeOnTheScreen();
  });

  it("feeling tiles are tinted with the mood and still capped at three", async () => {
    const user = userEvent.setup();
    let value: string[] = [];
    // The Dusk palette, not the Midnight one used after 10 pm.
    await act(async () => {
      await setPref("nightDim", false);
    });
    const { rerender } = await renderWithApp(<FeelingChips mood="heavy" value={value} onChange={(v) => (value = v)} />, { keepState: true });
    expect(screen.getAllByRole("button")).toHaveLength(8);
    for (const name of ["lonely", "sad", "homesick"]) {
      await user.press(screen.getByRole("button", { name }));
      await rerender(<FeelingChips mood="heavy" value={value} onChange={(v) => (value = v)} />);
    }
    expect(value).toEqual(["lonely", "sad", "homesick"]);
    expect(screen.getByRole("button", { name: "sad" })).toHaveStyle({ backgroundColor: readableFill(tokens.dusk.mood.heavy).background });
    expect(screen.getByRole("button", { name: "hurt" })).toBeDisabled();
  });
});

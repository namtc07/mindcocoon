import { getStorage } from "@mindcocoon/core/storage/index";
import { render, screen, userEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { GentleCard, __resetGentleCardForTests, claimGentleCard } from "@/components/safety/GentleCard";
import { HeavyNudge } from "@/components/safety/HeavyNudge";
import { getPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

const DAY = 86_400_000;

describe("MoodPicker", () => {
  it("is a radio group of five moods", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderWithApp(<MoodPicker value="peaceful" onChange={onChange} label="How are you?" />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByRole("radio", { name: "Peaceful" })).toBeChecked();
    await user.press(screen.getByRole("radio", { name: "Heavy" }));
    expect(onChange).toHaveBeenCalledWith("heavy");
  });
});

describe("GentleCard", () => {
  beforeEach(() => __resetGentleCardForTests());

  it("offers support first, then lets the person continue", async () => {
    const user = userEvent.setup();
    const onContinue = jest.fn();
    await renderWithApp(<GentleCard visible continueLabel="Continue releasing" onContinue={onContinue} onClose={() => {}} />);
    expect(screen.getByText(/sounds really heavy/i)).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Call a support line" }));
    expect(router.push).toHaveBeenCalledWith("/help");
    await user.press(screen.getByRole("button", { name: "Continue releasing" }));
    expect(onContinue).toHaveBeenCalled();
  });

  it("is claimed only once per app session", () => {
    expect(claimGentleCard()).toBe(true);
    expect(claimGentleCard()).toBe(false);
  });
});

describe("HeavyNudge", () => {
  const now = new Date(2026, 9, 17, 22, 0);

  it("appears after seven heavy days and records when it was shown", async () => {
    await renderWithApp(<></>);
    for (let i = 0; i < 7; i++) {
      await getStorage().moods.add({ id: `h${i}`, mood: "heavy", tags: [], createdAt: new Date(now.getTime() - i * DAY).toISOString() });
    }
    await render(<HeavyNudge now={now} />);
    expect(await screen.findByText(/these last days seem heavy/i)).toBeOnTheScreen();
    expect(getPref("heavyNudgeAt")).toBeGreaterThan(0);
  });

  it("stays quiet otherwise", async () => {
    await renderWithApp(<HeavyNudge now={now} />);
    expect(screen.queryByText(/these last days seem heavy/i)).not.toBeOnTheScreen();
  });
});

import { promptAt } from "@mindcocoon/core/prompts";
import { tonightPlan } from "@mindcocoon/core/tonight-plan";
import type { MoodLog } from "@mindcocoon/core/types";
import { act, screen, userEvent, waitFor, within } from "@testing-library/react-native";
import { router } from "expo-router";
import TodayScreen from "@/app/(tabs)/index";
import { MonthPixels } from "@/components/today/MonthPixels";
import { getPref, setPref } from "@/lib/prefs";
import type { SleepNight } from "@/lib/sleep-log-core";
import { renderWithApp } from "@/test-utils/render";

let mockNow = new Date(2026, 9, 19, 10, 0); // Monday 19 October 2026, morning.
jest.mock("@/hooks/use-now", () => ({ useNow: () => mockNow }));

const night = (day: string, windDown = true): SleepNight => ({ night: day, windDown });
const HIDDEN = { includeHiddenElements: true }; // Kén is decorative art

afterEach(async () => {
  await act(() => setPref("sleepLog", undefined));
  await act(() => setPref("kenSeen", undefined));
  await act(() => setPref("widgetState", undefined));
  await act(() => setPref("tonightSeed", undefined));
  await act(() => setPref("journeyInviteMonth", undefined));
  jest.clearAllMocks();
});

describe("Kén's growth on Today", () => {
  it("wears a sprout after a few evenings of showing up", async () => {
    await act(() => setPref("sleepLog", [night("2026-10-16"), night("2026-10-17", false), night("2026-10-18")]));
    await renderWithApp(<TodayScreen />);
    expect(await screen.findByTestId("ken-sprout", HIDDEN)).toBeOnTheScreen();
  });

  it("an overnight change waits to be noticed once, then becomes the new baseline", async () => {
    await act(() => setPref("sleepLog", [night("2026-10-18")]));
    await act(() => setPref("kenSeen", { on: "2026-10-18", stage: 0 }));
    await renderWithApp(<TodayScreen />);
    expect(await screen.findByTestId("ken-changed")).toHaveTextContent("Kén grew a little while you were away.");
    await waitFor(() => expect(getPref("kenSeen")).toEqual({ on: "2026-10-19", stage: 1 }));
    // The widget contract was refreshed for today, in the person's language.
    const widget = getPref("widgetState");
    expect(widget?.stage).toBe(1);
    expect(widget?.ornament).toBe("sprout");
    expect(widget?.updatedOn).toBe("2026-10-19");
    expect(typeof widget?.prompt).toBe("string");
    expect(widget?.prompt.length).toBeGreaterThan(0);
  });

  it("today's writing idea comes from tonight's seeded plan", async () => {
    await act(() => setPref("tonightSeed", "test-seed"));
    await renderWithApp(<TodayScreen />);
    const card = await screen.findByTestId("today-prompt");
    const expected = promptAt("en", tonightPlan("test-seed", mockNow).promptIndex);
    expect(within(card).getByTestId("prompt-text")).toHaveTextContent(expected);
  });

  it("the first ever visit is not a reveal", async () => {
    await act(() => setPref("sleepLog", [night("2026-10-18")]));
    await renderWithApp(<TodayScreen />);
    await screen.findByTestId("ken-sprout", HIDDEN);
    expect(screen.queryByTestId("ken-changed")).not.toBeOnTheScreen();
  });
});

const logOn = (day: number): MoodLog => ({
  id: `log-${day}`,
  mood: "peaceful",
  tags: [],
  createdAt: new Date(2026, 9, day, 21, 0).toISOString(),
});

describe("Month pixels on Today", () => {
  it("shows one quiet square per day of the month, with no numbers", async () => {
    await renderWithApp(<MonthPixels logs={[logOn(3), logOn(9)]} now={new Date(2026, 9, 15, 10, 0)} />);
    expect(await screen.findByTestId("month-pixels")).toBeOnTheScreen();
    expect(screen.getAllByTestId("month-pixel")).toHaveLength(31);
    expect(screen.queryByTestId("month-journey-invite")).not.toBeOnTheScreen();
  });

  it("tapping the strip opens the Mood tab", async () => {
    const user = userEvent.setup();
    await renderWithApp(<MonthPixels logs={[]} now={new Date(2026, 9, 15, 10, 0)} />);
    await user.press(await screen.findByTestId("month-pixels"));
    expect(router.push).toHaveBeenCalledWith("/mood");
  });

  it("near the month's end, with evenings to show, it gently offers the month's picture", async () => {
    const user = userEvent.setup();
    await renderWithApp(<MonthPixels logs={[3, 9, 14, 21, 28].map(logOn)} now={new Date(2026, 9, 30, 10, 0)} />);
    const invite = await screen.findByTestId("month-journey-invite");
    expect(within(invite).getByText("This month is nearly complete — keep a picture of it.")).toBeOnTheScreen();
    await user.press(within(invite).getByRole("button", { name: "See it" }));
    expect(router.push).toHaveBeenCalledWith("/mood");
    expect(getPref("journeyInviteMonth")).toBe("2026-10");
  });

  it("the invitation does not repeat within the same month once taken", async () => {
    await act(() => setPref("journeyInviteMonth", "2026-10"));
    await renderWithApp(<MonthPixels logs={[3, 9, 14, 21, 28].map(logOn)} now={new Date(2026, 9, 30, 10, 0)} />);
    expect(await screen.findByTestId("month-pixels")).toBeOnTheScreen();
    expect(screen.queryByTestId("month-journey-invite")).not.toBeOnTheScreen();
  });
});

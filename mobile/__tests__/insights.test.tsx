import { addMood, getMoodState, loadMoods } from "@mindcocoon/core/mood/store";
import { getStorage } from "@mindcocoon/core/storage/index";
import { initVault } from "@mindcocoon/core/vault/session";
import { act, screen } from "@testing-library/react-native";
import { GentleInsights } from "@/components/mood/GentleInsights";
import { renderWithApp } from "@/test-utils/render";

async function seed(entries: { mood: "anxious" | "heavy"; daysAgo: number; tags?: string[]; feelings?: string[] }[]) {
  await renderWithApp(<></>);
  await act(async () => {
    await initVault();
    for (const e of entries) {
      const log = await addMood({ mood: e.mood, tags: e.tags ?? [], feelings: e.feelings });
      const d = new Date();
      d.setDate(d.getDate() - e.daysAgo);
      d.setHours(20, 0, 0, 0);
      await getStorage().moods.replaceAll(
        (await getStorage().moods.list()).map((l) => (l.id === log.id ? { ...l, createdAt: d.toISOString() } : l)),
      );
    }
  });
  await act(async () => {
    await loadMoods(true);
  });
}

describe("Gentle observations", () => {
  it("hidden with too little to go on", async () => {
    await seed([{ mood: "anxious", daysAgo: 1, tags: ["work"] }]);
    await renderWithApp(<GentleInsights />, { keepState: true });
    expect(screen.queryByText("Gently noticed")).not.toBeOnTheScreen();
  });

  it("speaks in words, never numbers", async () => {
    await seed([
      ...[1, 2, 3, 4].map((d) => ({ mood: "anxious" as const, daysAgo: d, tags: ["work"], feelings: ["worried"] })),
    ]);
    expect(getMoodState().logs).toHaveLength(4);
    await renderWithApp(<GentleInsights />, { keepState: true });
    expect(await screen.findByText("Gently noticed")).toBeOnTheScreen();
    expect(screen.getByText("On days tagged Work, you often felt anxious.")).toBeOnTheScreen();
    expect(screen.getByText("Lately, “worried” has come up more than once.")).toBeOnTheScreen();
    expect(screen.queryByText(/\d/)).not.toBeOnTheScreen();
  });
});

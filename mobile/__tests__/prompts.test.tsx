import { PROMPT_COUNT, PROMPT_THEME_OF, REFLECTION_PROMPTS } from "@mindcocoon/core/prompts";
import { act, screen, userEvent } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import VentScreen from "@/app/(tabs)/vent";
import PromptsScreen from "@/app/prompts";
import { ReflectionPrompt } from "@/components/today/ReflectionPrompt";
import { setPref } from "@/lib/prefs";
import { renderWithApp } from "@/test-utils/render";

afterEach(() => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
  jest.clearAllMocks();
});

describe("Prompt library", () => {
  it("the library lists every prompt", async () => {
    await renderWithApp(<PromptsScreen />);
    expect(screen.getAllByRole("button", { name: /^Write about: / })).toHaveLength(PROMPT_COUNT);
  });

  it("picking one opens Vent with it", async () => {
    const user = userEvent.setup();
    await renderWithApp(<PromptsScreen />);
    await user.press(screen.getByRole("button", { name: `Write about: ${REFLECTION_PROMPTS.en[5]}` }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/vent", params: { promptIndex: "5" } });
  });

  it("Surprise me picks one and opens Vent with it", async () => {
    const user = userEvent.setup();
    const random = jest.spyOn(Math, "random").mockReturnValue(0.5);
    try {
      await renderWithApp(<PromptsScreen />);
      await user.press(screen.getByRole("button", { name: "Surprise me" }));
      expect(router.push).toHaveBeenCalledWith({ pathname: "/vent", params: { promptIndex: String(Math.floor(0.5 * PROMPT_COUNT)) } });
    } finally {
      random.mockRestore();
    }
  });

  it("Vent shows the same prompt after switching to Vietnamese", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ promptIndex: "5" });
    await renderWithApp(<VentScreen />);
    expect(screen.getByText(REFLECTION_PROMPTS.en[5])).toBeOnTheScreen();
    await act(() => setPref("locale", "vi"));
    expect(await screen.findByText(REFLECTION_PROMPTS.vi[5])).toBeOnTheScreen();
  });

  it("Today links to the library", async () => {
    const user = userEvent.setup();
    await renderWithApp(<ReflectionPrompt now={new Date(2026, 9, 18, 21)} />);
    await user.press(screen.getByRole("link", { name: "More prompts" }));
    expect(router.push).toHaveBeenCalledWith("/prompts");
  });

  it("filtering by Relationships shows only those prompts", async () => {
    const user = userEvent.setup();
    await renderWithApp(<PromptsScreen />);
    await user.press(screen.getByRole("button", { name: "Relationships" }));
    const expected = PROMPT_THEME_OF.filter((t) => t === "relationships").length;
    expect(screen.getAllByRole("button", { name: /^Write about: / })).toHaveLength(expected);
    expect(screen.getByRole("button", { name: `Write about: ${REFLECTION_PROMPTS.en[31]}` })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "All" }));
    expect(screen.getAllByRole("button", { name: /^Write about: / })).toHaveLength(PROMPT_COUNT);
  });
});

import { act, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { setPref } from "@/lib/prefs";
import { __resetNightForTests } from "@/theme/night";
import { useTheme } from "@/theme/theme";
import { MIDNIGHT, tokens } from "@/theme/tokens";
import { renderWithApp } from "@/test-utils/render";
import SettingsScreen from "@/app/settings";
import { fireEvent } from "@testing-library/react-native";
import { getPref } from "@/lib/prefs";

function Probe() {
  const { c, isDark } = useTheme();
  return <Text testID="probe">{`${c.background}|${isDark}`}</Text>;
}

async function at(hour: number) {
  jest.useFakeTimers({ advanceTimers: true, now: new Date(2026, 9, 19, hour, 0) });
  __resetNightForTests();
}

afterEach(async () => {
  jest.useRealTimers();
  await act(() => setPref("nightDim", undefined));
});

describe("Night dim", () => {
  it("uses the midnight palette at 23:00 when on (default)", async () => {
    await at(23);
    await renderWithApp(<Probe />, { theme: "mist" });
    expect(screen.getByTestId("probe")).toHaveTextContent(`${MIDNIGHT.background}|true`);
  });

  it("keeps the chosen theme when turned off", async () => {
    await at(23);
    await renderWithApp(<Probe />, { theme: "mist" });
    await act(() => setPref("nightDim", false));
    expect(screen.getByTestId("probe")).toHaveTextContent(`${tokens.mist.background}|false`);
  });

  it("switches by itself when 22:00 comes", async () => {
    await at(21);
    await renderWithApp(<Probe />, { theme: "dusk" });
    expect(screen.getByTestId("probe")).toHaveTextContent(`${tokens.dusk.background}|true`);
    await act(async () => jest.advanceTimersByTime(61 * 60_000));
    expect(screen.getByTestId("probe")).toHaveTextContent(`${MIDNIGHT.background}|true`);
  });

  it("Settings can turn it off", async () => {
    await renderWithApp(<SettingsScreen />);
    const toggle = await screen.findByLabelText("Dim after 10 pm");
    expect(toggle.props.value).toBe(true);
    await act(async () => fireEvent(toggle, "valueChange", false));
    expect(getPref("nightDim")).toBe(false);
  });
});

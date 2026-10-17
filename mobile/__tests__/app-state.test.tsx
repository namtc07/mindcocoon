import { render, screen } from "@testing-library/react-native";
import { AppState, Text } from "react-native";
import { useAppState } from "@/hooks/use-app-state";

it("reads the live app state, even if it changed while nobody was subscribed", async () => {
  const prop = jest.replaceProperty(AppState, "currentState", "background");
  function Probe() {
    return <Text>{useAppState()}</Text>;
  }
  await render(<Probe />);
  expect(screen.getByText("background")).toBeOnTheScreen();
  prop.restore();
});

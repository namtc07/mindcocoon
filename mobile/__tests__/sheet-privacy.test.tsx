import { screen } from "@testing-library/react-native";
import { AppState, Text } from "react-native";
import { Sheet } from "@/components/ui/Sheet";
import { renderWithApp } from "@/test-utils/render";

it("an open sheet is covered in the app switcher too", async () => {
  const prop = jest.replaceProperty(AppState, "currentState", "inactive");
  try {
    await renderWithApp(
      <Sheet visible title="Day" onClose={() => {}}>
        <Text>decrypted note</Text>
      </Sheet>,
    );
    expect(screen.getByLabelText("Hidden while MindCocoon is in the background")).toBeOnTheScreen();
  } finally {
    prop.restore();
  }
});

import { act } from "@testing-library/react-native";

/** Ends the slide-out of every modal hidden so far (see the Modal mock in jest.setup.ts). */
export async function finishModalDismissals() {
  // Under Jest this resolves to the mock, which exposes its queue.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const queue = (require("react-native/Libraries/Modal/Modal") as { __dismissQueue: (() => void)[] }).__dismissQueue;
  await act(async () => {
    for (const onDismiss of queue.splice(0)) onDismiss();
  });
}

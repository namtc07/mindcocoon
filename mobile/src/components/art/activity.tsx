import { useIsFocused } from "expo-router";
import { createContext, useContext, useId, type ReactNode } from "react";

/** Whether looping decorations (twinkling stars, floating Kén) may move: false behind other screens. */
export const AnimationsActive = createContext(true);

/** Wraps a tab screen so its decorations pause while another tab or screen is in front. */
export function ScreenActive({ children }: { children: ReactNode }) {
  const focused = useIsFocused();
  return <AnimationsActive.Provider value={focused}>{children}</AnimationsActive.Provider>;
}

export const useAnimationsActive = () => useContext(AnimationsActive);

/** A unique, url()-safe prefix for SVG gradient/mask ids (ids are document-wide on the web). */
export function useSvgId() {
  return useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

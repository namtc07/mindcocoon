import { AppState } from "react-native";
import { createAutoLock, type AppStateLike } from "./auto-lock";

/** The app-wide auto-lock, started by the root layout (touches mark activity). */
export const appAutoLock = createAutoLock({ appState: AppState as unknown as AppStateLike });

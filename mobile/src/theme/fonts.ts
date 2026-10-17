import { HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold } from "@expo-google-fonts/hanken-grotesk";
import { Newsreader_400Regular, Newsreader_400Regular_Italic } from "@expo-google-fonts/newsreader";
import { useFonts } from "expo-font";

/** Newsreader (serif: prompts, writing surface) + Hanken Grotesk (interface), as on the web. */
export const fonts = {
  serif: "Newsreader_400Regular",
  serifItalic: "Newsreader_400Regular_Italic",
  sans: "HankenGrotesk_400Regular",
  sansMedium: "HankenGrotesk_500Medium",
  sansSemibold: "HankenGrotesk_600SemiBold",
} as const;

/** True once every font is ready (or failed — the system font is an acceptable fallback). */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
  });
  return loaded || Boolean(error);
}

import { dayKey } from "@/lib/dates";

/** Gentle reflection prompts. Written to invite, never to demand. */
export const REFLECTION_PROMPTS = [
  "What is one thing you are carrying today that isn't yours to carry?",
  "Where in your body do you feel today the most?",
  "What would you say to a friend who felt the way you feel right now?",
  "What did you need this week that you didn't get?",
  "Name one small thing that felt okay today.",
  "What are you pretending not to know?",
  "If today had a weather, what would it be?",
  "What is something you miss, and what did it give you?",
  "Which conversation keeps replaying in your head?",
  "What would rest look like for you tonight, honestly?",
  "What are you proud of that nobody noticed?",
  "What boundary did you wish you had kept today?",
  "Write the sentence you are afraid to say out loud.",
  "What is changing in your life, even slowly?",
  "Who do you feel safest around, and why?",
  "What would you let go of if you knew you'd be okay?",
  "What part of today would you like to forget? What part would you keep?",
  "What does your tiredness want you to know?",
  "Describe a place where you once felt completely calm.",
  "What expectation are you holding yourself to that feels too heavy?",
  "What is one kind thing you can do for yourself in the next hour?",
  "What are you grieving, even if it seems small?",
  "When did you last laugh without trying?",
  "What would you write in a letter you never have to send?",
  "What does 'enough' look like today?",
  "What are you looking forward to, even a little?",
  "Which thought keeps visiting you uninvited?",
  "What did your younger self need to hear?",
  "What are you learning about yourself lately?",
  "If your worry could speak, what would it ask for?",
];

/** Stable prompt for a given day, so it doesn't change on every visit. */
export function promptForDay(date: Date, offset = 0): string {
  const key = dayKey(date);
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return REFLECTION_PROMPTS[(hash + offset) % REFLECTION_PROMPTS.length];
}

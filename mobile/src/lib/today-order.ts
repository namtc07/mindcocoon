import type { OnboardingIntent } from "@mindcocoon/core/onboarding";

export type TodayBlock = "checkin" | "worry" | "entries" | "prompt";

const move = (order: TodayBlock[], block: TodayBlock, index: number) => {
  const rest = order.filter((b) => b !== block);
  return [...rest.slice(0, index), block, ...rest.slice(index)];
};

/**
 * Night: name the feeling, get something for it, wind down; writing ideas come last. Day: check
 * in, then a small writing idea. What the person came for brings its block forward; worries last, so the worry line
 * (the only way back to the box) wins the top spot when chosen.
 */
export function todayOrder(evening: boolean, intents: readonly OnboardingIntent[]): TodayBlock[] {
  let order: TodayBlock[] = evening ? ["checkin", "worry", "entries", "prompt"] : ["worry", "checkin", "prompt", "entries"];
  const has = (i: OnboardingIntent) => intents.includes(i);
  if (evening) {
    if (has("write")) order = move(order, "prompt", order.indexOf("entries"));
    if (has("sleep")) order = move(order, "entries", 0);
  } else {
    if (has("feelings")) order = move(order, "checkin", 0);
    if (has("write")) order = move(order, "prompt", 0);
  }
  if (has("worries")) order = move(order, "worry", 0);
  return order;
}

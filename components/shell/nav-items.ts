import { BookLock, Feather, Leaf, Settings2, Sunrise, Waves, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@mindcocoon/core/i18n/get-dictionary";

export interface NavItem {
  href: string;
  labelKey: keyof Dictionary["nav"];
  icon: LucideIcon;
  /** Shown in the mobile tab bar (settings lives in the mobile header instead). */
  inTabBar: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "today", icon: Sunrise, inTabBar: true },
  { href: "/vent", labelKey: "vent", icon: Feather, inTabBar: true },
  { href: "/mood", labelKey: "mood", icon: Waves, inTabBar: true },
  { href: "/sanctuary", labelKey: "sanctuary", icon: Leaf, inTabBar: true },
  { href: "/vault", labelKey: "vault", icon: BookLock, inTabBar: true },
  { href: "/settings", labelKey: "settings", icon: Settings2, inTabBar: false },
];

/** `path` is locale-free, e.g. "/vent". */
export function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

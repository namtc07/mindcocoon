import { BookLock, Feather, Leaf, Settings2, Sunrise, Waves, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile tab bar (settings lives in the mobile header instead). */
  inTabBar: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: Sunrise, inTabBar: true },
  { href: "/vent", label: "Vent", icon: Feather, inTabBar: true },
  { href: "/mood", label: "Mood", icon: Waves, inTabBar: true },
  { href: "/sanctuary", label: "Sanctuary", icon: Leaf, inTabBar: true },
  { href: "/vault", label: "Vault", icon: BookLock, inTabBar: true },
  { href: "/settings", label: "Settings", icon: Settings2, inTabBar: false },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

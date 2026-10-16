"use client";

export type AdPlacement = "today" | "mood";

/** Ad slot. Renders nothing until Task 14 wires config-driven banners. */
export function AdBanner({ placement }: { placement: AdPlacement }) {
  void placement;
  return null;
}

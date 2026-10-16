import { vi } from "vitest";

/** Mutable fake router state shared by the next/navigation mock in tests/setup.ts. */
export const navigation = {
  router: { push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() },
  pathname: "/en",
  searchParams: new URLSearchParams(),
};

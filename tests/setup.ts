import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { createElement, type AnchorHTMLAttributes } from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { navigation } from "./utils/navigation";

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams,
}));

vi.mock("next/link", () => ({
  default: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    createElement("a", { href, ...rest }),
}));

afterEach(() => {
  cleanup();
});

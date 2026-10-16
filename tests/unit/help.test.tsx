import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HelpView } from "@/components/modules/safety/help-view";
import { renderWithProviders } from "../utils/render";

describe("Help page", () => {
  it("lists Vietnamese lines first for Vietnamese users, with call links", async () => {
    renderWithProviders(<HelpView />, "vi");
    const lists = await screen.findAllByRole("list");
    const first = within(lists[0]).getAllByRole("listitem")[0];
    expect(first).toHaveTextContent("115");
    expect(within(first).getByRole("link", { name: /gọi/i })).toHaveAttribute("href", "tel:115");
    expect(screen.getByRole("link", { name: "Tìm đường dây hỗ trợ ở nước bạn" })).toHaveAttribute(
      "href",
      "https://findahelpline.com",
    );
  });

  it("marks youth lines", async () => {
    renderWithProviders(<HelpView />, "en");
    expect(await screen.findByText("For young people")).toBeInTheDocument();
  });
});

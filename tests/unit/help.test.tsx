import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HelpView } from "@/components/modules/safety/help-view";
import { renderWithProviders } from "../utils/render";

describe("Help page", () => {
  it("lists Vietnamese lines first for Vietnamese users, with call links", async () => {
    renderWithProviders(<HelpView />, "vi");
    const lists = await screen.findAllByRole("list");
    // Vietnam's lines (Ngày Mai, 111, 115) lead; their order depends on which are open right now.
    const emergency = within(lists[0]).getAllByRole("listitem").find((li) => li.textContent?.includes("115"))!;
    expect(emergency).toBeTruthy();
    expect(within(emergency).getByRole("link", { name: /gọi/i })).toHaveAttribute("href", "tel:115");
    expect(screen.getByRole("link", { name: "Tìm đường dây hỗ trợ ở nước bạn" })).toHaveAttribute(
      "href",
      "https://findahelpline.com",
    );
  });

  it("marks youth lines", async () => {
    renderWithProviders(<HelpView />, "en");
    expect((await screen.findAllByText("For young people")).length).toBeGreaterThan(0);
  });
});

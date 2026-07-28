import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackToHouses } from "./back-to-houses";

vi.mock("@/lib/analytics", () => ({
  trackBackToHousesClicked: vi.fn(),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { trackBackToHousesClicked } from "@/lib/analytics";

describe("BackToHouses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a link back to /houses (degenerate case)", () => {
    render(<BackToHouses fromHouseId="gryffindor" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/houses");
    expect(link).toHaveTextContent(/Back/i);
  });

  it("fires trackBackToHousesClicked with fromHouseId on click", async () => {
    const user = userEvent.setup();
    render(<BackToHouses fromHouseId="slytherin" />);

    await user.click(screen.getByRole("link"));

    expect(trackBackToHousesClicked).toHaveBeenCalledExactlyOnceWith({
      fromHouseId: "slytherin",
    });
  });
});

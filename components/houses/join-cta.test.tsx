import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinCta } from "./join-cta";

vi.mock("@/lib/analytics", () => ({
  trackExploreCtaClicked: vi.fn(),
}));

vi.mock("@/lib/user", () => ({
  readWizardName: vi.fn(() => null),
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

import { trackExploreCtaClicked } from "@/lib/analytics";
import { readWizardName } from "@/lib/user";

describe("JoinCta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readWizardName).mockReturnValue(null);
  });

  it("renders a CTA linking to /join?favoriteHouse=<slug> when user is anonymous (degenerate)", () => {
    render(<JoinCta favoriteHouseValue="slytherin" houseName="Slytherin" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/join?favoriteHouse=slytherin");
    expect(link).toHaveTextContent(/join/i);
  });

  it("renders null when the user is already known", () => {
    vi.mocked(readWizardName).mockReturnValue("Hermione");

    const { container } = render(
      <JoinCta favoriteHouseValue="slytherin" houseName="Slytherin" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("fires trackExploreCtaClicked with location 'house_detail' on click", async () => {
    const user = userEvent.setup();
    render(<JoinCta favoriteHouseValue="ravenclaw" houseName="Ravenclaw" />);

    await user.click(screen.getByRole("link"));

    expect(trackExploreCtaClicked).toHaveBeenCalledExactlyOnceWith({
      location: "house_detail",
    });
  });

  it("mentions the house name in the CTA copy", () => {
    render(<JoinCta favoriteHouseValue="gryffindor" houseName="Gryffindor" />);

    expect(screen.getByText(/Gryffindor/i)).toBeInTheDocument();
  });
});

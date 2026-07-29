import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CtaLink } from "@/components/ui/cta-link";

vi.mock("@/lib/analytics", () => ({
  trackExploreCtaClicked: vi.fn(),
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

describe("CtaLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the label text (degenerate case)", () => {
    render(
      <CtaLink href="/houses" location="hero">
        Explore the Houses
      </CtaLink>,
    );
    expect(screen.getByText("Explore the Houses")).toBeInTheDocument();
  });

  it("links to the given href", () => {
    render(
      <CtaLink href="/houses" location="hero">
        Explore
      </CtaLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/houses");
  });

  it("fires trackExploreCtaClicked with the given location on click", async () => {
    const user = userEvent.setup();
    render(
      <CtaLink href="/houses" location="hero">
        Explore
      </CtaLink>,
    );

    await user.click(screen.getByRole("link"));

    expect(trackExploreCtaClicked).toHaveBeenCalledExactlyOnceWith({ location: "hero" });
  });
});

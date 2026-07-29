import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Nav } from "@/components/layout/nav";

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

vi.mock("next/navigation", () => ({
  usePathname: () => "/houses",
}));

import { trackExploreCtaClicked } from "@/lib/analytics";

describe("Nav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the brand mark (degenerate case)", () => {
    render(<Nav />);
    expect(screen.getByText("wizard-hub")).toBeInTheDocument();
  });

  it("renders links for Home, Houses and Potions (desktop inline + mobile trigger)", () => {
    render(<Nav />);
    // Both inline and inside MobileNav trigger context render the links.
    expect(screen.getAllByRole("link", { name: "Home" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Houses" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Potions" }).length).toBeGreaterThan(0);
  });

  it("marks the current route's link as active in the desktop nav", () => {
    render(<Nav />);
    // The desktop Houses link is the first one in DOM order.
    const housesLinks = screen.getAllByRole("link", { name: "Houses" });
    expect(housesLinks[0]).toHaveAttribute("aria-current", "page");
  });

  it("fires trackExploreCtaClicked with location 'nav' when desktop Houses link is clicked", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    const housesLinks = screen.getAllByRole("link", { name: "Houses" });
    await user.click(housesLinks[0] as HTMLElement);

    expect(trackExploreCtaClicked).toHaveBeenCalledExactlyOnceWith({ location: "nav" });
  });

  it("does NOT fire the event when desktop Home link is clicked (Home is navigation, not exploration)", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    const homeLinks = screen.getAllByRole("link", { name: "Home" });
    await user.click(homeLinks[0] as HTMLElement);

    expect(trackExploreCtaClicked).not.toHaveBeenCalled();
  });

  it("does NOT fire the event when desktop Potions link is clicked (navigation; arrival is captured by Page Viewed)", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    const potionsLinks = screen.getAllByRole("link", { name: "Potions" });
    await user.click(potionsLinks[0] as HTMLElement);

    expect(trackExploreCtaClicked).not.toHaveBeenCalled();
  });
});

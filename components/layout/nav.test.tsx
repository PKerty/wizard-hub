import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Nav } from "./nav";

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

  it("renders links for Home and Houses", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Houses" })).toBeInTheDocument();
  });

  it("marks the current route's link as active", () => {
    render(<Nav />);
    const housesLink = screen.getByRole("link", { name: "Houses" });
    expect(housesLink).toHaveAttribute("aria-current", "page");
  });

  it("fires trackExploreCtaClicked with location 'nav' when Houses link is clicked", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    await user.click(screen.getByRole("link", { name: "Houses" }));

    expect(trackExploreCtaClicked).toHaveBeenCalledExactlyOnceWith({ location: "nav" });
  });

  it("does NOT fire the event when Home link is clicked (Home is navigation, not exploration)", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(trackExploreCtaClicked).not.toHaveBeenCalled();
  });
});

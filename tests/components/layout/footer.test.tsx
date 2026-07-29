import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Footer } from "@/components/layout/footer";

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

describe("Footer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the brand mark (degenerate case)", () => {
    render(<Footer />);
    expect(screen.getByText("wizard-hub")).toBeInTheDocument();
  });

  it("renders links for Home and Houses", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Houses" })).toBeInTheDocument();
  });

  it("fires trackExploreCtaClicked with location 'footer' when Houses link is clicked", async () => {
    const user = userEvent.setup();
    render(<Footer />);

    await user.click(screen.getByRole("link", { name: "Houses" }));

    expect(trackExploreCtaClicked).toHaveBeenCalledExactlyOnceWith({ location: "footer" });
  });

  it("does NOT fire the event when Home link is clicked", async () => {
    const user = userEvent.setup();
    render(<Footer />);

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(trackExploreCtaClicked).not.toHaveBeenCalled();
  });
});

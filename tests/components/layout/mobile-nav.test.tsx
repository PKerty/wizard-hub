import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { Route } from "next";

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

interface LinkDef {
  href: Route;
  label: string;
  tracksAsExploreCta: boolean;
}

const LINKS: readonly LinkDef[] = [
  { href: "/", label: "Home", tracksAsExploreCta: false },
  { href: "/houses", label: "Houses", tracksAsExploreCta: true },
];

describe("MobileNav (ADR-0021)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the hamburger trigger button (degenerate case)", () => {
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("drawer is not visible until trigger is clicked", () => {
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
  });

  it("opens drawer on trigger click and exposes links", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("dialog", { name: "Site navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Houses" })).toBeInTheDocument();
  });

  it("closes drawer when a link is clicked and fires onLinkClick", async () => {
    const user = userEvent.setup();
    const onLinkClick = vi.fn();
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={onLinkClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("link", { name: "Houses" }));

    expect(onLinkClick).toHaveBeenCalledExactlyOnceWith(LINKS[1]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes drawer when overlay is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const overlay = document.querySelector(".mobile-nav-overlay");
    expect(overlay).not.toBeNull();
    await user.click(overlay as HTMLElement);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes drawer on Escape", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes drawer when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("marks active link with aria-current=page", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        links={LINKS}
        isActive={(href) => href === "/houses"}
        onLinkClick={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const housesLink = screen.getByRole("link", { name: "Houses" });
    expect(housesLink).toHaveAttribute("aria-current", "page");
  });

  it("closes drawer when the footer node is clicked (e.g. Join link)", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
        footer={
          <a href="/join" data-testid="footer-join">Join</a>
        }
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByTestId("footer-join"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

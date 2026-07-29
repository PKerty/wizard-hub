import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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

  afterEach(() => {
    document.body.style.overflow = "";
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
    const { container } = render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    // Overlay is a decorative div (aria-hidden). Click on it directly by selector.
    const overlay = container.querySelector(".fixed.inset-0.z-40");
    expect(overlay).not.toBeNull();
    await user.click(overlay as HTMLElement);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes drawer on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("toggles aria-expanded and aria-label on the trigger", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    // After opening the accessible name changes; re-query.
    const openTrigger = screen.getByRole("button", { name: "Close menu" });
    expect(openTrigger).toHaveAttribute("aria-expanded", "true");
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

  it("locks body scroll while drawer is open", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("closes drawer when the footer node is clicked (e.g. Join link)", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        links={LINKS}
        isActive={() => false}
        onLinkClick={() => {}}
        footer={
          <a href="/join" data-testid="footer-join">
            Join
          </a>
        }
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByTestId("footer-join"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

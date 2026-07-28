"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { trackExploreCtaClicked } from "@/lib/analytics";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavLinkDef {
  href: Route;
  label: string;
  /** If true, clicking fires `Explore CTA Clicked` with location 'nav'. */
  tracksAsExploreCta: boolean;
}

const LINKS = [
  { href: "/", label: "Home", tracksAsExploreCta: false },
  { href: "/houses", label: "Houses", tracksAsExploreCta: true },
  { href: "/join", label: "Join", tracksAsExploreCta: false },
] as const satisfies readonly NavLinkDef[];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Top navigation bar. Sticky. Brand on the left, links + ThemeToggle on the right.
 *
 * Only "exploration" links (e.g., Houses) fire the `Explore CTA Clicked` event.
 * Pure-navigation links (e.g., Home) do not — keeps the metric semantically clean.
 */
export function Nav() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b border-moonlight/20 bg-bg-mist/70 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-display text-eyebrow uppercase tracking-[0.25em] text-torchlight"
        >
          wizard-hub
        </Link>

        <div className="flex items-center gap-8">
          <ul className="flex items-center gap-8">
            {LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              const handleClick = link.tracksAsExploreCta
                ? () => trackExploreCtaClicked({ location: "nav" })
                : undefined;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={handleClick}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight"
                        : "font-display text-eyebrow uppercase tracking-[0.2em] text-moonlight transition-colors duration-base ease-arcane hover:text-steel"
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

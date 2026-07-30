"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { trackExploreCtaClicked, resetUserIdentity } from "@/lib/analytics";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "./mobile-nav";
import {
  WIZARD_NAME_STORAGE_KEY,
  clearWizardName,
} from "@/lib/user";
import { useWizardName } from "@/lib/user/use-wizard-name";

interface NavLinkDef {
  href: Route;
  label: string;
  /** If true, clicking fires `Explore CTA Clicked` with location 'nav'. */
  tracksAsExploreCta: boolean;
}

const LINKS = [
  { href: "/", label: "Home", tracksAsExploreCta: false },
  { href: "/houses", label: "Houses", tracksAsExploreCta: true },
  { href: "/potions", label: "Potions", tracksAsExploreCta: false },
  { href: "/wizards", label: "Wizards", tracksAsExploreCta: false },
] as const satisfies readonly NavLinkDef[];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Top navigation bar. Sticky. Brand on the left, links + ThemeToggle on the right.
 *
 * Desktop (≥ sm): inline links. Mobile (< sm): hamburger button opening a drawer
 * via `MobileNav` (ADR-0021).
 *
 * When the user is known (localStorage has wizardName), the "Join" link is
 * replaced by a "Sign Out" button that resets identity and clears the stored
 * name. Only "exploration" links (Houses) fire `Explore CTA Clicked`.
 */
export function Nav() {
  const pathname = usePathname() ?? "/";
  const wizardName = useWizardName();
  const isKnown = wizardName !== null;

  const handleSignOut = () => {
    resetUserIdentity();
    clearWizardName();
    // Dispatch a storage event so other tabs/subscribers (WizardGreeting, Nav) update.
    window.dispatchEvent(new Event("storage"));
  };

  const handleMobileLinkClick = (link: NavLinkDef) => {
    if (link.tracksAsExploreCta) trackExploreCtaClicked({ location: "nav" });
  };

  const authFooter = isKnown ? (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex min-h-11 w-full items-center px-3 font-display text-eyebrow uppercase tracking-[0.2em] text-moonlight transition-colors duration-base ease-arcane hover:text-torchlight hover:bg-bg-fog/50"
    >
      Sign Out
    </button>
  ) : (
    <Link
      href="/join"
      className="inline-flex min-h-11 w-full items-center px-3 font-display text-eyebrow uppercase tracking-[0.2em] text-moonlight transition-colors duration-base ease-arcane hover:text-steel hover:bg-bg-fog/50"
    >
      Join
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-moonlight/20 bg-bg-mist/70 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-display text-eyebrow uppercase tracking-[0.25em] text-torchlight"
        >
          wizard-hub
        </Link>

        <div className="flex items-center gap-4 sm:gap-8">
          {/* Desktop links — inline on ≥ sm (ADR-0021) */}
          <ul className="hidden items-center gap-8 sm:flex">
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
                      "inline-flex min-h-11 items-center " +
                      (active
                        ? "font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight"
                        : "font-display text-eyebrow uppercase tracking-[0.2em] text-moonlight transition-colors duration-base ease-arcane hover:text-steel")
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li>
              {isKnown ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex min-h-11 items-center font-display text-eyebrow uppercase tracking-[0.2em] text-moonlight transition-colors duration-base ease-arcane hover:text-torchlight"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/join"
                  className="inline-flex min-h-11 items-center font-display text-eyebrow uppercase tracking-[0.2em] text-moonlight transition-colors duration-base ease-arcane hover:text-steel"
                >
                  Join
                </Link>
              )}
            </li>
          </ul>
          <ThemeToggle />
          {/* Mobile hamburger — visible on < sm only (ADR-0021) */}
          <MobileNav
            links={LINKS}
            isActive={(href) => isActive(pathname, href)}
            onLinkClick={handleMobileLinkClick}
            footer={authFooter}
          />
        </div>
      </nav>
    </header>
  );
}

// Re-export for tests that need to manipulate storage.
export { WIZARD_NAME_STORAGE_KEY };

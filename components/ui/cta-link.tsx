"use client";

import Link from "next/link";
import type { Route } from "next";
import { trackExploreCtaClicked } from "@/lib/analytics";
import type { EventCatalog } from "@/lib/analytics/events";

type ExploreLocation = EventCatalog["Explore CTA Clicked"]["location"];

export interface CtaLinkProps {
  href: Route;
  /** Tracked location — see ADR-0007 `Explore CTA Clicked`. */
  location: ExploreLocation;
  children: React.ReactNode;
}

/**
 * Primary call-to-action link. Fires `Explore CTA Clicked` on click.
 * Styled per design-system.md §4.2 (Primary button variant).
 */
export function CtaLink({ href, location, children }: CtaLinkProps) {
  const handleClick = () => {
    trackExploreCtaClicked({ location });
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-soft bg-torchlight px-6 py-3 font-display text-eyebrow uppercase tracking-[0.2em] text-bg-void transition-all duration-base ease-arcane hover:shadow-[0_0_24px_rgba(212,162,75,0.25)] hover:brightness-110 sm:w-auto"
    >
      {children}
    </Link>
  );
}

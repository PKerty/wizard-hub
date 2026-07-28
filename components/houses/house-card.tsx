"use client";

import Link from "next/link";
import { trackHouseCardClicked } from "@/lib/analytics";
import type { House } from "@/modules/houses";

export interface HouseCardProps {
  house: House;
  /**
   * Where the card is being rendered. Tracked with the click event so the
   * dashboard can distinguish list-page clicks from home-page clicks.
   *
   * Also forwarded to /houses/[id] as ?source=… so the House Viewed event
   * knows the origin ('houses_list' → 'list', 'home' → 'home').
   */
  source: "home" | "houses_list";
}

/**
 * House card per design-system.md §3.4 (House Card anatomy).
 * Shield placeholder will be replaced by custom SVG heraldry (ADR-0015).
 */
export function HouseCard({ house, source }: HouseCardProps) {
  const handleClick = () => {
    trackHouseCardClicked({
      houseId: house.id,
      houseName: house.name,
      source,
    });
  };

  const sourceForUrl = source === "houses_list" ? "list" : source;
  const primaryTrait = house.traitNames[0] ?? "";

  return (
    <Link
      href={`/houses/${house.id}?source=${sourceForUrl}`}
      onClick={handleClick}
      className="group relative block rounded-card border border-moonlight/20 bg-bg-mist/40 p-6 transition-all duration-base ease-arcane hover:border-torchlight hover:shadow-hover"
    >
      {/* Shield placeholder — replaced by custom SVG in ADR-0015 */}
      <div
        className="mb-4 flex size-12 items-center justify-center rounded-soft border border-moonlight/30 text-torchlight"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" strokeLinejoin="round" />
        </svg>
      </div>

      <h3 className="font-display text-h3 font-semibold leading-tight text-steel">
        {house.name}
      </h3>

      <p className="mt-1 font-mono text-mono-data text-moonlight">
        {house.founder} · {house.element}
      </p>

      {primaryTrait && (
        <p className="mt-3 font-body text-small italic text-moonlight/80">
          &ldquo;{primaryTrait}&rdquo;
        </p>
      )}

      <p className="mt-4 font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight opacity-70 transition-opacity duration-base group-hover:opacity-100">
        → Enter
      </p>
    </Link>
  );
}

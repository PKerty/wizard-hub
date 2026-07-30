"use client";

import Link from "next/link";
import { trackBackToHousesClicked } from "@/lib/analytics";

interface BackToHousesProps {
  fromHouseId: string;
}

/**
 * "Back to Houses" button — rendered on the house detail page.
 * Fires `Back To Houses Clicked` (ADR-0007) with the house the user is leaving.
 */
export function BackToHouses({ fromHouseId }: BackToHousesProps) {
  const handleClick = () => {
    trackBackToHousesClicked({ fromHouseId });
  };

  return (
    <Link
      href="/houses"
      onClick={handleClick}
      className="inline-flex min-h-11 items-center gap-2 font-display text-eyebrow uppercase tracking-[0.2em] text-moonlight transition-all duration-base ease-arcane hover:-translate-y-px hover:text-torchlight"
    >
      ← Back to Houses
    </Link>
  );
}

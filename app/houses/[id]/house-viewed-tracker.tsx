"use client";

import { useEffect, useRef } from "react";
import { trackHouseViewed } from "@/lib/analytics";
import type { EventCatalog } from "@/lib/analytics/events";

type ViewedSource = EventCatalog["House Viewed"]["source"];

interface HouseViewedTrackerProps {
  house: {
    id: string;
    name: string;
    founder: string;
  };
  source: ViewedSource;
}

/**
 * Fires the `House Viewed` event (ADR-0007) once per house per mount.
 *
 * StrictMode-safe: uses a ref guard so the dev-mode double-effect doesn't
 * double-fire the event. If the same component instance is reused for a
 * different house (e.g., client-side navigation between detail pages),
 * the new house.id re-triggers tracking.
 */
export function HouseViewedTracker({ house, source }: HouseViewedTrackerProps) {
  const trackedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (trackedIdRef.current === house.id) return;
    trackedIdRef.current = house.id;
    trackHouseViewed({
      houseId: house.id,
      houseName: house.name,
      houseFounder: house.founder,
      source,
    });
  }, [house.id, house.name, house.founder, source]);

  return null;
}

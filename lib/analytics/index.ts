/**
 * Public surface of the analytics wrapper — ADR-0006.
 * This is the ONLY module components/pages should import.
 * Components must never import @amplitude/analytics-browser directly.
 */
import {
  initAnalytics,
  setUserId,
  resetIdentity,
  trackRawEvent,
  identifyUserProperties,
} from "./client";
import type { EventCatalog } from "./events";

/* ==================== Lifecycle ==================== */

export function init(): void {
  initAnalytics();
}

/* ==================== Tracking (typed wrappers per event) ==================== */

export function trackHouseViewed(props: EventCatalog["House Viewed"]): void {
  trackRawEvent("House Viewed", props);
}

export function trackHouseCardClicked(props: EventCatalog["House Card Clicked"]): void {
  trackRawEvent("House Card Clicked", props);
}

export function trackExploreCtaClicked(props: EventCatalog["Explore CTA Clicked"]): void {
  trackRawEvent("Explore CTA Clicked", props);
}

export function trackBackToHousesClicked(props: EventCatalog["Back To Houses Clicked"]): void {
  trackRawEvent("Back To Houses Clicked", props);
}

export function trackExternalLinkClicked(props: EventCatalog["External Link Clicked"]): void {
  trackRawEvent("External Link Clicked", props);
}

export function trackThemeToggled(props: EventCatalog["Theme Toggled"]): void {
  trackRawEvent("Theme Toggled", props);
}

/* ==================== Identity (ADR-0008) ==================== */

export interface FanclubMember {
  email: string;
  wizardName: string;
  favoriteHouse: "gryffindor" | "slytherin" | "ravenclaw" | "hufflepuff";
}

export function identifyFanclubMember(member: FanclubMember): void {
  const normalizedEmail = member.email.trim().toLowerCase();
  setUserId(normalizedEmail);
  identifyUserProperties({
    lifecycleStage: "known",
    wizardName: member.wizardName.slice(0, 50),
    favoriteHouse: member.favoriteHouse,
  });
}

export function resetUserIdentity(): void {
  resetIdentity();
  identifyUserProperties({ lifecycleStage: "anonymous" });
}

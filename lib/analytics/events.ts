/**
 * Amplitude event catalog — ADR-0007.
 * Single source of truth for event names and property shapes.
 * The wrapper (index.ts) is the only API consumers should use.
 */

/* ==================== v1 events (Houses — minimal) ==================== */

export interface HouseViewedProperties {
  houseId: string;
  houseName: string;
  houseFounder: string;
  source: "list" | "home" | "direct";
}

export interface HouseCardClickedProperties {
  houseId: string;
  houseName: string;
  source: "home" | "houses_list";
}

export interface ExploreCtaClickedProperties {
  location: "hero" | "nav" | "footer";
}

export interface BackToHousesClickedProperties {
  fromHouseId: string;
}

export interface ExternalLinkClickedProperties {
  target: string;
  location: string;
}

export interface ThemeToggledProperties {
  newTheme: "dark" | "light";
}

/* ==================== Event name + property map ==================== */

export interface EventCatalog {
  "House Viewed": HouseViewedProperties;
  "House Card Clicked": HouseCardClickedProperties;
  "Explore CTA Clicked": ExploreCtaClickedProperties;
  "Back To Houses Clicked": BackToHousesClickedProperties;
  "External Link Clicked": ExternalLinkClickedProperties;
  "Theme Toggled": ThemeToggledProperties;
}

export type EventName = keyof EventCatalog;

export type EventProperties<N extends EventName> = EventCatalog[N];

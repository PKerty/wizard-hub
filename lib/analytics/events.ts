/**
 * Amplitude event catalog — ADR-0007.
 * Single source of truth for event names and property shapes.
 * The wrapper (index.ts) is the only API consumers should use.
 *
 * NOTE: `External Link Clicked` was part of ADR-0007 v1 but is NOT included
 * here — the product has no outbound external links, so the event would never
 * fire. It can be reintroduced if external links are added in the future.
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
  location: "hero" | "nav" | "footer" | "house_detail";
}

export interface BackToHousesClickedProperties {
  fromHouseId: string;
}

export interface ThemeToggledProperties {
  newTheme: "dark" | "light";
}

/* ==================== v1.1 events (ADR-0018) ==================== */

export interface FanclubJoinedProperties {
  favoriteHouse: "gryffindor" | "slytherin" | "ravenclaw" | "hufflepuff";
  /** Longitud del wizardName elegido — NO el nombre en sí, para minimizar PII. */
  wizardNameLength: number;
}

/* ==================== v1.2 events — Potions game (ADR-0025) ==================== */

export interface PotionGameStartedProperties {
  potionId: string;
  potionName: string;
  /** Total ingredients in the recipe = number of rounds. */
  recipeSize: number;
}

export interface PotionRoundPlayedProperties {
  potionId: string;
  /** 1-indexed round. */
  round: number;
  /** Position of the clicked card (0 = left, 1 = center, 2 = right). */
  cardIndex: 0 | 1 | 2;
  correct: boolean;
}

export interface PotionGameWonProperties {
  potionId: string;
  potionName: string;
  roundsCompleted: number;
  /** Elapsed seconds from Started to Won. */
  durationSec: number;
}

export interface PotionGameLostProperties {
  potionId: string;
  potionName: string;
  /** 1-indexed round where the user failed. */
  round: number;
  failedCardIndex: 0 | 1 | 2;
}

export interface PotionGameRestartedProperties {
  previousPotionId: string;
  previousOutcome: "won" | "lost";
}

/* ==================== v1.3 events — Wizards search (ADR-0028) ==================== */

export interface WizardSearchSubmittedProperties {
  /** Length of the query, NOT the text (privacy — ADR-0028 §7). */
  queryLength: number;
  /** Number of fuzzy results returned for this query. */
  resultCount: number;
  /** Fuse.js threshold in effect (the value telemetry will tune). */
  fuzzyThreshold: number;
}

export interface WizardResultClickedProperties {
  wizardId: string;
  wizardName: string;
  /**
   * 0-indexed position of the result whose details the user opened. This is the
   * fuzzy-tuning signal (ADR-0028 feedback loop): the rank at which the user
   * confirmed "this is the wizard I wanted" by opening its details.
   */
  resultRank: number;
  /** Length of the query that surfaced the result, NOT the text (privacy). */
  queryLength: number;
}

export interface ListScrollDepthProperties {
  /** Which list is being scrolled, e.g. "wizards_search_results". */
  listName: string;
  /** Max scroll percent reached so far (edge-triggered at 25/50/75/100). */
  maxScrollPercent: number;
  /** Seconds elapsed on the page when this threshold was crossed. */
  timeOnPageSec: number;
}

/* ==================== Event name + property map ==================== */

export interface EventCatalog {
  "House Viewed": HouseViewedProperties;
  "House Card Clicked": HouseCardClickedProperties;
  "Explore CTA Clicked": ExploreCtaClickedProperties;
  "Back To Houses Clicked": BackToHousesClickedProperties;
  "Theme Toggled": ThemeToggledProperties;
  "Fanclub Joined": FanclubJoinedProperties;
  "Potion Game Started": PotionGameStartedProperties;
  "Potion Round Played": PotionRoundPlayedProperties;
  "Potion Game Won": PotionGameWonProperties;
  "Potion Game Lost": PotionGameLostProperties;
  "Potion Game Restarted": PotionGameRestartedProperties;
  "Wizard Search Submitted": WizardSearchSubmittedProperties;
  "Wizard Result Clicked": WizardResultClickedProperties;
  "List Scroll Depth": ListScrollDepthProperties;
}

export type EventName = keyof EventCatalog;

export type EventProperties<N extends EventName> = EventCatalog[N];

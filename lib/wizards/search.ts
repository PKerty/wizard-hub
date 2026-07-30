import Fuse from "fuse.js";
import type { Wizard } from "@/modules/wizards/domain/wizard";

/**
 * Fuzzy search over wizards using Fuse.js (ADR-0028).
 *
 * Pure and unit-tested: the index is built once per mounted list and reused
 * across queries. Wizards with `displayName === null` are filtered out before
 * indexing (no nameable part → not searchable).
 */

/** Initial fuzzy threshold (ADR-0028 §4). 0 = exact, 1 = anything. Tuned via telemetry. */
export const DEFAULT_FUZZY_THRESHOLD = 0.3;

export function createWizardIndex(
  wizards: Wizard[],
  threshold: number = DEFAULT_FUZZY_THRESHOLD,
): Fuse<Wizard> {
  const indexable = wizards.filter((w) => w.displayName !== null);
  return new Fuse(indexable, { keys: ["displayName"], threshold, includeScore: false });
}

export interface WizardSearchResult {
  wizard: Wizard;
  /** 0-indexed position in the result list — sent as `resultRank` in the analytics event. */
  rank: number;
}

/**
 * Search the index. An empty/whitespace query returns `[]` (no implicit "all").
 */
export function searchWizards(index: Fuse<Wizard>, query: string): WizardSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return index.search(trimmed).map((r, rank) => ({ wizard: r.item, rank }));
}

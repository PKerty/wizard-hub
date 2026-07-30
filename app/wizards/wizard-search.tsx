"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Wizard } from "@/modules/wizards";
import {
  DEFAULT_FUZZY_THRESHOLD,
  createWizardIndex,
  searchWizards,
} from "@/lib/wizards/search";
import {
  trackListScrollDepth,
  trackWizardResultClicked,
  trackWizardSearchSubmitted,
} from "@/lib/analytics";

const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;
const RESULTS_LIST_NAME = "wizards_search_results";

/**
 * Client-side fuzzy search over the wizard roster (ADR-0028).
 *
 * The Fuse index is built once per mount; queries run synchronously against it.
 * Fires three v1.3 events: `Wizard Search Submitted` (on submit),
 * `Wizard Result Clicked` (on result click), and `List Scroll Depth`
 * (edge-triggered at 25/50/75/100 % of the results list).
 */
export function WizardSearch({ wizards }: { wizards: Wizard[] }) {
  const [query, setQuery] = useState("");
  const index = useMemo(() => createWizardIndex(wizards), [wizards]);
  const results = useMemo(() => searchWizards(index, query), [index, query]);

  const startedAtRef = useRef<number>(0);
  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);
  const firedScrollRef = useRef<Set<number>>(new Set());
  const resultsRef = useRef<HTMLDivElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackWizardSearchSubmitted({
      queryLength: query.trim().length,
      resultCount: results.length,
      fuzzyThreshold: DEFAULT_FUZZY_THRESHOLD,
    });
  }

  function handleResultClick(wizard: Wizard, rank: number) {
    trackWizardResultClicked({
      wizardId: wizard.id,
      wizardName: wizard.displayName ?? "",
      resultRank: rank,
      queryLength: query.trim().length,
    });
  }

  function handleScroll() {
    const el = resultsRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    const maxPct = scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 100;
    const timeOnPageSec = Math.round((Date.now() - startedAtRef.current) / 1000);
    for (const threshold of SCROLL_THRESHOLDS) {
      if (maxPct >= threshold && !firedScrollRef.current.has(threshold)) {
        firedScrollRef.current.add(threshold);
        trackListScrollDepth({
          listName: RESULTS_LIST_NAME,
          maxScrollPercent: threshold,
          timeOnPageSec,
        });
      }
    }
  }

  const trimmed = query.trim();

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Weasley, Flamel…"
          aria-label="Search wizards"
          className="field-arcane w-full border-b border-moonlight/40 bg-transparent py-2 font-body text-body text-steel outline-none"
        />
      </form>

      <div
        ref={resultsRef}
        onScroll={handleScroll}
        className="mt-8 max-h-[28rem] overflow-y-auto"
      >
        {results.length === 0 ? (
          <p className="font-body text-body italic text-whisper">
            {trimmed ? `No wizards match “${trimmed}”.` : "Type to search the roster."}
          </p>
        ) : (
          <ul className="space-y-2">
            {results.map(({ wizard, rank }) => (
              <li key={wizard.id}>
                <button
                  type="button"
                  onClick={() => handleResultClick(wizard, rank)}
                  className="inline-flex min-h-11 w-full items-center rounded-soft px-3 py-2 text-left font-body text-body text-steel transition-colors duration-base ease-arcane hover:bg-bg-fog/50"
                >
                  <span className="font-mono text-mono-data text-moonlight/60">
                    {String(rank + 1).padStart(2, "0")}
                  </span>
                  <span className="ml-3">{wizard.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

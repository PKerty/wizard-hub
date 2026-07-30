"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  const [openId, setOpenId] = useState<string | null>(null);
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

  /**
   * Toggle a result's inline detail panel. Opening fires `Wizard Result Clicked`
   * — the rank at which the user confirmed "this is the wizard I wanted" is the
   * fuzzy-tuning signal (ADR-0028 feedback loop). Closing is a no-op for
   * analytics.
   */
  function handleToggleDetails(wizard: Wizard, rank: number) {
    const opening = openId !== wizard.id;
    if (opening) handleResultClick(wizard, rank);
    setOpenId(opening ? wizard.id : null);
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
            {results.map(({ wizard, rank }) => {
              const open = openId === wizard.id;
              return (
                <li key={wizard.id} className="rounded-soft">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => handleToggleDetails(wizard, rank)}
                    className="inline-flex min-h-11 w-full items-center rounded-soft px-3 py-2 text-left font-body text-body text-steel transition-colors duration-base ease-arcane hover:bg-bg-fog/50"
                  >
                    <span className="font-mono text-mono-data text-moonlight/60">
                      {String(rank + 1).padStart(2, "0")}
                    </span>
                    <span className="ml-3 flex-1">{wizard.displayName}</span>
                    <span className="ml-2 inline-flex items-center gap-1 font-mono text-mono-data text-moonlight/70">
                      {open ? "Hide" : "Details"}
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={"transition-transform duration-base ease-arcane " + (open ? "rotate-180" : "")}
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1">
                          {wizard.elixirNames.length > 0 ? (
                            <>
                              <p className="font-mono text-mono-data text-torchlight/80">
                                Known elixirs
                              </p>
                              <ul className="mt-2 flex flex-wrap gap-1.5">
                                {wizard.elixirNames.map((name) => (
                                  <li
                                    key={name}
                                    className="rounded-pill border border-moonlight/20 bg-bg-fog/40 px-2.5 py-1 font-mono text-mono-data text-moonlight"
                                  >
                                    {name}
                                  </li>
                                ))}
                              </ul>
                            </>
                          ) : (
                            <p className="font-body text-small italic text-whisper">
                              No known elixirs.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

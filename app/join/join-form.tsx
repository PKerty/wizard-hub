"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { identifyFanclubMember, trackFanclubJoined } from "@/lib/analytics";
import { saveWizardName } from "@/lib/user";

const HOUSE_OPTIONS = [
  { value: "gryffindor", label: "Gryffindor", color: "var(--color-house-gryffindor)" },
  { value: "slytherin", label: "Slytherin", color: "var(--color-house-slytherin)" },
  { value: "ravenclaw", label: "Ravenclaw", color: "var(--color-house-ravenclaw)" },
  { value: "hufflepuff", label: "Hufflepuff", color: "var(--color-house-hufflepuff)" },
] as const;

const HOUSE_VALUES = HOUSE_OPTIONS.map((o) => o.value);
type FavoriteHouse = (typeof HOUSE_OPTIONS)[number]["value"];

interface FormState {
  email: string;
  wizardName: string;
  favoriteHouse: FavoriteHouse | "";
}

function buildInitialState(initialFavoriteHouse?: string): FormState {
  const valid =
    initialFavoriteHouse && HOUSE_VALUES.includes(initialFavoriteHouse as FavoriteHouse)
      ? (initialFavoriteHouse as FavoriteHouse)
      : "";
  return { email: "", wizardName: "", favoriteHouse: valid };
}

/**
 * "Join the Fanclub" form (ADR-0008).
 *
 * On submit:
 * 1. Calls identifyFanclubMember (Amplitude setUserId + user properties).
 * 2. Fires Fanclub Joined event.
 * 3. Saves wizardName to localStorage so the UI can greet personally.
 * 4. Redirects to / where the hero swaps "wanderer" → wizardName.
 *
 * Optional `initialFavoriteHouse` (from ?favoriteHouse=<id> query string)
 * pre-selects a house — used by the JoinCta on the house detail page so users
 * don't have to re-pick the house they were just viewing.
 */
export function JoinForm({ initialFavoriteHouse }: { initialFavoriteHouse?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialState(initialFavoriteHouse));

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.email || !form.wizardName || !form.favoriteHouse) return;

    const normalizedEmail = form.email.trim().toLowerCase();
    const wizardName = form.wizardName.trim();
    const favoriteHouse = form.favoriteHouse as FavoriteHouse;

    identifyFanclubMember({
      email: normalizedEmail,
      wizardName,
      favoriteHouse,
    });
    trackFanclubJoined({
      favoriteHouse,
      wizardNameLength: wizardName.length,
    });
    saveWizardName(wizardName);

    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <label
          htmlFor="email"
          className="block font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="field-arcane mt-2 w-full border-b border-moonlight/40 bg-transparent py-2 font-body text-body text-steel outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="wizardName"
          className="block font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight"
        >
          Wizard Name
        </label>
        <input
          id="wizardName"
          type="text"
          required
          maxLength={50}
          value={form.wizardName}
          onChange={(e) => update("wizardName", e.target.value)}
          className="field-arcane mt-2 w-full border-b border-moonlight/40 bg-transparent py-2 font-body text-body text-steel outline-none"
        />
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="block font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
          Favorite House
        </legend>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HOUSE_OPTIONS.map((opt) => {
            const isSelected = form.favoriteHouse === opt.value;
            const inputId = `favoriteHouse-${opt.value}`;
            return (
              <label
                key={opt.value}
                htmlFor={inputId}
                className={
                  "group relative flex cursor-pointer flex-col items-center gap-3 rounded-card border p-4 transition-all duration-base ease-arcane " +
                  (isSelected
                    ? "border-torchlight bg-bg-mist/60 shadow-[0_0_24px_rgba(212,162,75,0.2)]"
                    : "border-moonlight/30 bg-bg-mist/30 hover:border-moonlight hover:bg-bg-mist/50")
                }
              >
                <input
                  id={inputId}
                  type="radio"
                  name="favoriteHouse"
                  value={opt.value}
                  checked={isSelected}
                  onChange={() => update("favoriteHouse", opt.value)}
                  required
                  className="absolute size-0 opacity-0"
                />

                {/* Shield placeholder — replaced by custom SVG heraldry in ADR-0015. */}
                <svg
                  viewBox="0 0 48 48"
                  width="48"
                  height="48"
                  fill="none"
                  aria-hidden="true"
                  style={{ color: opt.color }}
                >
                  <path
                    d="M24 4L8 10v14c0 9 6.5 17.5 16 20 9.5-2.5 16-11 16-20V10L24 4z"
                    fill="currentColor"
                    fillOpacity={isSelected ? 0.4 : 0.18}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                  />
                  <text
                    x="24"
                    y="29"
                    textAnchor="middle"
                    fontFamily="var(--font-display)"
                    fontSize="14"
                    fontWeight="600"
                    fill="var(--color-steel)"
                  >
                    {opt.label.charAt(0)}
                  </text>
                </svg>

                <span
                  className={
                    "font-display text-eyebrow uppercase tracking-[0.15em] " +
                    (isSelected ? "text-torchlight" : "text-moonlight")
                  }
                >
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <button
        type="submit"
        className="btn-primary mt-8 flex w-full items-center justify-center gap-2 rounded-soft bg-torchlight px-6 py-3 font-display text-eyebrow uppercase tracking-[0.2em] text-bg-void transition-all duration-base ease-arcane hover:shadow-[0_0_24px_rgba(212,162,75,0.25)] hover:brightness-110"
      >
        Join the Order
      </button>
    </form>
  );
}

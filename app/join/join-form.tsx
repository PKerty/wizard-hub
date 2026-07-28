"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { identifyFanclubMember, trackFanclubJoined } from "@/lib/analytics";
import { saveWizardName } from "@/lib/user";

const HOUSE_OPTIONS = [
  { value: "gryffindor", label: "Gryffindor" },
  { value: "slytherin", label: "Slytherin" },
  { value: "ravenclaw", label: "Ravenclaw" },
  { value: "hufflepuff", label: "Hufflepuff" },
] as const;

type FavoriteHouse = (typeof HOUSE_OPTIONS)[number]["value"];

interface FormState {
  email: string;
  wizardName: string;
  favoriteHouse: FavoriteHouse | "";
}

const INITIAL_STATE: FormState = {
  email: "",
  wizardName: "",
  favoriteHouse: "",
};

/**
 * "Join the Fanclub" form (ADR-0008).
 *
 * On submit:
 * 1. Calls identifyFanclubMember (Amplitude setUserId + user properties).
 * 2. Fires Fanclub Joined event.
 * 3. Saves wizardName to localStorage so the UI can greet personally.
 * 4. Redirects to / where the hero swaps "wanderer" → wizardName.
 *
 * No backend — purely client-side identity assignment.
 */
export function JoinForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

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
          className="mt-2 w-full border-b border-moonlight/40 bg-transparent py-2 font-body text-body text-steel outline-none transition-colors duration-base ease-arcane focus:border-torchlight"
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
          className="mt-2 w-full border-b border-moonlight/40 bg-transparent py-2 font-body text-body text-steel outline-none transition-colors duration-base ease-arcane focus:border-torchlight"
        />
      </div>

      <div>
        <label
          htmlFor="favoriteHouse"
          className="block font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight"
        >
          Favorite House
        </label>
        <select
          id="favoriteHouse"
          required
          value={form.favoriteHouse}
          onChange={(e) => update("favoriteHouse", e.target.value as FavoriteHouse | "")}
          className="mt-2 w-full border-b border-moonlight/40 bg-transparent py-2 font-body text-body text-steel outline-none transition-colors duration-base ease-arcane focus:border-torchlight"
        >
          <option value="" disabled className="bg-bg-void text-whisper">
            Choose your house…
          </option>
          {HOUSE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-bg-void text-steel">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-soft bg-torchlight px-6 py-3 font-display text-eyebrow uppercase tracking-[0.2em] text-bg-void transition-all duration-base ease-arcane hover:shadow-[0_0_24px_rgba(212,162,75,0.25)] hover:brightness-110"
      >
        Join the Order
      </button>
    </form>
  );
}

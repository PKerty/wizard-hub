import { getAllHouses } from "@/modules/houses";
import { HouseCard } from "@/components/houses/house-card";

// ADR-0005: ISR for catalog (24h revalidate).
export const revalidate = 86400;

export default async function HousesPage() {
  const houses = await getAllHouses();

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
        II. The Four Houses
      </p>

      <h1 className="mt-6 font-display text-display font-semibold leading-[1.1] text-steel">
        Choose your path.
      </h1>

      <p className="mt-6 max-w-2xl font-body text-body-lg text-moonlight">
        Each Hogwarts house carries its own virtues, founders, and ghosts.
        Walk through any door to learn what awaits you inside.
      </p>

      {houses.length === 0 ? (
        <p className="mt-16 font-body text-body text-whisper">
          The houses are silent. Try again later.
        </p>
      ) : (
        <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {houses.map((house) => (
            <li key={house.id}>
              <HouseCard house={house} source="houses_list" />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-16 border-t border-moonlight/20 pt-6">
        <p className="font-mono text-mono-data text-whisper">
          Folio II · /houses · {houses.length} houses catalogued · ISR 24h
        </p>
      </div>
    </main>
  );
}

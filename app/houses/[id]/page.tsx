import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllHouses, getHouseById } from "@/modules/houses";
import { HouseViewedTracker } from "./house-viewed-tracker";
import { BackToHouses } from "@/components/houses/back-to-houses";

// ADR-0005: ISR for catalog (24h revalidate).
export const revalidate = 86400;

// Pre-render all known houses at build time; others ISR on-demand.
export async function generateStaticParams() {
  const houses = await getAllHouses();
  return houses.map((h) => ({ id: h.id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string }>;
}

const VALID_SOURCES = ["list", "home", "direct"] as const;
type ViewedSource = (typeof VALID_SOURCES)[number];

function resolveSource(raw: string | undefined): ViewedSource {
  return VALID_SOURCES.includes(raw as ViewedSource) ? (raw as ViewedSource) : "direct";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const house = await getHouseById(id);
  if (!house) return { title: "House not found" };
  return { title: house.name };
}

export default async function HouseDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { source: rawSource } = await searchParams;
  const source = resolveSource(rawSource);

  const house = await getHouseById(id);
  if (!house) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <HouseViewedTracker house={house} source={source} />

      <BackToHouses fromHouseId={house.id} />

      <div className="mt-12">
        <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
          House · {house.element}
        </p>

        <h1 className="mt-6 font-display text-mega font-semibold leading-[0.95] text-steel">
          {house.name}
        </h1>

        <p className="mt-6 font-mono text-mono-data text-moonlight">
          Founder · {house.founder} · Animal · {house.animal} · Ghost · {house.ghost}
        </p>

        <p className="mt-8 max-w-2xl font-body text-body-lg text-moonlight">
          Colours: {house.houseColours}. Common room: {house.commonRoom}.
        </p>
      </div>

      {house.traitNames.length > 0 && (
        <section className="mt-16">
          <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
            Traits
          </p>
          <ul className="mt-6 flex flex-wrap gap-3">
            {house.traitNames.map((trait) => (
              <li
                key={trait}
                className="rounded-pill border border-moonlight/30 bg-bg-fog/50 px-4 py-2 font-mono text-mono-data text-moonlight"
              >
                {trait}
              </li>
            ))}
          </ul>
        </section>
      )}

      {house.headNames.length > 0 && (
        <section className="mt-16">
          <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
            Notable Heads
          </p>
          <ul className="mt-6 space-y-2 font-body text-body text-steel">
            {house.headNames.map((head) => (
              <li key={head}>· {head}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

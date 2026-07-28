import type { Metadata } from "next";
import { JoinForm } from "./join-form";

export const metadata: Metadata = {
  title: "Join the Order",
  description: "Bind your crystal orb to a house and join the wizard-hub fanclub.",
};

interface PageProps {
  searchParams: Promise<{ favoriteHouse?: string }>;
}

export default async function JoinPage({ searchParams }: PageProps) {
  const { favoriteHouse } = await searchParams;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
        III. Join the Order
      </p>

      <h1 className="mt-6 font-display text-mega font-semibold leading-[0.95] text-steel">
        Bind your <span className="shimmer shimmer-text">orb</span>.
      </h1>

      <p className="mt-8 max-w-xl font-body text-body-lg text-moonlight">
        Tell us your email, pick a wizard name, and choose the house you call home.
        We will remember you the next time the orb lights up.
      </p>

      <div className="mt-16">
        <JoinForm initialFavoriteHouse={favoriteHouse} />
      </div>
    </main>
  );
}

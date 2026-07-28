import { CtaLink } from "@/components/ui/cta-link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
        I. The Portal Opens
      </p>

      <h1 className="mt-6 font-display text-hero font-semibold leading-[1.05] text-steel">
        Welcome, <span className="shimmer shimmer-text">wanderer</span>.
      </h1>

      <p className="mt-8 max-w-2xl font-body text-body-lg text-moonlight">
        wizard-hub is the fanclub&apos;s guide into the Hogwarts world. Browse the four houses,
        learn their founders, and join the order.
      </p>

      <div className="mt-12">
        <CtaLink href="/houses" location="hero">
          Explore the Houses
        </CtaLink>
      </div>

      <div className="mt-16 border-t border-moonlight/20 pt-6">
        <p className="font-mono text-mono-data text-whisper">
          Folio I · / · v0.1.0 · scaffold
        </p>
      </div>
    </main>
  );
}

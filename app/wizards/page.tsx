import { getAllWizards } from "@/modules/wizards";
import { WizardSearch } from "./wizard-search";

// ADR-0005 / ADR-0028: ISR for the wizards roster (24h revalidate).
export const revalidate = 86400;

export default async function WizardsPage() {
  const wizards = await getAllWizards();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
        IV. The Roster
      </p>

      <h1 className="mt-6 font-display text-display font-semibold leading-[1.1] text-steel">
        Find a Wizard.
      </h1>

      <p className="mt-6 max-w-2xl font-body text-body-lg text-moonlight">
        Search the wizarding roster by name. Typos are tolerated — the fuzzy
        threshold is logged on every search so it can be tuned with data.
      </p>

      {wizards.length === 0 ? (
        <p className="mt-16 font-body text-body text-whisper">
          The roster is silent. Try again later.
        </p>
      ) : (
        <div className="mt-12">
          <WizardSearch wizards={wizards} />
        </div>
      )}
    </main>
  );
}

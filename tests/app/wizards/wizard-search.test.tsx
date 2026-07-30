import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WizardSearch } from "@/app/wizards/wizard-search";
import type { Wizard } from "@/modules/wizards";

vi.mock("@/lib/analytics", () => ({
  trackWizardSearchSubmitted: vi.fn(),
  trackWizardResultClicked: vi.fn(),
  trackListScrollDepth: vi.fn(),
}));

import { trackWizardResultClicked } from "@/lib/analytics";

beforeAll(() => {
  // Motion reads prefers-reduced-motion; jsdom has no matchMedia.
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

const wizards: Wizard[] = [
  { id: "w1", displayName: "Fred Weasley", elixirNames: ["Felix Felicis"] },
  { id: "w2", displayName: "Nicolas Flamel", elixirNames: [] },
];

describe("WizardSearch — See details (ADR-0028 feedback loop)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens the detail panel and fires the intent event at the result's rank", async () => {
    const user = userEvent.setup();
    render(<WizardSearch wizards={wizards} />);

    await user.type(screen.getByLabelText("Search wizards"), "Flamel");
    await user.click(screen.getByRole("button", { name: /Nicolas Flamel/ }));

    // rank 0 for the only match; the "this is the one" signal.
    expect(trackWizardResultClicked).toHaveBeenCalledExactlyOnceWith({
      wizardId: "w2",
      wizardName: "Nicolas Flamel",
      resultRank: 0,
      queryLength: "Flamel".length,
    });
    expect(screen.getByText("No known elixirs.")).toBeInTheDocument();
  });

  it("shows the elixir chips for a wizard that has them", async () => {
    const user = userEvent.setup();
    render(<WizardSearch wizards={wizards} />);

    await user.type(screen.getByLabelText("Search wizards"), "Weasley");
    await user.click(screen.getByRole("button", { name: /Fred Weasley/ }));

    expect(screen.getByText("Felix Felicis")).toBeInTheDocument();
  });

  it("does not refire the intent event when closing the panel", async () => {
    const user = userEvent.setup();
    render(<WizardSearch wizards={wizards} />);

    await user.type(screen.getByLabelText("Search wizards"), "Flamel");
    const btn = screen.getByRole("button", { name: /Nicolas Flamel/ });
    await user.click(btn); // open
    await user.click(btn); // close

    expect(trackWizardResultClicked).toHaveBeenCalledOnce();
  });
});

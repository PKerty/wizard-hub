import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinForm } from "./join-form";

vi.mock("@/lib/analytics", () => ({
  identifyFanclubMember: vi.fn(),
  trackFanclubJoined: vi.fn(),
}));

vi.mock("@/lib/user", () => ({
  saveWizardName: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

import { identifyFanclubMember, trackFanclubJoined } from "@/lib/analytics";
import { saveWizardName } from "@/lib/user";

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides?: Partial<{ email: string; wizardName: string; favoriteHouse: string }>,
) {
  await user.type(screen.getByLabelText(/email/i), overrides?.email ?? "hermione@hogwarts.edu");
  await user.type(screen.getByLabelText(/wizard name/i), overrides?.wizardName ?? "Hermione");
  // House picker is a radio group styled as shield cards.
  const house = overrides?.favoriteHouse ?? "ravenclaw";
  await user.click(screen.getByRole("radio", { name: new RegExp(house, "i") }));
}

describe("JoinForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the three required fields (degenerate case)", () => {
    render(<JoinForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wizard name/i)).toBeInTheDocument();
    // House picker: 4 radio inputs inside a fieldset named "Favorite House".
    expect(screen.getByRole("group", { name: /favorite house/i })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("renders all four houses as radio options", () => {
    render(<JoinForm />);
    const radios = screen.getAllByRole("radio");
    const values = radios.map((r) => (r as HTMLInputElement).value);
    expect(values).toEqual(["gryffindor", "slytherin", "ravenclaw", "hufflepuff"]);
  });

  it("does NOT fire analytics when submitting with empty fields (native validation blocks)", async () => {
    const user = userEvent.setup();
    render(<JoinForm />);

    await user.click(screen.getByRole("button", { name: /join/i }));

    expect(identifyFanclubMember).not.toHaveBeenCalled();
    expect(trackFanclubJoined).not.toHaveBeenCalled();
    expect(saveWizardName).not.toHaveBeenCalled();
  });

  it("calls identify + track + saveWizardName with normalized values on valid submit", async () => {
    const user = userEvent.setup();
    render(<JoinForm />);

    await fillForm(user, {
      email: "  HERMIONE@HOGWARTS.EDU  ",
      wizardName: "Hermione",
      favoriteHouse: "ravenclaw",
    });
    await user.click(screen.getByRole("button", { name: /join/i }));

    expect(identifyFanclubMember).toHaveBeenCalledExactlyOnceWith({
      email: "hermione@hogwarts.edu",
      wizardName: "Hermione",
      favoriteHouse: "ravenclaw",
    });
    expect(trackFanclubJoined).toHaveBeenCalledExactlyOnceWith({
      favoriteHouse: "ravenclaw",
      wizardNameLength: 8,
    });
    expect(saveWizardName).toHaveBeenCalledExactlyOnceWith("Hermione");
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinForm } from "./join-form";

vi.mock("@/lib/analytics", () => ({
  identifyFanclubMember: vi.fn(),
  trackFanclubJoined: vi.fn(),
}));

import { identifyFanclubMember, trackFanclubJoined } from "@/lib/analytics";

async function fillForm(user: ReturnType<typeof userEvent.setup>, overrides?: Partial<{
  email: string;
  wizardName: string;
  favoriteHouse: string;
}>) {
  await user.type(screen.getByLabelText(/email/i), overrides?.email ?? "hermione@hogwarts.edu");
  await user.type(screen.getByLabelText(/wizard name/i), overrides?.wizardName ?? "Hermione");
  await user.selectOptions(
    screen.getByLabelText(/favorite house/i),
    overrides?.favoriteHouse ?? "ravenclaw",
  );
}

describe("JoinForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the three required fields (degenerate case)", () => {
    render(<JoinForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wizard name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/favorite house/i)).toBeInTheDocument();
  });

  it("renders all four house options", () => {
    render(<JoinForm />);
    const select = screen.getByLabelText(/favorite house/i) as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    expect(optionValues).toEqual(["", "gryffindor", "slytherin", "ravenclaw", "hufflepuff"]);
  });

  it("does NOT fire analytics when submitting with empty fields (native validation blocks)", async () => {
    const user = userEvent.setup();
    render(<JoinForm />);

    // Submit without filling — HTML5 required validation prevents onSubmit.
    await user.click(screen.getByRole("button", { name: /join/i }));

    expect(identifyFanclubMember).not.toHaveBeenCalled();
    expect(trackFanclubJoined).not.toHaveBeenCalled();
  });

  it("calls identifyFanclubMember + trackFanclubJoined with normalized values on valid submit", async () => {
    const user = userEvent.setup();
    render(<JoinForm />);

    await fillForm(user, {
      email: "  HERMIONE@HOGWARTS.EDU  ",
      wizardName: "Hermione",
      favoriteHouse: "ravenclaw",
    });
    await user.click(screen.getByRole("button", { name: /join/i }));

    expect(identifyFanclubMember).toHaveBeenCalledExactlyOnceWith({
      email: "hermione@hogwarts.edu", // normalized: trim + lowercase
      wizardName: "Hermione",
      favoriteHouse: "ravenclaw",
    });
    expect(trackFanclubJoined).toHaveBeenCalledExactlyOnceWith({
      favoriteHouse: "ravenclaw",
      wizardNameLength: 8, // "Hermione".length
    });
  });

  it("shows a success message after submit and hides the form", async () => {
    const user = userEvent.setup();
    render(<JoinForm />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /join/i }));

    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  IngredientCard,
  sparkleTargets,
} from "@/components/potions/ingredient-card";

function stubMatchMedia(reduced: boolean) {
  const mq = {
    matches: reduced,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mq));
}

describe("sparkleTargets", () => {
  it("returns the requested number of targets (degenerate case)", () => {
    expect(sparkleTargets(1)).toHaveLength(1);
    expect(sparkleTargets(8)).toHaveLength(8);
  });

  it("distributes targets evenly around the circle", () => {
    const t = sparkleTargets(4, 10);
    // index 0 → angle 0 → (radius, 0)
    expect(t[0]!.x).toBeCloseTo(10, 5);
    expect(t[0]!.y).toBeCloseTo(0, 5);
    // index 1 → angle 90deg → (0, radius)
    expect(t[1]!.x).toBeCloseTo(0, 5);
    expect(t[1]!.y).toBeCloseTo(10, 5);
  });
});

describe("IngredientCard", () => {
  beforeEach(() => stubMatchMedia(false));
  afterEach(() => vi.unstubAllGlobals());

  it("renders the reagent name (degenerate case)", () => {
    render(<IngredientCard name="Dragon Blood" onSelect={() => {}} />);
    expect(screen.getByText("Dragon Blood")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<IngredientCard name="Lacewing" onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Lacewing" }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("does not call onSelect when disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<IngredientCard name="Lacewing" onSelect={onSelect} disabled />);
    await user.click(screen.getByRole("button", { name: "Lacewing" }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("exposes its tone via data-tone", () => {
    const { rerender } = render(
      <IngredientCard name="X" onSelect={() => {}} tone="wrong" />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("data-tone", "wrong");
    rerender(<IngredientCard name="X" onSelect={() => {}} tone="muted" />);
    expect(screen.getByRole("button")).toHaveAttribute("data-tone", "muted");
  });

  it("renders the correct-guess burst (ring + sparkles) only when tone is correct", () => {
    const { rerender } = render(
      <IngredientCard name="X" onSelect={() => {}} tone="default" />,
    );
    expect(screen.queryByTestId("burst-ring")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("sparkle")).toHaveLength(0);

    rerender(<IngredientCard name="X" onSelect={() => {}} tone="correct" />);
    expect(screen.getByTestId("burst-ring")).toBeInTheDocument();
    expect(screen.getAllByTestId("sparkle").length).toBeGreaterThan(0);
  });

  it("renders no burst under prefers-reduced-motion even when correct", () => {
    stubMatchMedia(true);
    render(<IngredientCard name="X" onSelect={() => {}} tone="correct" />);
    expect(screen.queryByTestId("burst-ring")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("sparkle")).toHaveLength(0);
  });
});

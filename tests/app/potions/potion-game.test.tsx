import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { PotionGame } from "@/app/potions/potion-game";

vi.mock("@/lib/analytics", () => ({
  trackPotionGameStarted: vi.fn(),
  trackPotionGameRestarted: vi.fn(),
  trackPotionGameWon: vi.fn(),
  trackPotionGameLost: vi.fn(),
  trackPotionRoundPlayed: vi.fn(),
}));

beforeAll(() => {
  // PotionGame reads prefers-reduced-motion at render; jsdom has no matchMedia.
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

describe("PotionGame", () => {
  it("renders the idle start screen (smoke — imports + Motion resolve)", () => {
    render(<PotionGame potions={[]} ingredients={[]} />);
    expect(screen.getByRole("button", { name: "Start brewing" })).toBeInTheDocument();
  });
});

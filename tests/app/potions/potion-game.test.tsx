import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PotionGame } from "@/app/potions/potion-game";

vi.mock("@/lib/analytics", () => ({
  trackPotionGameStarted: vi.fn(),
  trackPotionGameRestarted: vi.fn(),
  trackPotionGameWon: vi.fn(),
  trackPotionGameLost: vi.fn(),
  trackPotionRoundPlayed: vi.fn(),
}));

describe("PotionGame", () => {
  it("renders the idle start screen (smoke — imports + Motion resolve)", () => {
    render(<PotionGame potions={[]} ingredients={[]} />);
    expect(screen.getByRole("button", { name: "Start brewing" })).toBeInTheDocument();
  });
});

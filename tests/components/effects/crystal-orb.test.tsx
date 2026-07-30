import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CrystalOrb } from "@/components/effects/crystal-orb";

function stubMatchMedia(matches: boolean) {
  const mq = {
    matches,
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

describe("CrystalOrb", () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders the orb surface and the initial caption (degenerate case)", () => {
    render(<CrystalOrb />);
    expect(screen.getByText("Consulting…")).toBeInTheDocument();
    expect(document.querySelector(".crystal-orb")).toBeInTheDocument();
  });

  it("exposes role=status so screen readers announce the loading state", () => {
    render(<CrystalOrb />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("rotates the caption through the ritual phrases and wraps around", () => {
    vi.useFakeTimers();
    render(<CrystalOrb captionIntervalMs={1000} />);

    expect(screen.getByText("Consulting…")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("Revealing…")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("Summoning…")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("Consulting…")).toBeInTheDocument();
  });

  it("freezes the caption when the user prefers reduced motion", () => {
    stubMatchMedia(true);
    vi.useFakeTimers();
    render(<CrystalOrb captionIntervalMs={1000} />);

    vi.advanceTimersByTime(5000);
    expect(screen.getByText("Consulting…")).toBeInTheDocument();
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { CrystalIntro, INTRO_STORAGE_KEY } from "@/components/effects/crystal-intro";

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

describe("CrystalIntro", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reveals the orb overlay on first visit of the session", () => {
    vi.useFakeTimers();
    render(<CrystalIntro />);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const overlay = document.querySelector(".crystal-intro");
    expect(overlay).toBeInTheDocument();
    expect(overlay?.querySelector(".crystal-orb")).toBeInTheDocument();
  });

  it("stays hidden when the session was already introduced", () => {
    sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    render(<CrystalIntro />);
    expect(document.querySelector(".crystal-intro")).not.toBeInTheDocument();
  });

  it("never shows under prefers-reduced-motion", () => {
    stubMatchMedia(true);
    render(<CrystalIntro />);
    expect(document.querySelector(".crystal-intro")).not.toBeInTheDocument();
  });

  it("leaves and marks the session seen after the hold", () => {
    vi.useFakeTimers();
    render(<CrystalIntro />);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(document.querySelector(".crystal-intro")).toBeInTheDocument();
    expect(sessionStorage.getItem(INTRO_STORAGE_KEY)).toBeNull();

    // HOLD reached → the veil is fading out (still mounted), not yet marked seen.
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(document.querySelector(".crystal-intro")).toBeInTheDocument();
    expect(sessionStorage.getItem(INTRO_STORAGE_KEY)).toBeNull();

    // FADE done → unmounts + marks the session so it won't replay.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(document.querySelector(".crystal-intro")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(INTRO_STORAGE_KEY)).toBe("1");
  });
});

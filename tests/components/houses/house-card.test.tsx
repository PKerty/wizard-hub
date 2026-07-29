import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HouseCard } from "@/components/houses/house-card";
import type { House } from "@/modules/houses";

// Mock the analytics wrapper so we can assert calls without touching amplitude.
vi.mock("@/lib/analytics", () => ({
  trackHouseCardClicked: vi.fn(),
}));

import { trackHouseCardClicked } from "@/lib/analytics";

// Mock next/link so it renders as a plain <a> without router context.
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

function makeHouse(overrides: Partial<House> = {}): House {
  return {
    id: "gryffindor",
    name: "Gryffindor",
    houseColours: "Scarlet and Gold",
    founder: "Godric Gryffindor",
    animal: "Lion",
    element: "Fire",
    ghost: "Nearly Headless Nick",
    commonRoom: "Gryffindor Common Room",
    traitNames: ["Bravery", "Nerve"],
    headNames: [],
    ...overrides,
  };
}

describe("HouseCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders house name, founder, and element (degenerate case)", () => {
    const house = makeHouse();

    render(<HouseCard house={house} source="houses_list" />);

    expect(screen.getByText("Gryffindor")).toBeInTheDocument();
    expect(screen.getByText(/Godric Gryffindor/)).toBeInTheDocument();
    expect(screen.getByText(/Fire/)).toBeInTheDocument();
  });

  it("links to /houses/[id]?source=list when source is 'houses_list'", () => {
    const house = makeHouse({ id: "ravenclaw" });

    render(<HouseCard house={house} source="houses_list" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/houses/ravenclaw?source=list");
  });

  it("forwards source as ?source=home when source is 'home'", () => {
    const house = makeHouse({ id: "gryffindor" });

    render(<HouseCard house={house} source="home" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/houses/gryffindor?source=home");
  });

  it("fires trackHouseCardClicked with house data and source on click", async () => {
    const user = userEvent.setup();
    const house = makeHouse({ id: "slytherin", name: "Slytherin" });

    render(<HouseCard house={house} source="houses_list" />);

    await user.click(screen.getByRole("link"));

    expect(trackHouseCardClicked).toHaveBeenCalledExactlyOnceWith({
      houseId: "slytherin",
      houseName: "Slytherin",
      source: "houses_list",
    });
  });

  it("passes through the source prop (so home vs list is distinguishable in analytics)", async () => {
    const user = userEvent.setup();
    const house = makeHouse();

    render(<HouseCard house={house} source="home" />);

    await user.click(screen.getByRole("link"));

    expect(trackHouseCardClicked).toHaveBeenCalledWith(
      expect.objectContaining({ source: "home" }),
    );
  });
});

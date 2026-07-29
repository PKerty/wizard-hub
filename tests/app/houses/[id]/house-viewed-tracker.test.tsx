import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { HouseViewedTracker } from "@/app/houses/[id]/house-viewed-tracker";

vi.mock("@/lib/analytics", () => ({
  trackHouseViewed: vi.fn(),
}));

import { trackHouseViewed } from "@/lib/analytics";

const baseHouse = {
  id: "slytherin",
  name: "Slytherin",
  founder: "Salazar Slytherin",
} as const;

describe("HouseViewedTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing (degenerate case — it's a tracker, not visual)", () => {
    const { container } = render(
      <HouseViewedTracker house={baseHouse} source="list" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("fires trackHouseViewed exactly once on mount with house data and source", () => {
    render(<HouseViewedTracker house={baseHouse} source="list" />);

    expect(trackHouseViewed).toHaveBeenCalledExactlyOnceWith({
      houseId: "slytherin",
      houseName: "Slytherin",
      houseFounder: "Salazar Slytherin",
      source: "list",
    });
  });

  it("does not re-fire when re-rendered with the same house (StrictMode-safe)", () => {
    const { rerender } = render(
      <HouseViewedTracker house={baseHouse} source="list" />,
    );

    rerender(<HouseViewedTracker house={baseHouse} source="list" />);
    rerender(<HouseViewedTracker house={baseHouse} source="list" />);

    expect(trackHouseViewed).toHaveBeenCalledTimes(1);
  });

  it("passes through 'direct' source unchanged", () => {
    render(<HouseViewedTracker house={baseHouse} source="direct" />);

    expect(trackHouseViewed).toHaveBeenCalledWith(
      expect.objectContaining({ source: "direct" }),
    );
  });
});

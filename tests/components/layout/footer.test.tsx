import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/footer";

describe("Footer", () => {
  it("renders the brand mark (degenerate case)", () => {
    render(<Footer />);
    expect(screen.getByText("wizard-hub")).toBeInTheDocument();
  });

  it("does not render navigation links", () => {
    render(<Footer />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders the tagline centered", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(footer?.querySelector(".text-center")).not.toBeNull();
    expect(
      screen.getByText(/Solutions Architect Challenge/),
    ).toBeInTheDocument();
  });
});

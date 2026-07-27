import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Auto-cleanup DOM between tests (necessary because vitest runs with globals:false,
// which disables the automatic cleanup hook that @testing-library relies on).
afterEach(() => {
  cleanup();
});

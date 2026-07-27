"use client";

import { useEffect } from "react";
import { init as initAnalytics } from "@/lib/analytics";

/**
 * Client-side bootstrap for the app.
 * - Initializes Amplitude SDK exactly once (advanced-init-once pattern).
 * - Defers analytics load until after hydration to avoid blocking LCP
 *   (vercel-react-best-practices: bundle-defer-third-party).
 *
 * Server Components cannot call `useEffect`, so this lives in a Client Component
 * mounted once at the root layout.
 */

let didInit = false;
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (didInit) return;
    didInit = true;
    initAnalytics();
  }, []);

  return <>{children}</>;
}

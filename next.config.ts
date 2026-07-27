import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // typedRoutes: true — disabled until /houses/[id] exists (PR 003).
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;

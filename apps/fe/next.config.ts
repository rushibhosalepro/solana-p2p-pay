import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  distDir: "apps/fe/.next",
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

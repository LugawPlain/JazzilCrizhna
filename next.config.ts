import type { NextConfig } from "next";

// Add the analyzer import and configuration
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "**",
      },
    ],
    // Useful for images stored in GitHub LFS
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
    unoptimized: true, // Required for static export with default loader
  },
  // Ensure compatibility with Cloudflare Pages
  webpack: (config) => {
    // Handle WebAssembly files
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // Enhance caching for assets
    config.cache = {
      ...config.cache,
      type: "filesystem",
      buildDependencies: {
        config: [__filename],
      },
    };

    return config;
  },
  // Ensure output is appropriate for Cloudflare Pages
  output: "export",
};

// Wrap the existing export with the analyzer
export default withBundleAnalyzer(nextConfig);

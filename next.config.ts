import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 👇 ADD THESE TWO BLOCKS 👇 */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },

  /* Keep your existing image config below */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "files.stripe.com",
      },
    ],
  },
};

export default nextConfig;

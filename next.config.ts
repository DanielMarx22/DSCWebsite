import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io", // 👈 Allows Sanity images
      },
      {
        protocol: "https",
        hostname: "files.stripe.com", // 👈 Allows Stripe images (good to keep)
      },
    ],
  },
};

export default nextConfig;

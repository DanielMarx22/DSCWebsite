"use client";

import Script from "next/script";

export default function SquareLoader() {
  return (
    <Script
      src="https://web.squarecdn.com/v1/square.js"
      strategy="lazyOnload" // Loads efficiently without slowing down the page
      onLoad={() => console.log("✅ Square Script Loaded Successfully")}
      onError={(e) => console.error("❌ Square Script Failed to Load", e)}
    />
  );
}
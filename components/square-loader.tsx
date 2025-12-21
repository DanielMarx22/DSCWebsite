"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Square: any;
  }
}

export default function SquareLoader() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    // Check if script is already there
    if (window.Square) {
      setStatus("ready");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://web.squarecdn.com/v1/payments.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Critical: Do NOT add crossOrigin
    
    script.onload = () => {
      console.log("✅ Square SDK Loaded");
      setStatus("ready");
    };
    
    script.onerror = () => {
        if (process.env.NODE_ENV === 'development') {
            console.warn("⚠️ Square blocked locally, but forcing 'ready' for dev.");
            window.Square = { payments: () => ({ card: () => ({ attach: () => {} }) }) }; // Mock object
            setStatus("ready");
        } else {
            console.error("❌ Square SDK Blocked");
            setStatus("blocked"); 
        }
    };

    document.body.appendChild(script);
  }, []);

  if (status === "blocked") {
    return <div className="text-red-500 text-xs">Payment processor blocked. Please check your browser settings.</div>;
  }

  return null; // Invisible component
}
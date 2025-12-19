import type { Metadata } from "next";
import Script from "next/script"; // 👈 Import Next.js Script component
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Down South Corals",
  description: "Rare Corals, Low Prices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 1. Load Square Web Payments SDK */}
        <Script
          src="https://web.squarecdn.com/v1/payments.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-neutral-900 text-white">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
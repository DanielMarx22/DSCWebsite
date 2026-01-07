import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import SquareLoader from "@/components/square-loader"; // 👈 Import the loader we made

export const metadata: Metadata = {
  title: "Down South Corals",
  description: "Rare Corals, Low Prices",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>{/* Any custom head tags go here */}</head>
      {/* 1. RESTORED: bg-neutral-900 text-white (Fixes white background) 
         2. RESTORED: flex min-h-screen (Fixes layout structure)
      */}
      <body className="flex min-h-screen flex-col bg-neutral-900 text-white">
        {/* 3. ADDED: This loads the payment script invisibly */}
        <SquareLoader />

        <Navbar />

        <main className="flex-grow ">{children}</main>

        <Footer />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer"; // 👈 1. Import the Footer

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
      {/* Changed 'min-h-full' to 'min-h-screen' to ensure the footer 
         stays at the bottom even on empty pages 
      */}
      <body className="flex min-h-screen flex-col bg-neutral-900 text-white">
        <Navbar />
        {/* 'flex-grow' pushes the footer down */}
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer /> {/* 👈 2. Add the component here */}
      </body>
    </html>
  );
}

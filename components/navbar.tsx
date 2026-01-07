"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useCartStore } from "@/store/cart-store";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const { items } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const mainMenuItems = [
    { name: "All Products", href: "/products" },
    { name: "Corals", href: "/products/corals" },
    { name: "Fish", href: "/products/fish" },
    { name: "Inverts", href: "/products/inverts" },
    { name: "Supplies", href: "/products/supplies" },
    { name: "Aquariums", href: "/products/aquariums" },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setMobileOpen(false);
    router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <nav className="sticky top-0 z-[100] bg-black/85 backdrop-blur-md border-b border-white/10 text-white transition-all duration-300 shadow-2xl">
      {/* 1. TOP BAR */}
      <div className="container mx-auto flex items-center justify-between py-4 px-6 relative">
        {/* LEFT: HAMBURGER (Mobile) */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="md:hidden text-white hover:bg-white/10 p-2"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle Menu"
          >
            {mobileOpen ? (
              <XMarkIcon className="h-7 w-7" />
            ) : (
              <Bars3Icon className="h-7 w-7" />
            )}
          </Button>
        </div>

        {/* CENTER: LOGO (Desktop) */}
        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
          <Link href="/" className="flex items-center gap-3 group">
            {/* 🖼️ LOGO IMAGE (w-10 h-10) */}
            <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-110">
              <Image
                src="/favicon.ico"
                alt="DSC Logo"
                fill
                className="object-contain"
              />
            </div>
            {/* 🎨 COLORED TEXT (text-2xl) */}
            <span className="text-2xl font-extrabold tracking-tight whitespace-nowrap">
              Down South{" "}
              <span className="text-blue-500 group-hover:text-blue-400 transition-colors">
                Corals
              </span>
            </span>
          </Link>
        </div>

        {/* CENTER: LOGO (Mobile) */}
        <div className="md:hidden flex-grow flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-9 h-9">
              <Image
                src="/favicon.ico"
                alt="DSC Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-extrabold tracking-tight whitespace-nowrap">
              Down South <span className="text-blue-500">Corals</span>
            </span>
          </Link>
        </div>

        {/* RIGHT: SEARCH & CART */}
        <div className="flex items-center space-x-5">
          {/* DESKTOP SEARCH FORM */}
          <form
            onSubmit={handleSearch}
            className="hidden md:block relative group"
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-full border border-gray-700 bg-gray-900/50 text-white placeholder:text-gray-500 transition-all duration-300 w-28 focus:w-40 hover:w-40 hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none group-focus-within:text-blue-500" />
          </form>

          {/* MOBILE SEARCH ICON */}
          <Button
            variant="ghost"
            className="md:hidden text-white hover:bg-white/10 p-2"
            onClick={() => {
              const term = prompt("Search for products:");
              if (term)
                router.push(`/search?query=${encodeURIComponent(term)}`);
            }}
          >
            <MagnifyingGlassIcon className="h-6 w-6" />
          </Button>

          {/* CART ICON */}
          <Link
            href="/checkout"
            className="relative group p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ShoppingCartIcon className="h-7 w-7 group-hover:text-blue-400 transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-lg animate-in zoom-in border-2 border-black">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* 2. BOTTOM BAR (Desktop Links) */}
      <div className="hidden md:block border-t border-white/5 bg-black/40">
        <div className="container mx-auto flex justify-center space-x-12 py-3">
          {mainMenuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              // ✅ UPDATED: Changed text-base to text-lg
              className="relative text-lg font-medium text-gray-300 hover:text-white transition-colors group"
            >
              {item.name}
              {/* ✨ Cool Underline Hover Effect */}
              <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <nav className="absolute top-[100%] left-0 w-full bg-black/95 backdrop-blur-xl border-t border-white/10 shadow-2xl z-40 h-screen animate-in slide-in-from-top-5 duration-200">
          <ul className="flex flex-col p-6 space-y-4">
            {mainMenuItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="block text-gray-200 hover:text-blue-400 hover:bg-white/5 p-4 rounded-xl text-xl font-bold transition-all border border-transparent hover:border-white/10"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </nav>
  );
};

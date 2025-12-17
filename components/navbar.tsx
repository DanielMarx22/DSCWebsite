"use client";

import Link from "next/link";
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
  ];

  // Close mobile menu on desktop size change
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
    <nav className="sticky top-0 z-[100] bg-black shadow text-white">
      {/* 1. TOP BAR */}
      <div className="container mx-auto flex items-center justify-between py-4 px-4 relative">
        
        {/* LEFT: HAMBURGER */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="md:hidden text-white hover:bg-gray-800 p-2"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </Button>
        </div>

        {/* CENTER: LOGO */}
        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
          <Link href="/" className="text-xl font-bold hover:text-blue-600 whitespace-nowrap">
            Down South Corals
          </Link>
        </div>
        <div className="md:hidden flex-grow flex justify-center">
          <Link href="/" className="text-xl font-bold hover:text-blue-600 whitespace-nowrap">
            Down South Corals
          </Link>
        </div>

        {/* RIGHT: SEARCH & CART */}
        <div className="flex items-center space-x-4">
          
          {/* DESKTOP SEARCH FORM */}
          <form onSubmit={handleSearch} className="hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // 👇 THIS IS THE FIXED STYLING
              className="px-3 py-1 rounded-md border border-gray-700 transition-all duration-300 w-24 hover:w-48 focus:w-48 bg-gray-900 text-white placeholder:text-gray-400 focus:bg-blue-100 focus:text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {/* MOBILE SEARCH ICON */}
          <Button
            variant="ghost"
            className="md:hidden text-white hover:bg-gray-800 p-2"
            onClick={() => {
               const term = prompt("Search for products:");
               if (term) router.push(`/search?query=${encodeURIComponent(term)}`);
            }}
          >
            <MagnifyingGlassIcon className="h-6 w-6" />
          </Button>

          {/* CART ICON */}
          <Link href="/checkout" className="relative hover:text-gray-400">
            <ShoppingCartIcon className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* 2. BOTTOM BAR */}
      <div className="hidden md:block border-t border-gray-800">
        <div className="container mx-auto flex justify-center space-x-10 py-2">
          {mainMenuItems.map((item) => (
            <Link key={item.name} href={item.href} className="text-white hover:text-blue-600 py-1 px-2 transition duration-150">
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <nav className="absolute top-[4.5rem] w-full bg-gray-900 shadow-lg z-40 h-[calc(100vh-4.5rem)]">
          <ul className="flex flex-col p-4 space-y-2">
            {mainMenuItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="block text-white hover:bg-gray-800 p-4 rounded-md text-lg font-medium"
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
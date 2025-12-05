"use client";

import Link from "next/link";
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

  const mainMenuItems = [
    { name: "All Products", href: "/products" }, // 👈 Added this
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

  return (
    // Top-level nav is sticky and black
    <nav className="sticky top-0 z-50 bg-black shadow text-white">
      {/* 🌟 1. TOP BAR (Mobile/Desktop Header) 🌟 */}
      <div className="container mx-auto flex items-center justify-between py-4 px-4 relative">
        {/* === LEFT SIDE: HAMBURGER (Mobile) / Placeholder (Desktop) === */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="md:hidden text-white hover:bg-gray-800 p-2"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle Menu"
          >
            {mobileOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* === CENTER: TITLE (Logo) - TRUE PAGE CENTERED on Desktop === */}
        {/* Desktop True Center */}
        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)} // 👈 Force close menu on click
            className="text-xl font-bold hover:text-blue-600 whitespace-nowrap"
          >
            Down South Corals
          </Link>
        </div>
        {/* Mobile Flex Center */}
        <div className="md:hidden flex-grow flex justify-center">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)} // 👈 Force close menu on click
            className="text-xl font-bold hover:text-blue-600 whitespace-nowrap"
          >
            Down South Corals
          </Link>
        </div>

        {/* === RIGHT SIDE: Search & Cart (Mobile/Desktop) === */}
        <div className="flex items-center space-x-4">
          {/* DESKTOP SEARCH BAR */}
          <div className="hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 w-24 hover:w-48 focus:w-48 text-black"
              style={{ minWidth: "6rem" }}
            />
          </div>

          {/* MOBILE SEARCH ICON */}
          <Button
            variant="ghost"
            className="md:hidden text-white hover:bg-gray-800 p-2"
            onClick={() => alert("Open Search Mobile")}
            aria-label="Toggle Search"
          >
            <MagnifyingGlassIcon className="h-6 w-6" />
          </Button>

          {/* Cart Icon */}
          <Link
            href="/checkout"
            className="relative hover:text-gray-400"
            onClick={() => setMobileOpen(false)} // 👈 Good practice to close menu on cart click too
          >
            <ShoppingCartIcon className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ===================================== */}
      {/* 🌊 2. BOTTOM BAR (Desktop Tabs) 🌊 */}
      {/* ===================================== */}
      <div className="hidden md:block border-t border-gray-800">
        <div className="container mx-auto flex justify-center space-x-10 py-2">
          {mainMenuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-white hover:text-blue-600 py-1 px-2 transition duration-150"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* ===================================== */}
      {/* 📱 MOBILE HAMBURGER MENU OVERLAY 📱 */}
      {/* ===================================== */}
      {mobileOpen && (
        <nav
          className="absolute top-[4.5rem] w-full bg-gray-900 shadow-lg z-40"
          style={{ height: "calc(100vh - 4.5rem)" }}
        >
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
            <li>
              <Link
                href="/checkout"
                className="block text-white hover:bg-gray-800 p-4 rounded-md text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Checkout
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </nav>
  );
};

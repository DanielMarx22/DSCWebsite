"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState<boolean>(false);

  const { items } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const router = useRouter();

  const pathname = usePathname();
  const isStudio = pathname?.startsWith("/studio");

  // 👇 ADD THIS BACK: If we are in the studio, do not render the Navbar
  if (isStudio) {
    return null;
  }

  const [searchQuery, setSearchQuery] = useState("");

  const mainMenuItems = [
    { name: "All Products", href: "/products" },
    { 
      name: "Corals", 
      href: "/products/corals",
      subItems: [
        { name: "All Corals", href: "/products/corals" },
        { name: "WYSIWYG", href: "/products/corals?sub=wysiwyg" },
        { name: "SPS", href: "/products/corals?sub=sps" },
        { name: "LPS", href: "/products/corals?sub=lps" },
        { name: "Softies", href: "/products/corals?sub=softies" },
        { name: "Beginner", href: "/products/corals?sub=beginner" },
      ]
    },
    { name: "Saltwater Fish", href: "/products/saltwater-fish" },
    { name: "Freshwater", href: "/products/freshwater" },
    { name: "Inverts", href: "/products/inverts" },
    { name: "Supplies", href: "/products/supplies" },
    { name: "Aquariums", href: "/products/aquariums" },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setMobileOpen(false);
    setMobileSearchOpen(false);

    router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
  };

  return (
    // 👇 FIXED: Always Sticky, removed the conditional 'relative' class
    <nav className="sticky top-0 z-[100] bg-black/85 backdrop-blur-md border-b border-white/10 text-white transition-all duration-300 shadow-2xl">
      {/* 1. TOP BAR */}
      <div className="container mx-auto flex items-center justify-between py-4 px-6 relative">
        {/* LEFT: HAMBURGER (Mobile) */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="md:hidden text-white hover:bg-white/10 p-2"
            onClick={() => {
              setMobileOpen((prev) => !prev);
              setMobileSearchOpen(false);
            }}
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
            <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-110">
              <Image
                src="/favicon.ico"
                alt="DSC Logo"
                fill
                className="object-contain"
              />
            </div>
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
              setMobileSearchOpen((prev) => !prev);
              setMobileOpen(false);
            }}
          >
            {mobileSearchOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <MagnifyingGlassIcon className="h-6 w-6" />
            )}
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
            <div key={item.name} className="relative group">
              <Link
                href={item.href}
                className="relative text-lg font-medium text-gray-300 hover:text-white transition-colors block py-2"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              
              {item.subItems && (
                <div className="absolute left-1/2 -translate-x-1/2 top-[100%] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="bg-black/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl overflow-hidden min-w-[180px] flex flex-col py-2 mt-2">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className="px-6 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap text-base font-medium"
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE SEARCH BAR */}
      {mobileSearchOpen && (
        <div className="md:hidden absolute top-[100%] left-0 w-full bg-black/95 backdrop-blur-xl border-t border-b border-white/10 py-4 px-6 shadow-2xl animate-in slide-in-from-top-5 duration-200">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-full py-3 px-5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-full text-white"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

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
                {item.subItems && (
                  <ul className="flex flex-col pl-4 mt-2 space-y-1 border-l-2 border-gray-800 ml-4">
                    {item.subItems.map(subItem => (
                      <li key={subItem.name}>
                        <Link
                          href={subItem.href}
                          className="block text-gray-400 hover:text-white p-3 rounded-lg transition-colors text-lg font-medium hover:bg-white/5"
                          onClick={() => setMobileOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </nav>
  );
};

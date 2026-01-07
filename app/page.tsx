import Image from "next/image";
import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/carousel";
import { BrandCarousel } from "@/components/brand-carousel";
import { calculateSalePrice, Sale } from "@/lib/sale-utils";
// Using inline SVGs for icons to avoid dependency issues

// ✅ GLOBAL CURRENCY FORMATTER
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

function getDailyIndex(max: number) {
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return dayOfYear % max;
}

// 🖼️ IMAGE CONFIGURATION
const categoryImages: Record<string, string> = {
  Fish: "/images/backgrounds/fishbackground.webp",
  Corals: "/images/backgrounds/coralbackground.webp",
  Inverts: "/images/backgrounds/invertbackground.webp",
  Supplies: "/images/backgrounds/suppliesbackground.webp",
  Aquariums: "/images/backgrounds/aquarium.webp",
};

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  inventory: number;
  short_description?: string;
  category: string;
  tags?: string[];
}

export default async function Home() {
  const productsQuery = `
    *[_type == "product"] {
      _id,
      "name": title,
      "slug": slug.current,
      "imageUrl": images[0].asset->url,
      price,
      inventory,
      short_description, 
      category,
      tags
    }
  `;

  const salesQuery = `*[_type == "sale" && isActive == true]`;

  const [products, sales] = await Promise.all([
    client.fetch<Product[]>(productsQuery, {}, { next: { revalidate: 0 } }),
    client.fetch<Sale[]>(salesQuery, {}, { next: { revalidate: 0 } }),
  ]);

  const availableProducts = products.filter((p) => (p.inventory || 0) > 0);

  const expensiveProducts = availableProducts
    .sort((a, b) => (b.price || 0) - (a.price || 0))
    .slice(0, 5);

  const dailyIndex =
    expensiveProducts.length > 0 ? getDailyIndex(expensiveProducts.length) : 0;
  const featuredProduct = expensiveProducts[dailyIndex];

  const bestSellers = availableProducts.filter(
    (p) => p.tags && p.tags.includes("Best Seller")
  );

  const displayBestSellers =
    bestSellers.length > 0 ? bestSellers : availableProducts.slice(0, 8);

  const newArrivals = availableProducts.slice(0, 8);

  const featuredPriceData = featuredProduct
    ? calculateSalePrice(featuredProduct, sales)
    : null;

  return (
    <div className="bg-black min-h-screen text-white">
      {/* 🌊 HERO SECTION */}
      {/* Changed: Reduced pb-16 to pb-4 to kill the gap */}
      <section className="relative pt-24 pb-8 sm:pt-32 sm:pb-12 overflow-hidden flex flex-col justify-center">
        {/* 1. CINEMATIC BACKGROUND */}
        <div className="absolute inset-0 z-0">
          <Image
            src={categoryImages["Corals"]}
            alt="Reef Background"
            fill
            className="object-cover opacity-50"
            priority
          />
          {/* Gradient: Deep blue fade for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/60 via-black/60 to-black" />
        </div>

        <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight text-white mb-6 drop-shadow-2xl">
            Down South <span className="text-blue-400">Corals</span>
          </h1>
          <p className="text-gray-200 text-lg md:text-2xl max-w-2xl mb-10 drop-shadow-lg font-light">
            Premium aquaculture, sustainably grown corals, and healthy marine
            life delivered directly to your tank.
          </p>

          {/* PULSING CTA BUTTON */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-blue-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 animate-pulse"></div>
            <Button
              asChild
              size="lg"
              className="relative bg-blue-600 hover:bg-blue-500 rounded-full px-10 py-8 text-xl shadow-2xl"
            >
              <Link href="/products">Shop All</Link>
            </Button>
          </div>

          {/* 2. THE "COOL" GLASS BAR (Safe Content) */}
          <div className="mt-16 w-full max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
              {/* Feature 1: Premium Imports */}
              <div className="flex flex-col items-center gap-3 p-4">
                <div className="p-3 bg-purple-500/20 rounded-full text-purple-400">
                  {/* Crown/Premium Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg">Premium Imports</h3>
                <p className="text-sm text-gray-400">
                  Hand-selected for vibrant color & health.
                </p>
              </div>

              {/* Feature 2: WYSIWYG */}
              <div className="flex flex-col items-center gap-3 p-4 border-t md:border-t-0 md:border-l border-white/10">
                <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
                  {/* Camera/Eye Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg">WYSIWYG Selection</h3>
                <p className="text-sm text-gray-400">
                  What You See Is What You Get availability.
                </p>
              </div>

              {/* Feature 3: Secure Shipping */}
              <div className="flex flex-col items-center gap-3 p-4 border-t md:border-t-0 md:border-l border-white/10">
                <div className="p-3 bg-green-500/20 rounded-full text-green-400">
                  {/* Box/Package Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg">Secure Shipping</h3>
                <p className="text-sm text-gray-400">
                  Professional packaging for safe arrival.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND CAROUSEL */}
      <BrandCarousel />

      {/* FEATURED PRODUCT */}
      {featuredProduct && featuredPriceData && (
        <section className="py-20 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12 bg-black/50 border border-gray-800 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
              {featuredPriceData.isOnSale && (
                <div className="absolute top-0 right-0 bg-green-600 text-white font-bold px-12 py-2 rotate-45 translate-x-12 translate-y-6 shadow-lg z-20">
                  SALE
                </div>
              )}

              <div className="w-full md:w-1/2 relative h-[400px] rounded-xl overflow-hidden bg-gray-800 shadow-xl border border-gray-700">
                {featuredProduct.imageUrl ? (
                  <Image
                    src={featuredProduct.imageUrl}
                    alt={featuredProduct.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-yellow-500 text-black font-bold px-4 py-1 rounded-full uppercase text-sm z-10 shadow-lg">
                  Daily Feature
                </div>
              </div>

              <div className="w-full md:w-1/2 space-y-6">
                <h2 className="text-4xl font-bold">{featuredProduct.name}</h2>
                <p className="text-gray-400 text-lg">
                  {featuredProduct.short_description ||
                    "A premium selection from our exclusive collection."}
                </p>

                {/* 🏷️ FIXED PRICE DISPLAY */}
                <div className="text-3xl font-bold">
                  {featuredPriceData.isOnSale ? (
                    <div className="flex items-center gap-4">
                      <span className="text-green-400">
                        {formatMoney(featuredPriceData.salePrice)}
                      </span>
                      <span className="text-gray-500 line-through text-2xl">
                        {formatMoney(featuredPriceData.originalPrice)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-blue-400">
                      {formatMoney(featuredProduct.price)}
                    </span>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full px-8 bg-white text-black hover:bg-gray-200 shadow-lg transition-transform hover:scale-105"
                  >
                    <Link
                      href={`/products/${featuredProduct.category}/${featuredProduct.slug}`}
                    >
                      Buy Now
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES GRID */}
      {/* CATEGORIES SCROLL */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12 text-center">
          Shop by Category
        </h2>

        {/* Changed grid to flex + overflow for scrolling */}
        <div className="flex overflow-x-auto gap-4 pb-8 snap-x snap-mandatory scrollbar-hide">
          {["Fish", "Corals", "Inverts", "Supplies", "Tanks"].map((cat) => {
            const objectFitClass =
              cat === "Supplies" ? "object-contain" : "object-cover";

            return (
              <Link
                key={cat}
                href={`/products/${cat.toLowerCase()}`}
                // ✨ FIX: Added min-w, aspect-square, and snap-start
                className="group relative min-w-[200px] md:min-w-[250px] aspect-square bg-black rounded-xl overflow-hidden flex items-center justify-center border border-gray-700 hover:border-blue-500 transition-all shadow-lg hover:shadow-blue-900/20 snap-start"
              >
                {/* 🖼️ BACKGROUND IMAGE */}
                <Image
                  src={categoryImages[cat] || categoryImages["Corals"]} // Fallback safety
                  alt={`${cat} Category`}
                  fill
                  className={`${objectFitClass} group-hover:scale-110 transition-transform duration-700 opacity-90`}
                  sizes="(max-width: 768px) 50vw, 25vw"
                />

                {/* 🌑 DARK OVERLAY */}
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-500" />

                {/* 📝 TEXT LABEL */}
                <span className="z-10 text-2xl font-black uppercase tracking-widest text-white drop-shadow-lg group-hover:scale-105 transition-transform">
                  {cat}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Best Sellers</h2>
        <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide">
          {displayBestSellers.map((product) => {
            const { salePrice, originalPrice, isOnSale } = calculateSalePrice(
              product,
              sales
            );

            return (
              <div
                key={product._id}
                className="min-w-[280px] md:min-w-[320px] snap-start"
              >
                <Link
                  href={`/products/${product.category}/${product.slug}`}
                  className="block bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 transition-colors group relative"
                >
                  <div className="relative h-64 w-full bg-gray-800">
                    {product.imageUrl && (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    {isOnSale && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
                        SALE
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold truncate text-white">
                      {product.name}
                    </h3>

                    {/* 🏷️ FIXED PRICE DISPLAY */}
                    <div className="font-medium">
                      {isOnSale ? (
                        <div className="flex gap-2 items-center">
                          <span className="text-green-400">
                            {formatMoney(salePrice)}
                          </span>
                          <span className="text-gray-500 line-through text-sm">
                            {formatMoney(originalPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-blue-400">
                          {formatMoney(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* NEW ARRIVALS CAROUSEL */}
      <section className="py-20 bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold">New Arrivals</h2>
            <Link
              href="/products"
              className="text-blue-400 hover:text-blue-300 text-sm font-bold"
            >
              View All &rarr;
            </Link>
          </div>

          <Carousel products={newArrivals} sales={sales} />
        </div>
      </section>
    </div>
  );
}

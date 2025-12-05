import Image from "next/image";
import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { stripe } from "@/lib/stripe"; // We need Stripe for sorting prices!
import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/carousel";
import { BrandCarousel } from "@/components/brand-carousel";
import {
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Helper to get the "Daily Rotation Index" (0 to 4)
function getDailyIndex(max: number) {
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return dayOfYear % max;
}

export default async function Home() {
  // 1. Fetch ALL products from Sanity (we need to filter them manually)
  const sanityProducts = await client.fetch(`*[_type == "product"] {
    _id,
    "id": stripeId, 
    "name": title,
    "images": [image.asset->url],
    "inventory": inventory,
    "description": short_description,
    "tags": tags,
    "metadata": { "category": category }
  }`);

  // 2. Fetch Prices from Stripe for these products
  // (In a real large app, you'd store price in Sanity to skip this step, but this works for now)
  const productsWithPrice = await Promise.all(
    sanityProducts.map(async (p: any) => {
      if (!p.id) return { ...p, price: 0 };
      try {
        const stripeProd = await stripe.products.retrieve(p.id, {
          expand: ["default_price"],
        });
        const priceObj = stripeProd.default_price as any;
        return { ...p, price: priceObj?.unit_amount || 0 };
      } catch (e) {
        return { ...p, price: 0 };
      }
    })
  );

  // 3. Logic: Find Top 5 Most Expensive (Available) Items
  const expensiveProducts = productsWithPrice
    .filter((p: any) => p.inventory > 0) // Must be in stock
    .sort((a: any, b: any) => b.price - a.price) // Sort High to Low
    .slice(0, 5); // Take Top 5

  // 4. Logic: Pick Today's Winner
  const dailyIndex = getDailyIndex(expensiveProducts.length);
  const featuredProduct = expensiveProducts[dailyIndex];

  // 5. Logic: Best Sellers (Filter by "Best Seller" tag OR just random for now)
  const bestSellers = productsWithPrice.filter(
    (p: any) => p.tags && p.tags.includes("Best Seller")
  );
  // Fallback: If no tags, show 5 random items
  const displayBestSellers =
    bestSellers.length > 0 ? bestSellers : productsWithPrice.slice(0, 8);

  return (
    <div className="bg-black min-h-screen text-white">
      {/* HERO SECTION (Same as before) */}
      <section className="relative bg-gradient-to-b from-gray-900 to-black py-20 sm:py-32">
        {/* ... (Keep your existing Hero code here) ... */}
        <div className="container mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            Down South <span className="text-blue-500">Corals</span>
          </h1>
          <Button
            asChild
            size="lg"
            className="bg-blue-600 hover:bg-blue-500 rounded-full px-8 text-lg"
          >
            <Link href="/products">Shop All</Link>
          </Button>
        </div>
      </section>

      {/* BRAND CAROUSEL (New) */}
      <BrandCarousel />

      {/* FEATURED PRODUCT (New) */}
      {featuredProduct && (
        <section className="py-20 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12 bg-black/50 border border-gray-800 rounded-2xl p-8 md:p-12">
              {/* Image */}
              <div className="w-full md:w-1/2 relative h-[400px] rounded-xl overflow-hidden">
                <Image
                  src={featuredProduct.images[0]}
                  alt={featuredProduct.name}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-yellow-500 text-black font-bold px-4 py-1 rounded-full uppercase text-sm">
                  Daily Feature
                </div>
              </div>
              {/* Info */}
              <div className="w-full md:w-1/2 space-y-6">
                <h2 className="text-4xl font-bold">{featuredProduct.name}</h2>
                <p className="text-gray-400 text-lg">
                  {featuredProduct.description}
                </p>
                <p className="text-3xl font-bold text-blue-400">
                  ${(featuredProduct.price / 100).toFixed(2)}
                </p>
                <div className="flex gap-4">
                  <Button asChild size="lg" className="rounded-full px-8">
                    <Link
                      href={`/products/${featuredProduct.metadata.category}/${featuredProduct.id}`}
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

      {/* CATEGORIES (Keep existing) */}

      {/* BEST SELLERS (New Horizontal Scroll) */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Best Sellers</h2>
        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide">
          {displayBestSellers.map((product: any) => (
            <div
              key={product.id}
              className="min-w-[280px] md:min-w-[320px] snap-start"
            >
              {/* Reuse your existing Product Card Logic manually here for custom sizing */}
              <Link
                href={`/products/${product.metadata.category}/${product.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
              >
                <div className="relative h-64 w-full">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold truncate">{product.name}</h3>
                  <p className="text-gray-400">
                    ${(product.price / 100).toFixed(2)}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS CAROUSEL (Keep existing) */}
      <section className="py-20 bg-gray-900/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">New Arrivals</h2>
          <Carousel products={productsWithPrice.slice(0, 8)} />
        </div>
      </section>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/carousel";
import { BrandCarousel } from "@/components/brand-carousel";

// Helper to get the "Daily Rotation Index" (0 to 4)
function getDailyIndex(max: number) {
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return dayOfYear % max;
}

// Define the shape of our Sanity Product
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
  // 1. Fetch ALL products from Sanity
  const products = await client.fetch<Product[]>(`
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
  `);

  // 2. MASTER FILTER: Create a list of ONLY Available products
  // This ensures Out of Stock items never appear on the Home Page
  const availableProducts = products.filter((p) => (p.inventory || 0) > 0);

  // 3. Logic: Find Top 5 Most Expensive (Available) Items for the Featured Spot
  const expensiveProducts = availableProducts
    .sort((a, b) => (b.price || 0) - (a.price || 0)) // Sort High to Low
    .slice(0, 5); // Take Top 5

  // 4. Logic: Pick Today's Featured Winner
  // This rotates through the top 5 expensive items
  const dailyIndex = expensiveProducts.length > 0 ? getDailyIndex(expensiveProducts.length) : 0;
  const featuredProduct = expensiveProducts[dailyIndex];

  // 5. Logic: Best Sellers (Must be Available)
  const bestSellers = availableProducts.filter(
    (p) => p.tags && p.tags.includes("Best Seller")
  );
  
  // Fallback: Use other available products if no "Best Seller" tags are found
  const displayBestSellers =
    bestSellers.length > 0 ? bestSellers : availableProducts.slice(0, 8);

  // 6. Logic: New Arrivals (Must be Available)
  // We use the available list so no out-of-stock items show in the bottom carousel
  const newArrivals = availableProducts.slice(0, 8); 

  return (
    <div className="bg-black min-h-screen text-white">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-gray-900 to-black py-20 sm:py-32">
        <div className="container mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            Down South <span className="text-blue-500">Corals</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-8">
            Premium aquaculture, sustainably grown corals, and healthy marine life delivered directly to your tank.
          </p>
          
          {/* SHOP ALL BUTTON */}
          <Button
            asChild
            size="lg"
            className="bg-blue-600 hover:bg-blue-500 rounded-full px-8 text-lg"
          >
            <Link href="/products">Shop All</Link>
          </Button>
        </div>
      </section>

      {/* BRAND CAROUSEL */}
      <BrandCarousel />

      {/* FEATURED PRODUCT */}
      {featuredProduct && (
        <section className="py-20 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12 bg-black/50 border border-gray-800 rounded-2xl p-8 md:p-12">
              {/* Image */}
              <div className="w-full md:w-1/2 relative h-[400px] rounded-xl overflow-hidden bg-gray-800">
                {featuredProduct.imageUrl ? (
                  <Image
                    src={featuredProduct.imageUrl}
                    alt={featuredProduct.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
                )}
                <div className="absolute top-4 left-4 bg-yellow-500 text-black font-bold px-4 py-1 rounded-full uppercase text-sm z-10">
                  Daily Feature
                </div>
              </div>
              {/* Info */}
              <div className="w-full md:w-1/2 space-y-6">
                <h2 className="text-4xl font-bold">{featuredProduct.name}</h2>
                <p className="text-gray-400 text-lg">
                  {featuredProduct.short_description || "A premium selection from our exclusive collection."}
                </p>
                <p className="text-3xl font-bold text-blue-400">
                  ${featuredProduct.price}
                </p>
                <div className="flex gap-4">
                  <Button asChild size="lg" className="rounded-full px-8 bg-white text-black hover:bg-gray-200">
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
      <section className="py-20 container mx-auto px-4">
         <h2 className="text-3xl font-bold mb-12 text-center">Shop by Category</h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Fish', 'Corals', 'Inverts', 'Supplies'].map((cat) => (
                <Link 
                  key={cat} 
                  href={`/products/${cat.toLowerCase()}`}
                  className="group relative h-40 bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center border border-gray-700 hover:border-blue-500 transition-all"
                >
                    <span className="z-10 text-xl font-bold group-hover:scale-110 transition-transform">{cat}</span>
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
                </Link>
            ))}
         </div>
      </section>

      {/* BEST SELLERS (Horizontal Scroll) */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Best Sellers</h2>
        <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide">
          {displayBestSellers.map((product) => (
            <div
              key={product._id}
              className="min-w-[280px] md:min-w-[320px] snap-start"
            >
              <Link
                href={`/products/${product.category}/${product.slug}`}
                className="block bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 transition-colors group"
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
                </div>
                <div className="p-4">
                  <h3 className="font-bold truncate text-white">{product.name}</h3>
                  <p className="text-blue-400 font-medium">
                    ${product.price}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS CAROUSEL */}
      <section className="py-20 bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
             <h2 className="text-3xl font-bold">New Arrivals</h2>
             <Link href="/products" className="text-blue-400 hover:text-blue-300 text-sm font-bold">View All &rarr;</Link>
          </div>
          
          {/* We pass the FILTERED newArrivals list here */}
          <Carousel products={newArrivals} />
        </div>
      </section>
    </div>
  );
}
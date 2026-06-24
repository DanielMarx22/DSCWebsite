import Image from "next/image";
import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";
import Pagination from "@/components/Pagination";
import { Sale } from "@/lib/sale-utils";

// CONFIG
const ITEMS_PER_PAGE = 30;

// 🖼️ HEADER IMAGE MAPPING
const headerImages: Record<string, string> = {
  fish: "/images/backgrounds/fishbackground.webp",
  corals: "/images/backgrounds/coralbackground.webp",
  inverts: "/images/backgrounds/invertbackground.webp",
  supplies: "/images/backgrounds/radionxr30background.webp",
  aquariums: "/images/backgrounds/aquarium.webp",
};

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  inventory: number;
  imageUrl: string;
  category: string;
  tags?: string[];
}

interface PageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string; showAll?: string }>;
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { categorySlug } = await params;
  const { page, showAll } = await searchParams;

  const showOutOfStock = showAll === "true";
  const currentPage = Number(page) || 1;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  const inventoryFilter = showOutOfStock ? "" : "&& inventory > 0";
  const queryFilter = `_type == "product" && category == $category ${inventoryFilter}`;

  const productsQuery = `
    *[${queryFilter}] | order(inventory desc, _createdAt desc) [$start...$end] {
      _id,
      "name": title,
      "slug": slug.current,
      "imageUrl": images[0].asset->url,
      price,
      inventory,
      category,
      tags
    }
  `;

  const countQuery = `count(*[${queryFilter}])`;
  const salesQuery = `*[_type == "sale" && isActive == true]`;

  const fetchOptions = { next: { revalidate: 0 } };
  const queryParams = { category: categorySlug, start, end };

  const [products, totalCount, sales] = await Promise.all([
    client.fetch<Product[]>(productsQuery, queryParams, fetchOptions),
    client.fetch<number>(countQuery, queryParams, fetchOptions),
    client.fetch<Sale[]>(salesQuery, {}, fetchOptions),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;
  const headerImageSrc =
    headerImages[categorySlug.toLowerCase()] || headerImages["corals"];

  return (
    // 1. OUTER WRAPPER: Full width breakout
    <div className="bg-black min-h-screen w-[100vw] relative left-[calc(-50vw+50%)] overflow-x-hidden">
      {/* 🖼️ HERO WRAPPER */}
      <div className="w-full bg-black flex justify-center border-b border-gray-900">
        {/* ✨ FIX: STRICT ASPECT RATIO
            - aspect-[16/9]: On mobile, it stays a rectangle (like a YouTube video).
            - md:aspect-[3/1]: On desktop, it becomes a thin cinematic strip.
            - max-h-[500px]: Stops it from getting too tall on giant screens.
            - Removed min-h-[300px] which was forcing the square shape!
        */}
        <div className="relative w-full max-w-[1800px] aspect-[16/9] md:aspect-[3/1] max-h-[500px] overflow-hidden">
          <Image
            src={headerImageSrc}
            alt={`${categorySlug} collection`}
            fill
            className="object-cover"
            priority
            quality={100}
            unoptimized={true}
          />
          <div className="absolute inset-0 bg-black/30" />

          {/* Centered Title */}
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="relative z-10 text-[8vw] md:text-7xl font-black capitalize text-white drop-shadow-2xl tracking-tighter leading-none text-center">
              {categorySlug}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                Collection
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* 📦 CONTENT WRAPPER */}
      <div className="w-full">
        <ProductList
          products={products}
          sales={sales}
          totalCount={totalCount}
          emptyMessage={`Sorry, we are currently out of stock for ${categorySlug}. Please check back soon!`}
        />

        <div className="mt-12 pb-12 px-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={`/products/${categorySlug}`}
          />
        </div>
      </div>
    </div>
  );
}

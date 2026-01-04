import Image from "next/image";
import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";
import Pagination from "@/components/Pagination";
import { Sale } from "@/lib/sale-utils";

const ITEMS_PER_PAGE = 30;

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  category: string;
  inventory: number;
  tags?: string[];
}

interface PageProps {
  searchParams: Promise<{ page?: string; showAll?: string }>;
}

export default async function AllProductsPage({ searchParams }: PageProps) {
  const { page, showAll } = await searchParams;

  // 1. FILTERS
  const showOutOfStock = showAll === "true";
  const currentPage = Number(page) || 1;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  const baseFilter = `_type == "product" ${showOutOfStock ? "" : "&& inventory > 0"}`;

  // 2. QUERIES
  const productsQuery = `
    *[${baseFilter}] | order(inventory desc, _createdAt desc) [$start...$end] {
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

  const countQuery = `count(*[${baseFilter}])`;
  const salesQuery = `*[_type == "sale" && isActive == true]`;

  // 3. FETCH EVERYTHING (Parallel)
  const fetchOptions = { next: { revalidate: 0 } };

  const [products, totalCount, sales] = await Promise.all([
    client.fetch<Product[]>(productsQuery, { start, end }, fetchOptions),
    client.fetch<number>(countQuery, {}, fetchOptions),
    client.fetch<Sale[]>(salesQuery, {}, fetchOptions),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  return (
    // 1. OUTER WRAPPER: Force Full Width (Break out of layout constraints)
    <div className="bg-black min-h-screen w-[100vw] relative left-[calc(-50vw+50%)] overflow-x-hidden">

      {/* 🖼️ HERO WRAPPER */}
      <div className="w-full bg-black flex justify-center border-b border-gray-900">

        {/* CONSTRAINED IMAGE BOX (Same logic as Category Page) */}
        <div className="relative w-full max-w-[1800px] aspect-[16/9] md:aspect-[3/1] max-h-[500px] overflow-hidden">
          <Image
            src="/images/backgrounds/rockflower.webp" // Default image for All Products
            alt="All Products"
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
              All <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Products</span>
            </h1>
          </div>
        </div>
      </div>

      {/* 📦 CONTENT WRAPPER */}
      <div className="w-full">
        {products.length > 0 ? (
          <>
            <ProductList
              products={products}
              sales={sales}
              emptyMessage="No products found matching your criteria."
            />
          </>
        ) : (
          /* Fallback if database is empty (rare) */
          <div className="text-center py-20 bg-gray-900/50">
            <p className="text-gray-400 text-lg">No products found.</p>
          </div>
        )}

        {/* PAGINATION */}
        <div className="mt-12 pb-12 px-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/products"
          />
        </div>
      </div>
    </div>
  );
}
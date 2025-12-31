import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";
import Pagination from "@/components/Pagination";
import { Sale } from "@/lib/sale-utils"; // 👈 1. Import Sale Type

// CONFIG
const ITEMS_PER_PAGE = 30;

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

export default async function CategoryPage({ params, searchParams }: PageProps) {
  // Await Params
  const { categorySlug } = await params;
  const { page, showAll } = await searchParams;

  // Determine Filters & Pagination
  const showOutOfStock = showAll === "true";
  const currentPage = Number(page) || 1;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  // Construct Filter Strings
  const inventoryFilter = showOutOfStock ? "" : "&& inventory > 0";
  const queryFilter = `_type == "product" && category == $category ${inventoryFilter}`;

  // Queries
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

  // 👇 NEW: Fetch Active Sales
  const salesQuery = `*[_type == "sale" && isActive == true]`;

  // Fetch Data (Parallel)
  const fetchOptions = { next: { revalidate: 0 } };
  const queryParams = { category: categorySlug, start, end };

  // 👇 ADDED 'sales' TO THE PROMISE
  const [products, totalCount, sales] = await Promise.all([
    client.fetch<Product[]>(productsQuery, queryParams, fetchOptions),
    client.fetch<number>(countQuery, queryParams, fetchOptions),
    client.fetch<Sale[]>(salesQuery, {}, fetchOptions), // 👈 Fetch Sales
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-extrabold capitalize mb-8 text-white">
        {categorySlug} Collection
      </h1>

      {/* 👇 PASS 'sales' TO THE LIST */}
      <ProductList
        products={products}
        sales={sales}
        emptyMessage={`Sorry, we are currently out of stock for ${categorySlug}. Please check back soon!`}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl={`/products/${categorySlug}`}
      />
    </div>
  );
}
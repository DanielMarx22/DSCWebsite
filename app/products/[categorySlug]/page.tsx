import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";
import Pagination from "@/components/Pagination";

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
  const fetchOptions = { next: { revalidate: 0 } };
  const queryParams = { category: categorySlug, start, end };

  const [products, totalCount] = await Promise.all([
    client.fetch<Product[]>(productsQuery, queryParams, fetchOptions),
    client.fetch<number>(countQuery, queryParams, fetchOptions),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  // REMOVED: The "If empty return" block is GONE.
  // We now render the full layout below regardless of product count.

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-extrabold capitalize mb-8 text-white">
        {categorySlug} Collection
      </h1>

      {/* Always render ProductList. If empty, it shows sidebar + empty message */}
      <ProductList
        products={products}
        emptyMessage={`Sorry, we are currently out of stock for ${categorySlug}. Please check back soon!`}
      />

      {/* Pagination is always visible (disabled if 1 page) */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl={`/products/${categorySlug}`}
      />
    </div>
  );
}
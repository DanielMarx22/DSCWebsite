import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";
import Pagination from "@/components/Pagination"; // 👈 New Import

// 1. Config: How many items per page?
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
  searchParams: Promise<{ page?: string }>; // 👈 Added searchParams for pagination
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  // 2. Await both params (Next.js 15 requirement)
  const { categorySlug } = await params;
  const { page } = await searchParams;

  // 3. Calculate Pagination Range
  const currentPage = Number(page) || 1;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  // 4. Update Query to use Slicing [$start...$end]
  // We also fetch the 'count' to know how many pages to show
  const productsQuery = `
    *[_type == "product" && category == $category] | order(_createdAt desc) [$start...$end] {
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

  const countQuery = `count(*[_type == "product" && category == $category])`;

  // 5. Fetch Data in Parallel (Fast)
  const [products, totalCount] = await Promise.all([
    client.fetch<Product[]>(productsQuery, { category: categorySlug, start, end }),
    client.fetch<number>(countQuery, { category: categorySlug }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // 6. Handle "No Products" State
  if (!products || products.length === 0) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-4xl font-extrabold capitalize mb-4 text-white">
          {categorySlug}
        </h1>
        <p className="text-gray-400">
          {currentPage > 1 ? "No more products on this page." : "No products found."}
        </p>
        {/* Allow user to go back if they are on an empty page (e.g. page 99) */}
        {currentPage > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl={`/products/${categorySlug}`}
            />
          </div>
        )}
      </div>
    );
  }

  // 7. Render Layout (Unchanged structure, just added Pagination at bottom)
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-extrabold capitalize mb-8 text-white">
        {categorySlug} Collection
      </h1>

      {/* Existing Product List Component */}
      <ProductList products={products} />

      {/* New Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl={`/products/${categorySlug}`}
      />
    </div>
  );
}
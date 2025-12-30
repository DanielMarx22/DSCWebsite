import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";
import Pagination from "@/components/Pagination";

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

  // 1. DETERMINE FILTERS
  // NOTE: If your tabs use a different URL param (like ?tab=out-of-stock), change 'showAll' below!
  const showOutOfStock = showAll === "true";
  const currentPage = Number(page) || 1;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  // 2. DEFINE THE FILTER STRING ONCE
  // This guarantees the List and the Count see the exact same products.
  const baseFilter = `_type == "product" ${showOutOfStock ? "" : "&& inventory > 0"}`;

  // 3. FETCH PRODUCTS (The List)
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

  // 4. FETCH COUNT (The Pagination Number)
  const countQuery = `count(*[${baseFilter}])`;

  // 5. DEBUG LOG (Check your server terminal to see what's happening)
  console.log(`[Server] Filter: "${baseFilter}"`);

  // 6. EXECUTE QUERIES (With no-store to prevent caching bugs)
  const fetchOptions = { next: { revalidate: 0 } }; // Force fresh data

  const [products, totalCount] = await Promise.all([
    client.fetch<Product[]>(productsQuery, { start, end }, fetchOptions),
    client.fetch<number>(countQuery, {}, fetchOptions),
  ]);

  console.log(`[Server] Found ${products.length} products. Total count: ${totalCount}`);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  return (
    <div className="container mx-auto py-10 px-4">

      <h1 className="text-4xl font-extrabold text-white mb-8">
        All Products
      </h1>

      {products.length > 0 ? (
        <>
          <ProductList products={products} />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/products"
          />
        </>
      ) : (
        <div className="text-center py-20 bg-gray-900/50 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-lg">No products found.</p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/products"
          />
        </div>
      )}
    </div>
  );
}
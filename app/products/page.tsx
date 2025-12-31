import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";
import Pagination from "@/components/Pagination";
import { Sale } from "@/lib/sale-utils"; // 👈 Import the Type

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

  // 👇 NEW: Fetch Active Sales
  const salesQuery = `*[_type == "sale" && isActive == true]`;

  // 3. FETCH EVERYTHING (Parallel)
  const fetchOptions = { next: { revalidate: 0 } }; // Force fresh data

  const [products, totalCount, sales] = await Promise.all([
    client.fetch<Product[]>(productsQuery, { start, end }, fetchOptions),
    client.fetch<number>(countQuery, {}, fetchOptions),
    client.fetch<Sale[]>(salesQuery, {}, fetchOptions), // 👈 Fetch Sales
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  return (
    <div className="container mx-auto py-10 px-4">

      <h1 className="text-4xl font-extrabold text-white mb-8">
        All Products
      </h1>

      {products.length > 0 ? (
        <>
          {/* 👇 Pass 'sales' to the list */}
          <ProductList products={products} sales={sales} />

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
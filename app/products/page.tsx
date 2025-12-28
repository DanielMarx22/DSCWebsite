import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";
import Pagination from "@/components/Pagination";

// 1. SETTINGS
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
  searchParams: Promise<{ page?: string }>;
}

export default async function AllProductsPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  // 2. UPDATED QUERY: Sort by inventory first!
  // 'inventory desc' puts items with stock (5, 4, 1) at the top.
  // Items with 0 stock go to the bottom.
  const productsQuery = `
    *[_type == "product"] | order(inventory desc, _createdAt desc) [$start...$end] {
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

  const countQuery = `count(*[_type == "product"])`;

  const [products, totalCount] = await Promise.all([
    client.fetch<Product[]>(productsQuery, { start, end }),
    client.fetch<number>(countQuery),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-extrabold mb-8 text-white">
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
        <p className="text-gray-400 text-center py-20">
          No products found.
        </p>
      )}
    </div>
  );
}
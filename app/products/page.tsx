import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";

// Define the shape of data we need
interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  category: string;
  inventory: number; // 👈 Added this
  tags?: string[];
}

export default async function AllProductsPage() {
  // Fetch ALL products (Sorted by newest)
  const products = await client.fetch<Product[]>(`
    *[_type == "product"] | order(_createdAt desc) {
      _id,
      "name": title,
      "slug": slug.current,
      "imageUrl": images[0].asset->url,
      price,
      inventory, // 👈 FETCHING INVENTORY IS CRITICAL
      category,
      tags
    }
  `);

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-extrabold mb-8 text-white">
        All Products
      </h1>
      <ProductList products={products} />
    </div>
  );
}
import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";

interface SearchPageProps {
  searchParams: Promise<{ query?: string }>;
}

// Define Product Shape
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { query } = await searchParams;
  const searchTerm = query || "";

  // 1. If no search term, return empty state
  if (!searchTerm) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Search Results</h1>
        <p className="text-gray-500">Please enter a search term.</p>
      </div>
    );
  }

  // 2. Query Sanity for matches in Title, Tags, or Category
  // The '*' acts as a wildcard so "Tang" finds "Gem Tang"
  const products = await client.fetch<Product[]>(`
    *[_type == "product" && (
      title match $term + "*" || 
      category match $term + "*" || 
      tags[] match $term + "*"
    )] {
      _id,
      "name": title,
      "slug": slug.current,
      "imageUrl": images[0].asset->url,
      price,
      inventory,
      category,
      tags
    }
  `, { term: searchTerm });

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">
        Search Results for "{searchTerm}"
      </h1>
      <p className="text-gray-500 mb-8">
        Found {products.length} product{products.length === 1 ? "" : "s"}
      </p>

      {/* Reuse your existing robust ProductList component */}
      <ProductList products={products} />
    </div>
  );
}
import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";

interface SearchPageProps {
  searchParams: Promise<{ query?: string; showAll?: string }>;
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
  // Await params (Next.js 15 requirement)
  const { query, showAll } = await searchParams;
  const searchTerm = query || "";

  // 👇 CHECK THE FILTER STATUS
  const isShowAll = showAll === "true";

  // 1. If no search term, return empty state
  if (!searchTerm) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Search Results</h1>
        <p className="text-gray-500">Please enter a search term.</p>
      </div>
    );
  }

  // 2. Build the Query Condition
  // We construct the "Filter String" based on whether showAll is active
  const stockCondition = isShowAll ? "" : "&& inventory > 0";

  const sanityQuery = `
    {
      "products": *[_type == "product" && (
        title match $term + "*" || 
        category match $term + "*" || 
        tags[] match $term + "*"
      ) ${stockCondition}] {   // 👈 Insert Stock Condition Here
        _id,
        "name": title,
        "slug": slug.current,
        "imageUrl": images[0].asset->url,
        price,
        inventory,
        category,
        tags
      },
      "totalCount": count(*[_type == "product" && (
        title match $term + "*" || 
        category match $term + "*" || 
        tags[] match $term + "*"
      ) ${stockCondition}])
    }
  `;

  // 3. Fetch Data
  const { products, totalCount } = await client.fetch(sanityQuery, {
    term: searchTerm,
  });

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">
        Search Results for "{searchTerm}"
      </h1>

      {/* ProductList will handle the "Showing X of Y" text using totalCount */}
      <ProductList products={products} totalCount={totalCount} />
    </div>
  );
}

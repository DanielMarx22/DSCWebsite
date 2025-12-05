import { stripe } from "@/lib/stripe";
import { ProductList } from "@/components/product-list";
import { notFound } from "next/navigation";
import type { Stripe } from "stripe";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  // 1. Await params (Next.js 15 requirement)
  const { categorySlug } = await params;

  // 2. Search Stripe using the metadata query
  // Note: We use quotes around the value to handle strings properly
  const searchResult = await stripe.products.search({
    query: `active:'true' AND metadata['category']:'${categorySlug}'`,
    limit: 100,
    expand: ["data.default_price"],
  });

  const products = searchResult.data;

  // 3. Handle empty results (Optional: customize this UI)
  if (!products || products.length === 0) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-4xl font-extrabold capitalize mb-4 text-white">
          {categorySlug}
        </h1>
        <p className="text-gray-400 text-lg">
          We currently don't have any {categorySlug} in stock. Check back soon!
        </p>
      </div>
    );
  }

  // 4. Render - ensuring we pass the prop name 'products' to match your other pages
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-extrabold capitalize mb-8 text-white">
        {categorySlug} Collection
      </h1>
      <ProductList products={products} />
    </div>
  );
}

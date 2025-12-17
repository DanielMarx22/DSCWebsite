import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  category: string;
  tags?: string[];
}

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;

  const products = await client.fetch<Product[]>(`
    *[_type == "product" && category == $category] {
      _id,
      "name": title,
      "slug": slug.current,
      "imageUrl": images[0].asset->url,
      price,
      inventory, // 👈 ADD THIS LINE (It was missing!)
      category,
      tags
    }
  `, { category: categorySlug });

  if (!products || products.length === 0) {
     return (
        <div className="container mx-auto py-20 px-4 text-center">
            <h1 className="text-4xl font-extrabold capitalize mb-4 text-white">
                {categorySlug}
            </h1>
            <p className="text-gray-400">No products found.</p>
        </div>
     );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-extrabold capitalize mb-8 text-white">
        {categorySlug} Collection
      </h1>
      <ProductList products={products} />
    </div>
  );
}
import { client } from "@/sanity/lib/client";
import CheckoutClient from "@/components/checkout-client";

// Define shape for recommendations
interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  category: string;
  inventory: number;
}

export default async function CheckoutPage() {
  // Fetch ~4 random "Best Sellers" or just generic products for the recommendation engine
  const recommendations = await client.fetch<Product[]>(`
    *[_type == "product" && inventory > 0] | order(_createdAt desc)[0...4] {
      _id,
      "name": title,
      "slug": slug.current,
      "imageUrl": images[0].asset->url,
      price,
      inventory,
      category
    }
  `);

  return (
    <div className="min-h-screen bg-black text-white">
      <CheckoutClient recommendations={recommendations} />
    </div>
  );
}
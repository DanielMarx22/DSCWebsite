import { client } from "@/sanity/lib/client";
import { ProductList } from "@/components/product-list";

export default async function ProductsPage() {
  // Fetch from Sanity (with the Stripe ID so we can resolve prices later if needed)
  const products = await client.fetch(`*[_type == "product"] {
    _id,
    "id": stripeId,             // Map Sanity ID to 'id'
    "name": title,              // 👈 FIX 1: Map 'title' to 'name'
    "images": [image.asset->url], // 👈 FIX 2: Put the single image in an array so 'images[0]' works
    "inventory": inventory,
    "metadata": { 
        "category": category,
        "short_description": short_description 
    },
    "description": short_description // 👈 FIX 3: Map short desc so search works
  }`);

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">
        All Products
      </h1>
      <ProductList products={products} />
    </div>
  );
}

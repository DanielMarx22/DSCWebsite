import { client } from "@/sanity/lib/client";
import { stripe } from "@/lib/stripe";
import { ProductList } from "@/components/product-list";

// This prevents the page from caching forever, ensuring prices stay fresh
export const revalidate = 60;

export default async function ProductsPage() {
  // 1. Fetch Sanity Data (Rich Content)
  // We map the fields to look like Stripe data ("name" instead of "title")
  const sanityProducts = await client.fetch(`*[_type == "product"] {
    _id,
    "id": stripeId,
    "name": title,
    "images": [image.asset->url],
    "inventory": inventory,
    "metadata": { 
        "category": category,
        "short_description": short_description 
    },
    "description": short_description,
    "tags": tags
  }`);

  // 2. Fetch Stripe Prices (The Money)
  // We loop through the Sanity items and ask Stripe for the price of each one
  const productsWithPrice = await Promise.all(
    sanityProducts.map(async (p: any) => {
      // If there is no Stripe ID in Sanity, we can't get a price
      if (!p.id) return { ...p, default_price: null };

      try {
        const stripeProd = await stripe.products.retrieve(p.id, {
          expand: ["default_price"],
        });

        // Merge the Stripe Price into the Sanity Product object
        return {
          ...p,
          default_price: stripeProd.default_price,
        };
      } catch (e) {
        console.error(`Failed to fetch price for ${p.name}`, e);
        return { ...p, default_price: null };
      }
    })
  );

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">
        All Products
      </h1>

      {/* 3. Pass the combined data to the list */}
      <ProductList products={productsWithPrice} />
    </div>
  );
}

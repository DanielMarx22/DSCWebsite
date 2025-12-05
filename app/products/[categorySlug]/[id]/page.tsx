import { client } from "@/sanity/lib/client";
import { stripe } from "@/lib/stripe";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail"; // Import your updated component

// ... getSanityProduct function remains exactly the same as before ...
// ... (Make sure it still fetches 'description') ...
async function getSanityProduct(id: string) {
  const query = `*[_type == "product" && stripeId == "${id}"][0] {
    _id,
    title,
    "imageUrl": image.asset->url,
    inventory,
    care_level,
    description,
    stripeId,
    "lightIcon": light_level_image.asset->url,
    "flowIcon": flow_level_image.asset->url
  }`;
  return await client.fetch(query);
}

export default async function ProductPage({ params }: any) {
  const { id } = await params;
  const product = await getSanityProduct(id);

  if (!product) return notFound();

  // Fetch Price
  let unitAmount = 0;
  let currency = "usd";

  if (product.stripeId) {
    try {
      const stripeProduct = await stripe.products.retrieve(product.stripeId, {
        expand: ["default_price"],
      });
      const price = stripeProduct.default_price as any;
      if (price) {
        unitAmount = price.unit_amount;
        currency = price.currency;
      }
    } catch (e) {
      console.error("Stripe Error", e);
    }
  }

  // Pass everything to the Client Component
  return (
    <ProductDetail product={product} price={unitAmount} currency={currency} />
  );
}

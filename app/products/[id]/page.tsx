// In your Server Component, e.g., app/products/[id]/page.tsx

import Stripe from "stripe";
import { ProductDetail } from "@/components/product-detail"; // Adjust path
import { stripe } from "@/lib/stripe"; // Import your initialized Stripe client

// Define the simple, serializable type
export interface SerializableProduct {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  unit_amount: number | null;
}

async function getProduct(id: string) {
  // Make sure your Stripe key is valid
  if (!id) {
    console.error("GetProduct was called with an undefined ID");
    return null; // Handle this case gracefully
  }

  const product = await stripe.products.retrieve(id, {
    // IMPORTANT: You MUST expand the default_price
    expand: ["default_price"],
  });

  const price = product.default_price as Stripe.Price;

  // This is the plain object we will pass to the client
  const serializableProduct: SerializableProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images,
    unit_amount: price.unit_amount,
  };

  return serializableProduct;
}

// --- THIS IS THE FIX ---
export default async function ProductPage({
  params,
}: {
  // 1. Update the type to be a Promise
  params: Promise<{ id: string }>;
}) {
  // 2. Await the params Promise to get the object inside
  const { id } = await params;

  // 3. Now you can safely use the 'id'
  const product = await getProduct(id);

  // Handle case where product might not be found
  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    // Pass the NEW plain object, not the full Stripe object
    <ProductDetail product={product} />
  );
}

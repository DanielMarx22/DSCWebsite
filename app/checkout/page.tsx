import { client } from "@/sanity/lib/client";
import CheckoutClient from "@/components/checkout-client";

// Define what we fetch from Sanity
interface CheckoutPageData {
  settings: any;
  recommendations: any[];
  paymentMethods: string[];
}

export const dynamic = "force-dynamic"; // Ensure we don't cache stale settings

export default async function CheckoutPage() {
  // Fetch Settings, Recommendations, AND Payment Methods in one go
  const data = await client.fetch<CheckoutPageData>(`
    {
      "settings": *[_type == "checkoutSettings"][0],
      "recommendations": *[_type == "product"][0...4] {
        _id,
        "name": title,
        "slug": slug.current,
        price,
        "imageUrl": images[0].asset->url,
        "category": category->slug.current,
        inventory
      },
      // Fetch enabled methods, default to empty list if null
      "paymentMethods": *[_type == "paymentSettings"][0].enabledMethods
    }
  `);

  return (
    <CheckoutClient
      recommendations={data.recommendations || []}
      settings={data.settings || null}
      // Pass the methods here. If null, fallback to empty array.
      paymentMethods={data.paymentMethods || []}
    />
  );
}
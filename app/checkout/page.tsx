import { client } from "@/sanity/lib/client";
import CheckoutClient from "@/components/checkout-client";
import SquareLoader from "@/components/square-loader";

// Updated to include calendar-specific fields from your Sanity Schema
interface CheckoutSettings {
  allowedShippingDays: string[];
  blackoutDates: string[];
  maxBookingWindowDays: number;
  cutoffHour: number; // Added for the 5 PM (or custom) cutoff logic
  pickupWarning: string;
  flatRateShipping: number;
  taxRate: number;
}

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
  // Fetching both recommendations and settings in parallel for better performance
  const [recommendations, settings] = await Promise.all([
    client.fetch<Product[]>(
      `*[_type == "product" && inventory > 0] | order(_createdAt desc)[0...4] {
        _id,
        "name": title,
        "slug": slug.current,
        "imageUrl": images[0].asset->url,
        price,
        inventory,
        category
      }`,
      {},
      { next: { revalidate: 0 } } // Forces fresh data on every request
    ),
    client.fetch<CheckoutSettings>(
      `*[_type == "checkoutSettings"][0]{
        allowedShippingDays,
        blackoutDates,
        maxBookingWindowDays,
        cutoffHour,
        pickupWarning,
        flatRateShipping,
        taxRate
      }`,
      {},
      { next: { revalidate: 0 } } // Ensures owner's Studio changes show up instantly
    )
  ]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 1. Manually inject Square SDK via our client loader */}
      <SquareLoader /> 
      
      <CheckoutClient 
        recommendations={recommendations} 
        settings={settings} 
      />
    </div>
  );
}
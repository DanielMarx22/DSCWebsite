import { client } from "@/sanity/lib/client";

export interface Sale {
    _id: string;
    title: string;
    discountType: "percentage" | "fixed";
    amount: number;
    scope: "all" | "category" | "product";
    categories?: string[];
    products?: { _ref: string }[];
}

export async function getActiveSale(): Promise<Sale | null> {
    const now = new Date().toISOString();

    // Fetch the single most relevant sale (or you could fetch all and stack them)
    // We check: Is Active? Start date passed? End date not passed?
    const query = `
    *[_type == "sale" 
      && isActive == true 
      && (!defined(startDate) || startDate <= $now) 
      && (!defined(endDate) || endDate >= $now)
    ] | order(_createdAt desc)[0] {
      _id,
      title,
      discountType,
      amount,
      scope,
      categories,
      products
    }
  `;

    return await client.fetch(query, { now }, { next: { revalidate: 60 } }); // Revalidate every minute
}
"use server";

import { SquareClient, SquareEnvironment } from "square";
import { client } from "@/sanity/lib/client";

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: SquareEnvironment.Production,
});

export async function getOrderDetails(lookupId: string) {
  try {
    let orderId = lookupId;
    let email = null;
    let receiptUrl = null;

    // --- 1. SMART LOOKUP (Payment vs Order ID) ---
    try {
      const paymentResponse = await square.payments.get({
        paymentId: lookupId,
      });
      if (paymentResponse.payment) {
        if (paymentResponse.payment.orderId)
          orderId = paymentResponse.payment.orderId;
        email = paymentResponse.payment.buyerEmailAddress ?? null;
        receiptUrl = paymentResponse.payment.receiptUrl ?? null;
      }
    } catch (e) {
      // Not a payment ID, proceed as Order ID
    }

    // --- 2. Fetch Order ---
    const orderResponse = await square.orders.get({ orderId });
    if (!orderResponse.order) throw new Error("Order not found");

    const order = orderResponse.order;

    // --- 3. Fallback: Find email via tenders ---
    if (!email || !receiptUrl) {
      const tender = order.tenders?.[0];
      if (tender?.paymentId) {
        try {
          const linkedPayment = await square.payments.get({
            paymentId: tender.paymentId,
          });
          if (linkedPayment.payment) {
            receiptUrl = linkedPayment.payment.receiptUrl ?? receiptUrl;
            email = linkedPayment.payment.buyerEmailAddress ?? email;
          }
        } catch (err) {
          console.warn("Could not fetch linked payment details.");
        }
      }
    }

    // --- 4. SMART RECOMMENDATIONS ---
    // A. Get names of items purchased
    const purchasedNames = order.lineItems?.map((i: any) => i.name) || [];

    // B. Find the Category of the first item purchased
    // (We fetch the product from Sanity matching the name to get its category)
    const purchasedProducts = await client.fetch(
      `*[_type == "product" && title in $names]{ _id, category }`,
      { names: purchasedNames }
    );

    // Default to 'livestock' if we can't find a match, or use the first item's category
    const mainCategory = purchasedProducts[0]?.category || "livestock";
    const purchasedIds = purchasedProducts.map((p: any) => p._id);

    // C. Fetch Recommendations (Same Category, Excluding Purchased)
    const sanityData = await client.fetch(
      `{
            "sales": *[_type == "sale" && isActive == true],
            "recommendations": *[_type == "product" && category == $category && !(_id in $excludeIds) && inventory > 0] | order(_createdAt desc)[0...4] {
                _id,
                "name": title,
                "slug": slug.current,
                price,
                "imageUrl": images[0].asset->url,
                category,
                inventory,
                tags
            }
        }`,
      {
        category: mainCategory,
        excludeIds: purchasedIds,
      }
    );

    // --- 5. Serialize BigInts ---
    const safeOrder = JSON.parse(
      JSON.stringify(order, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return {
      success: true,
      order: safeOrder,
      recommendations: sanityData.recommendations || [],
      sales: sanityData.sales || [],
      receiptUrl,
      email,
    };
  } catch (error: any) {
    console.error("Fetch Error:", error);
    const msg = error.errors?.[0]?.detail || error.message || "Unknown Error";
    return { success: false, error: msg };
  }
}

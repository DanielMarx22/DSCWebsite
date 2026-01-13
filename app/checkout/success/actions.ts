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

    // 1. SMART LOOKUP: Try to find a Payment with this ID first
    try {
      // 👇 FIX: Don't destructure { result }. Access response directly.
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
      // Not a payment ID, ignore and proceed treating it as an Order ID
    }

    // 2. Fetch the Order details
    // 👇 FIX: Remove .result, check order directly
    const orderResponse = await square.orders.get({ orderId });

    if (!orderResponse.order) {
      throw new Error("Order not found");
    }

    // 3. Fallback: If email/receipt missing, check Tenders
    if (!email || !receiptUrl) {
      const tender = orderResponse.order.tenders?.[0];
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

    // 4. Fetch Sales & Recommendations (Sanity)
    const sanityData = await client.fetch(`{
            "sales": *[_type == "sale" && isActive == true],
            "recommendations": *[_type == "product" && inventory > 0] | order(_createdAt desc)[0...4] {
                _id,
                "name": title,
                "slug": slug.current,
                price,
                "imageUrl": images[0].asset->url,
                category,
                inventory,
                tags
            }
        }`);

    // 5. Serialize BigInts (Square uses BigInt, crashes frontend if not converted)
    const order = JSON.parse(
      JSON.stringify(orderResponse.order, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return {
      success: true,
      order,
      recommendations: sanityData.recommendations || [],
      sales: sanityData.sales || [],
      receiptUrl,
      email,
    };
  } catch (error: any) {
    console.error("Fetch Error:", error);
    // Safely extract error message
    const msg = error.errors?.[0]?.detail || error.message || "Unknown Error";
    return { success: false, error: msg };
  }
}

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
        // (This fixes the "Order Not Found" bug if the URL has a Payment ID)
        try {
            const { payment } = await square.payments.get({ paymentId: lookupId });
            if (payment) {
                if (payment.orderId) orderId = payment.orderId;
                email = payment.buyerEmailAddress ?? null;
                receiptUrl = payment.receiptUrl ?? null;
            }
        } catch (e) {
            // If lookupId wasn't a valid Payment ID, assume it is an Order ID and proceed
        }

        // 2. Fetch the Order details using the correct Order ID
        const orderResponse = await square.orders.get({ orderId });
        if (!orderResponse.order) throw new Error("Order not found");

        // 3. Fallback: If we didn't find the email in Step 1, try to find it via the Order's tenders
        if (!email || !receiptUrl) {
            const tender = orderResponse.order.tenders?.[0];
            if (tender?.paymentId) {
                try {
                    const paymentResponse = await square.payments.get({ paymentId: tender.paymentId });
                    if (paymentResponse.payment) {
                        receiptUrl = paymentResponse.payment.receiptUrl ?? receiptUrl;
                        email = paymentResponse.payment.buyerEmailAddress ?? email;
                    }
                } catch (err) {
                    console.warn("Could not fetch linked payment details.");
                }
            }
        }

        // 4. Fetch Recommendations from Sanity
        const recommendations = await client.fetch(`
      *[_type == "product"][0...4] {
        _id,
        "name": title,
        "slug": slug.current,
        price,
        "imageUrl": images[0].asset->url,
        "category": category->slug.current,
        inventory
      }
    `);

        // 5. Serialize BigInts (Square uses BigInt, which crashes Client Components if not converted)
        const order = JSON.parse(JSON.stringify(orderResponse.order, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return { success: true, order, recommendations, receiptUrl, email };

    } catch (error: any) {
        console.error("Fetch Error:", error);
        const msg = error.body?.errors?.[0]?.detail || error.message;
        return { success: false, error: msg };
    }
}
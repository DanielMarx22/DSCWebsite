"use server";

import { SquareClient, SquareEnvironment } from "square";
import { client } from "@/sanity/lib/client";

const square = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production,
});

export async function getOrderDetails(orderId: string) {
    // --- TEST MODE BLOCK (Keep this if you want to test styling locally) ---
    if (orderId === "test-preview") {
        return {
            success: true,
            order: {
                id: "TEST-1234",
                createdAt: new Date().toISOString(),
                totalMoney: { amount: 10500 },
                totalTaxMoney: { amount: 500 },
                lineItems: [{ name: "Test Item", quantity: "1", basePriceMoney: { amount: 10000 } }]
            },
            recommendations: [],
            receiptUrl: "#",
            email: "test@example.com" // Mock email
        };
    }
    // --- END TEST MODE ---

    try {
        const orderResponse = await square.orders.get({ orderId });
        if (!orderResponse.order) throw new Error("Order not found");

        let receiptUrl = null;
        let email = null; // 👈 Variable to store the email

        const tender = orderResponse.order.tenders?.[0];

        if (tender?.paymentId) {
            const paymentResponse = await square.payments.get({ paymentId: tender.paymentId });

            if (paymentResponse.payment) {
                receiptUrl = paymentResponse.payment.receiptUrl;
                email = paymentResponse.payment.buyerEmailAddress; // 👈 Capture the email
            }
        }

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
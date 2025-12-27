"use server";

import { SquareClient, SquareEnvironment } from "square";
import { randomUUID } from "crypto";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

const square = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production,
});

const sanityWrite = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

// 👇 Update signature to accept marketingConsent
export async function processSquarePayment(
    token: string,
    cartItems: any[],
    email: string,
    marketingConsent: boolean
) {
    try {
        // 1. Create Line Items
        const lineItems = cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity.toString(),
            basePriceMoney: {
                amount: BigInt(Math.round(item.price * 100)),
                currency: "USD" as const,
            },
        }));

        // 2. Create Order
        const orderResponse = await square.orders.create({
            order: {
                locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
                lineItems: lineItems,
            },
            idempotencyKey: randomUUID(),
        });

        if (!orderResponse.order?.id) throw new Error("Failed to create order.");

        // 3. Process Payment (Receipt Logic)
        // We ALWAYS send the email to Square so they get the receipt
        const paymentResponse = await square.payments.create({
            sourceId: token,
            idempotencyKey: randomUUID(),
            amountMoney: {
                amount: orderResponse.order.totalMoney?.amount ?? BigInt(0),
                currency: "USD" as const,
            },
            orderId: orderResponse.order.id,
            buyerEmailAddress: email,
        });

        // 4. Update Inventory & Handle Marketing (Parallel)
        // We use Promise.allSettled so if marketing fails, it doesn't crash the order
        await Promise.allSettled([
            // A. Decrement Inventory
            ...cartItems.map(item =>
                sanityWrite
                    .patch(item.id)
                    .dec({ inventory: item.quantity })
                    .commit()
            ),

            // B. MARKETING LOGIC (Only if they opted in) 👈
            marketingConsent
                ? sanityWrite.create({
                    _type: 'subscriber',
                    email: email,
                    joinedAt: new Date().toISOString()
                })
                : Promise.resolve()
        ]);

        const paymentResult = JSON.parse(JSON.stringify(paymentResponse.payment, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return { success: true, payment: paymentResult };

    } catch (error: any) {
        console.error("Payment Error:", error);
        const errorMessage = error.errors ? error.errors[0].detail : error.message;
        return { success: false, error: errorMessage };
    }
}
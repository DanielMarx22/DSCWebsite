"use server";

import { SquareClient, SquareEnvironment } from "square";
import { randomUUID } from "crypto";
import { createClient } from "next-sanity"; // 👈 Need this for the write client
import { apiVersion, dataset, projectId } from "@/sanity/env"; // Adjust path if needed

// 1. Setup Square
const square = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production,
});

// 2. Setup Sanity Write Client (Needs the Token you just created)
const sanityWrite = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false, // Must be false for real-time updates
    token: process.env.SANITY_API_TOKEN, // 👈 The token from Step 1
});

export async function processSquarePayment(token: string, cartItems: any[], email: string) {
    try {
        // --- STEP A: SQUARE CHARGE ---
        const lineItems = cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity.toString(),
            basePriceMoney: {
                amount: BigInt(Math.round(item.price * 100)),
                currency: "USD" as const,
            },
        }));

        const orderResponse = await square.orders.create({
            order: {
                locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
                lineItems: lineItems,
            },
            idempotencyKey: randomUUID(),
        });

        if (!orderResponse.order?.id) throw new Error("Failed to create order.");

        const paymentResponse = await square.payments.create({
            sourceId: token,
            idempotencyKey: randomUUID(),
            amountMoney: {
                amount: orderResponse.order.totalMoney?.amount ?? BigInt(0),
                currency: "USD" as const,
            },
            orderId: orderResponse.order.id,
            buyerEmailAddress: email, // 👈 SQUARE WILL NOW SEND THE RECEIPT
        });

        // --- STEP B: SANITY INVENTORY UPDATE ---
        // We loop through items and tell Sanity to subtract the quantity
        // We use Promise.all to do them all at once safely
        await Promise.all(cartItems.map(item =>
            sanityWrite
                .patch(item.id) // Find product by ID
                .dec({ inventory: item.quantity }) // Subtract sold quantity
                .commit() // Save
        ));

        // Handle BigInt serialization
        const paymentResult = JSON.parse(JSON.stringify(paymentResponse.payment, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return { success: true, payment: paymentResult };

    } catch (error: any) {
        console.error("Payment/Inventory Error:", error);
        const errorMessage = error.errors ? error.errors[0].detail : error.message;
        return { success: false, error: errorMessage };
    }
}
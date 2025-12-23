"use server";

import { SquareClient, SquareEnvironment } from "square";
import { randomUUID } from "crypto";

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production,
});

export async function processSquarePayment(token: string, cartItems: any[]) {
    try {
        // 1. Create the Line Items
        const lineItems = cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity.toString(),
            basePriceMoney: {
                amount: BigInt(Math.round(item.price * 100)),
                // 👇 ADD "as const" HERE TO FIX THE TYPE ERROR
                currency: "USD" as const,
            },
        }));

        // 2. Create Order
        const orderResponse = await client.orders.create({
            order: {
                locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
                lineItems: lineItems,
            },
            idempotencyKey: randomUUID(),
        });

        if (!orderResponse.order?.id) {
            throw new Error("Failed to create order record.");
        }

        const orderId = orderResponse.order.id;
        const orderTotal = orderResponse.order.totalMoney?.amount ?? BigInt(0);

        // 3. Pay
        const paymentResponse = await client.payments.create({
            sourceId: token,
            idempotencyKey: randomUUID(),
            amountMoney: {
                amount: orderTotal,
                // 👇 ADD "as const" HERE TOO
                currency: "USD" as const,
            },
            orderId: orderId,
        });

        // Handle BigInt serialization for the client
        const paymentResult = JSON.parse(JSON.stringify(paymentResponse.payment, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return { success: true, payment: paymentResult };
    } catch (error: any) {
        console.error("Square Payment Error:", error);
        const errorMessage = error.errors ? error.errors[0].detail : error.message;
        return { success: false, error: errorMessage };
    }
}
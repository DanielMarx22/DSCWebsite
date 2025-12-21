"use server";

import { SquareClient, SquareEnvironment } from "square";
import { randomUUID } from "crypto";

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production, // 👈 Switch to Production for real money
});

export async function processSquarePayment(sourceId: string, amount: number) {
    try {
        const response = await client.payments.create({
            sourceId,
            idempotencyKey: randomUUID(),
            amountMoney: {
                amount: BigInt(Math.round(amount * 100)), // Convert $0.01 to 1 cent
                currency: "USD",
            },
        });

        return { success: true, payment: response.payment };
    } catch (error: any) {
        console.error("Square Payment Error:", error);
        return { success: false, error: error.message };
    }
}
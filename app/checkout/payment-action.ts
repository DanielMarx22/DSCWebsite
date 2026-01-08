"use server";

import { SquareClient, SquareEnvironment } from "square";
import { randomUUID } from "crypto";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { calculateSalePrice, Sale } from "@/lib/sale-utils"; // 👈 Import the helper

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

export async function processSquarePayment(
  token: string,
  cartItems: any[],
  email: string,
  marketingConsent: boolean
) {
  try {
    // --- 1. SECURITY: Re-Fetch Data from Server ---
    const productIds = cartItems.map((item) => item.id);

    // Fetch Products (Price/Tags/Category) AND Active Sales
    const [serverProducts, activeSales] = await Promise.all([
      sanityWrite.fetch<any[]>(
        `*[_type == "product" && _id in $ids]{
                _id, 
                title, 
                price, 
                category, 
                tags
            }`,
        { ids: productIds }
      ),
      sanityWrite.fetch<Sale[]>(`*[_type == "sale" && isActive == true]`),
    ]);

    // --- 2. Build Line Items with CALCULATED Sale Prices ---
    const lineItems = cartItems.map((cartItem) => {
      // Find the real product data from Sanity
      const product = serverProducts.find((p) => p._id === cartItem.id);

      if (!product) {
        throw new Error(`Product not found: ${cartItem.name}`);
      }

      // ⚠️ CALCULATE SALE PRICE ON SERVER ⚠️
      // This ensures Square charges the $80 sale price, not the $100 regular price
      const { salePrice } = calculateSalePrice(
        {
          _id: product._id,
          price: product.price,
          category: product.category,
          tags: product.tags,
        },
        activeSales
      );

      return {
        name: product.title,
        quantity: cartItem.quantity.toString(),
        basePriceMoney: {
          // Use the CALCULATED salePrice
          amount: BigInt(Math.round(salePrice * 100)),
          currency: "USD" as const,
        },
      };
    });

    // --- 3. Create Order (Square) ---
    const orderResponse = await square.orders.create({
      order: {
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
        lineItems: lineItems,
      },
      idempotencyKey: randomUUID(),
    });

    if (!orderResponse.order?.id) throw new Error("Failed to create order.");

    // --- 4. Process Payment ---
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

    // --- 5. Update Inventory & Marketing ---
    await Promise.allSettled([
      // A. Decrement Inventory
      ...cartItems.map((item) =>
        sanityWrite.patch(item.id).dec({ inventory: item.quantity }).commit()
      ),

      // B. Marketing Logic
      marketingConsent
        ? sanityWrite.create({
            _type: "subscriber",
            email: email,
            joinedAt: new Date().toISOString(),
          })
        : Promise.resolve(),
    ]);

    const paymentResult = JSON.parse(
      JSON.stringify(paymentResponse.payment, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return { success: true, payment: paymentResult };
  } catch (error: any) {
    console.error("Payment Error:", error);
    const errorMessage = error.errors ? error.errors[0].detail : error.message;
    return { success: false, error: errorMessage };
  }
}

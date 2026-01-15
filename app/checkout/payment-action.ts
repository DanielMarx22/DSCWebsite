"use server";

import { SquareClient, SquareEnvironment } from "square";
import { randomUUID } from "crypto";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { calculateSalePrice, Sale } from "@/lib/sale-utils";
import { sendReceiptEmail } from "@/app/actions/send-receipt";

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

const sanitizeForEmail = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

export async function processSquarePayment(
  token: string,
  cartItems: any[],
  customerInfo: { email: string; name: string },
  marketingConsent: boolean,
  taxRate: number
) {
  try {
    // --- 1. SECURITY: Re-Fetch Data ---
    const productIds = cartItems.map((item) => item.id);

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

    // --- 2. Build Line Items ---
    const lineItems = cartItems.map((cartItem) => {
      const product = serverProducts.find((p) => p._id === cartItem.id);
      if (!product) throw new Error(`Product not found: ${cartItem.name}`);

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
          amount: BigInt(Math.round(salePrice * 100)),
          currency: "USD" as const,
        },
      };
    });

    // --- 3. Create Order (WITH FIXED STRUCTURE) ---
    const orderResponse = await square.orders.create({
      order: {
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
        lineItems: lineItems,
        // A. Tax
        taxes: [
          {
            name: "Sales Tax",
            percentage: taxRate.toString(),
            scope: "ORDER",
          },
        ],
        // B. Fulfillments (FIXED: Recipient must be inside pickupDetails)
        fulfillments: [
          {
            type: "PICKUP",
            state: "PROPOSED",
            pickupDetails: {
              recipient: {
                displayName: customerInfo.name,
                emailAddress: customerInfo.email,
              },
            },
          },
        ],
      },
      idempotencyKey: randomUUID(),
    });

    if (!orderResponse.order?.id) throw new Error("Failed to create order.");

    // --- 4. Process Payment ---
    const paymentResponse = await square.payments.create({
      sourceId: token,
      idempotencyKey: randomUUID(),
      amountMoney: {
        // Square has now automatically added the tax to this total
        amount: orderResponse.order.totalMoney?.amount ?? BigInt(0),
        currency: "USD" as const,
      },
      orderId: orderResponse.order.id,
      buyerEmailAddress: customerInfo.email,
      // C. Add Name to Note
      note: `Customer: ${customerInfo.name}`,
    });

    // --- 5. Update Inventory & Marketing ---
    await Promise.allSettled([
      ...cartItems.map((item) =>
        sanityWrite.patch(item.id).dec({ inventory: item.quantity }).commit()
      ),
      marketingConsent
        ? sanityWrite.create({
            _type: "subscriber",
            email: customerInfo.email,
            name: customerInfo.name,
            joinedAt: new Date().toISOString(),
          })
        : Promise.resolve(),
    ]);

    // --- 6. Send Receipt ---
    try {
      // Check if Resend Key Exists before crashing
      if (process.env.RESEND_API_KEY) {
        const sanitizedOrder = sanitizeForEmail(orderResponse.order);
        await sendReceiptEmail(customerInfo.email, sanitizedOrder, cartItems);
      } else {
        console.warn("RESEND_API_KEY missing. Receipt email skipped.");
      }
    } catch (emailErr) {
      console.error("Auto-Receipt Failed:", emailErr);
    }

    const paymentResult = sanitizeForEmail(paymentResponse.payment);
    return { success: true, payment: paymentResult };
  } catch (error: any) {
    console.error("Payment Error:", error);
    const errorMessage = error.errors ? error.errors[0].detail : error.message;
    return { success: false, error: errorMessage };
  }
}

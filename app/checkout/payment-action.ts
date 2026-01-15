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

// 👇 Define the Address Type
interface ShippingAddress {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
}

export async function processSquarePayment(
  token: string,
  cartItems: any[],
  customerInfo: { email: string; name: string },
  marketingConsent: boolean,
  taxRate: number,
  deliveryMethod: string,
  shippingAddress?: ShippingAddress // 👈 NEW ARGUMENT
) {
  try {
    // --- 1. SECURITY CHECKS ---
    if (!cartItems || cartItems.length === 0) throw new Error("Cart is empty");

    // Check stock
    const productIds = cartItems.map((item) => item.id);
    const [serverProducts, activeSales] = await Promise.all([
      sanityWrite.fetch<any[]>(
        `*[_type == "product" && _id in $ids]{ _id, title, price, category, tags, inventory }`,
        { ids: productIds }
      ),
      sanityWrite.fetch<Sale[]>(`*[_type == "sale" && isActive == true]`),
    ]);

    // Validate Inventory & Build Line Items
    const lineItems = cartItems.map((cartItem) => {
      const product = serverProducts.find((p) => p._id === cartItem.id);
      if (!product) throw new Error(`Product not found: ${cartItem.name}`);

      // Stop overselling
      if (product.inventory < cartItem.quantity) {
        throw new Error(
          `Sorry, we only have ${product.inventory} of ${product.title} left.`
        );
      }

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

    // --- 2. BUILD FULFILLMENT (Shipping vs Pickup) ---
    const fulfillments: any[] = [];

    if (deliveryMethod === "ship" && shippingAddress) {
      // Create an official SHIPMENT object for Square
      fulfillments.push({
        type: "SHIPMENT",
        state: "PROPOSED",
        shipmentDetails: {
          recipient: {
            displayName: customerInfo.name,
            emailAddress: customerInfo.email,
          },
          address: {
            addressLine1: shippingAddress.addressLine1,
            locality: shippingAddress.city,
            administrativeDistrictLevel1: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: "US",
          },
        },
      });
    }
    // We intentionally do NOT add a fulfillment for "Pickup" to avoid strict time errors.
    // Pickup is handled via the "Note" field below.

    // --- 3. CREATE ORDER ---
    const orderResponse = await square.orders.create({
      order: {
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
        lineItems: lineItems,
        taxes: [
          { name: "Sales Tax", percentage: taxRate.toString(), scope: "ORDER" },
        ],
        fulfillments: fulfillments, // 👈 Attach the shipment info
      },
      idempotencyKey: randomUUID(),
    });

    if (!orderResponse.order?.id) throw new Error("Failed to create order.");

    // --- 4. PROCESS PAYMENT ---
    const paymentResponse = await square.payments.create({
      sourceId: token,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: orderResponse.order.totalMoney?.amount ?? BigInt(0),
        currency: "USD" as const,
      },
      orderId: orderResponse.order.id,
      buyerEmailAddress: customerInfo.email,
      // Add Note for Pickup or Shipping context
      note:
        deliveryMethod === "pickup"
          ? `PICKUP ORDER - Customer: ${customerInfo.name}`
          : `SHIP TO: ${shippingAddress?.addressLine1}, ${shippingAddress?.city}, ${shippingAddress?.state}`,
    });

    // --- 5. UPDATE INVENTORY ---
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

    // --- 6. SEND EMAIL ---
    try {
      if (process.env.RESEND_API_KEY) {
        const sanitizedOrder = sanitizeForEmail(orderResponse.order);
        await sendReceiptEmail(customerInfo.email, sanitizedOrder, cartItems);
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

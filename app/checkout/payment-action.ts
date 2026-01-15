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
  shippingAddress?: ShippingAddress,
  deliveryDate?: string // 👈 NEW: Accept the date
) {
  try {
    // --- 1. SECURITY CHECKS & FETCH DATA ---
    if (!cartItems || cartItems.length === 0) throw new Error("Cart is empty");

    const productIds = cartItems.map((item) => item.id);

    // Fetch Products, Active Sales, AND Checkout Settings (for shipping cost)
    const [serverProducts, activeSales, settings] = await Promise.all([
      sanityWrite.fetch<any[]>(
        `*[_type == "product" && _id in $ids]{ _id, title, price, category, tags, inventory }`,
        { ids: productIds }
      ),
      sanityWrite.fetch<Sale[]>(`*[_type == "sale" && isActive == true]`),
      sanityWrite.fetch<any>(`*[_type == "checkoutSettings"][0]`), // 👈 Get settings
    ]);

    // --- 2. BUILD PRODUCT LINE ITEMS ---
    const lineItems = cartItems.map((cartItem) => {
      const product = serverProducts.find((p) => p._id === cartItem.id);
      if (!product) throw new Error(`Product not found: ${cartItem.name}`);

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

    // --- 3. ADD SHIPPING CHARGE ---
    if (deliveryMethod === "ship") {
      const shippingCost = settings?.flatRateShipping || 39.99; // Fallback to 39.99 if setting missing

      lineItems.push({
        name: "Flat Rate Shipping",
        quantity: "1",
        basePriceMoney: {
          amount: BigInt(Math.round(shippingCost * 100)),
          currency: "USD" as const,
        },
      });
    }

    // --- 4. BUILD FULFILLMENT (With Date!) ---
    const fulfillments: any[] = [];

    if (deliveryMethod === "ship" && shippingAddress) {
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
          // 👈 OFFICIAL SQUARE FIELD FOR DELIVERY DATE
          expectedDeliveryDate: deliveryDate
            ? new Date(deliveryDate).toISOString()
            : undefined,
        },
      });
    }

    // --- 5. CREATE ORDER ---
    const orderResponse = await square.orders.create({
      order: {
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
        lineItems: lineItems,
        taxes: [
          { name: "Sales Tax", percentage: taxRate.toString(), scope: "ORDER" },
        ],
        fulfillments: fulfillments,
      },
      idempotencyKey: randomUUID(),
    });

    if (!orderResponse.order?.id) throw new Error("Failed to create order.");

    // --- 6. PROCESS PAYMENT ---
    // Create a clear note for the owner
    let noteText = "";
    if (deliveryMethod === "pickup") {
      noteText = `PICKUP ORDER - Customer: ${customerInfo.name}`;
    } else {
      noteText = `SHIP TO: ${shippingAddress?.addressLine1}, ${shippingAddress?.state}`;
      if (deliveryDate) {
        // Format date nicely for the note (e.g., "Jan 25")
        const niceDate = new Date(deliveryDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        noteText += ` | ARRIVING: ${niceDate}`;
      }
    }

    const paymentResponse = await square.payments.create({
      sourceId: token,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: orderResponse.order.totalMoney?.amount ?? BigInt(0),
        currency: "USD" as const,
      },
      orderId: orderResponse.order.id,
      buyerEmailAddress: customerInfo.email,
      note: noteText, // 👈 Updated Note
    });

    // --- 7. UPDATE INVENTORY ---
    // Only decrement products, ignore the "Shipping" line item we added
    const realProductItems = cartItems.filter((item) => item.id);

    await Promise.allSettled([
      ...realProductItems.map((item) =>
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

    // --- 8. SEND EMAIL ---
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

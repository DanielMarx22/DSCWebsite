"use server";

import { stripe } from "@/lib/stripe";
import { CartItem } from "@/store/cart-store";
import { redirect } from "next/navigation";

export const checkoutAction = async (formData: FormData): Promise<void> => {
  const itemsJson = formData.get("items") as string;
  const items = JSON.parse(itemsJson);

  const line_items = items.map((item: CartItem) => ({
    price_data: {
      currency: "usd", // Changed to USD since your site displays USD
      product_data: { 
        name: item.name,
        images: item.imageUrl ? [item.imageUrl] : [], // Pass image to Stripe Checkout!
      },
      // ⚠️ IMPORTANT: Stripe expects cents. Sanity has dollars ($80).
      // We multiply by 100 here to get cents (8000).
      unit_amount: Math.round(item.price * 100), 
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
  });

  redirect(session.url!);
};
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { checkoutAction } from "@/app/checkout/checkout-action";
import { ProductCard } from "@/components/product-card"; // Reuse your existing card!

interface Props {
  recommendations: any[]; // Data passed from the server page
}

export default function CheckoutClient({ recommendations }: Props) {
  const { items, removeItem, updateQuantity } = useCartStore();

  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  
  // Hardcoded shipping for now (you can make this dynamic later)
  const shipping = subtotal > 250 ? 0 : 39.99;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-gray-400 mb-8">
            Looks like you haven't added any aquatic friends yet.
        </p>
        <Button asChild size="lg" className="rounded-full">
            <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-10">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* === LEFT COLUMN: CART ITEMS === */}
        <div className="flex-1 space-y-8">
          <ul className="space-y-6">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 sm:gap-6 border-b border-gray-800 pb-6">
                {/* 1. PRODUCT IMAGE */}
                <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-md border border-gray-700 bg-gray-900">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-500">No Img</div>
                  )}
                </div>

                {/* 2. DETAILS & CONTROLS */}
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        <Link href={`/products` /* Link logic could be improved if slug stored */}>
                            {item.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-400">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-1 border border-gray-800">
                      <button
                        onClick={() => updateQuantity(item.id, "decrease")}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
                      >
                        –
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, "increase")}
                        disabled={item.quantity >= item.maxQuantity}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-red-500 hover:text-red-400 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* === RIGHT COLUMN: SUMMARY === */}
        <div className="lg:w-96 flex-shrink-0">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 text-gray-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Estimate</span>
                <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-gray-700 pt-4 flex justify-between text-white font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <form action={checkoutAction}>
                <input type="hidden" name="items" value={JSON.stringify(items)} />
                <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full rounded-full bg-blue-600 hover:bg-blue-500 text-lg font-bold py-6"
                >
                    Proceed to Payment
                </Button>
            </form>
            
            <p className="text-xs text-gray-500 text-center mt-4">
                Secure checkout powered by Stripe.
            </p>
          </div>
        </div>
      </div>

      {/* === YOU MIGHT ALSO LIKE SECTION === */}
      {recommendations && recommendations.length > 0 && (
        <div className="mt-20 border-t border-gray-800 pt-12">
            <h2 className="text-2xl font-bold mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {recommendations.map((product) => (
                    <ProductCard key={product._id} data={product} />
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
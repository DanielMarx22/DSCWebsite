"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { useCartStore } from "@/store/cart-store";
import { PortableText } from "@portabletext/react";

// Define the interface for the Hybrid Data
interface ProductDetailProps {
  product: {
    _id: string;
    title: string;
    imageUrl: string | null;
    inventory: number;
    care_level?: string;
    description: any; // Rich text blocks
    stripeId: string;
    lightIcon?: string;
    flowIcon?: string;
  };
  price: number | null; // Passed separately
  currency: string;
}

export const ProductDetail = ({
  product,
  price,
  currency,
}: ProductDetailProps) => {
  const { items, addItem, removeItem } = useCartStore();

  // Use Stripe ID for the cart so Checkout works later
  const cartItem = items.find((item) => item.id === product.stripeId);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Check stock limits
  const isOutOfStock = product.inventory === 0;
  const isMaxQuantity = quantity >= product.inventory;

  const onAddItem = () => {
    if (isMaxQuantity) return;
    addItem({
      id: product.stripeId,
      name: product.title,
      price: price || 0,
      imageUrl: product.imageUrl,
      quantity: 1,
      maxQuantity: product.inventory, // 👈 PASS THE LIMIT HERE
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-12 text-white">
      {/* LEFT: Image */}
      <div className="relative h-96 w-full md:w-1/2 bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No Image
          </div>
        )}
      </div>

      {/* RIGHT: Details */}
      <div className="md:w-1/2 flex flex-col space-y-6">
        <div>
          <h1 className="text-4xl font-bold">{product.title}</h1>
          {price ? (
            <p className="text-2xl font-medium text-gray-300 mt-2">
              ${(price / 100).toFixed(2)} {currency.toUpperCase()}
            </p>
          ) : (
            <p className="text-gray-400">Price Unavailable</p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {isOutOfStock ? (
            <span className="px-3 py-1 bg-red-900 text-red-200 rounded-full text-sm font-bold">
              Out of Stock
            </span>
          ) : (
            <span className="px-3 py-1 bg-green-900 text-green-200 rounded-full text-sm font-bold">
              {product.inventory} in stock
            </span>
          )}
          {product.care_level && (
            <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm font-bold capitalize">
              {product.care_level}
            </span>
          )}
        </div>

        {/* Icons (Light/Flow) */}
        {(product.lightIcon || product.flowIcon) && (
          <div className="flex gap-6">
            {product.lightIcon && (
              <div className="flex flex-col items-center">
                <Image
                  src={product.lightIcon}
                  alt="Light"
                  width={40}
                  height={40}
                />
                <span className="text-xs text-gray-400">Light</span>
              </div>
            )}
            {product.flowIcon && (
              <div className="flex flex-col items-center">
                <Image
                  src={product.flowIcon}
                  alt="Flow"
                  width={40}
                  height={40}
                />
                <span className="text-xs text-gray-400">Flow</span>
              </div>
            )}
          </div>
        )}

        {/* Cart Buttons */}
        <div className="flex items-center space-x-4 py-4">
          <Button
            variant="outline"
            onClick={() => removeItem(product.stripeId)}
            disabled={quantity === 0}
            className="text-black bg-white hover:bg-gray-200"
          >
            –
          </Button>
          <span className="text-xl font-bold min-w-[20px] text-center">
            {quantity}
          </span>
          <Button
            onClick={onAddItem}
            disabled={isOutOfStock || isMaxQuantity}
            className={`${isOutOfStock ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-500"}`}
          >
            {isOutOfStock ? "Sold Out" : "+ Add to Cart"}
          </Button>
        </div>

        {/* Rich Text Description */}
        <div className="prose prose-invert border-t border-gray-800 pt-6">
          <h3 className="text-xl font-bold mb-2">Care Guide</h3>
          {product.description ? (
            <PortableText value={product.description} />
          ) : (
            <p className="text-gray-500">No description available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

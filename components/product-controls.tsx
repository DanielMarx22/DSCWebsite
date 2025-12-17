"use client";

import { useCartStore } from "@/store/cart-store"; // Ensure this path matches your store location
import { useEffect, useState } from "react";

interface Props {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    maxQuantity: number;
  };
}

export default function ProductControls({ product }: Props) {
  // 1. We import 'removeItem' to handle the 1 -> 0 transition
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cartItem = items.find((item) => item.id === product.id);
  const currentQty = cartItem ? cartItem.quantity : 0;
  
  const isOutOfStock = product.maxQuantity === 0;
  const isAtLimit = currentQty >= product.maxQuantity;

  if (!mounted) return null;

  // 2. Logic to handle the minus button click
  const handleDecrease = () => {
    if (currentQty === 1) {
      // If we have 1, remove it entirely
      removeItem(product.id);
    } else {
      // Otherwise, just lower the number
      updateQuantity(product.id, "decrease");
    }
  };

  return (
    <div className="mt-6">
      {/* STOCK BADGE */}
      <div className="mb-4">
        {isOutOfStock ? (
            <span className="inline-block px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
                Out of Stock
            </span>
        ) : (
            <span className="inline-block px-3 py-1 text-xs font-bold text-green-900 bg-green-400 rounded-full">
                {product.maxQuantity} in stock
            </span>
        )}
      </div>

      {/* BUTTON CONTROLS */}
      <div className="flex items-center gap-4 mb-8">
        
        {/* Decrease Button */}
        <button
          onClick={handleDecrease}
          disabled={currentQty === 0}
          className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-bold"
        >
          -
        </button>

        {/* Number Display */}
        <span className="text-xl font-bold text-white w-4 text-center">
          {currentQty}
        </span>

        {/* Increase Button */}
        <button
          onClick={() => addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: 1,
            maxQuantity: product.maxQuantity
          })}
          disabled={isOutOfStock || isAtLimit}
          className={`flex items-center px-6 py-2.5 rounded font-bold text-white transition-colors ${
            isOutOfStock || isAtLimit
              ? "bg-blue-900/50 cursor-not-allowed text-gray-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isAtLimit ? "Limit Reached" : "+ Add to Cart"}
        </button>
      </div>
    </div>
  );
}
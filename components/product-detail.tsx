// components/product-detail.tsx
"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { useCartStore } from "@/store/cart-store";

// This should match the type you created in your page.tsx
export interface SerializableProduct {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  unit_amount: number | null;
}

interface Props {
  product: SerializableProduct;
}

export function ProductDetail({ product }: Props) {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);

  // --- THIS IS THE ROBUST FIX ---
  // Check if 'items' is actually an array before calling .find()
  // This protects against corrupted localStorage data
  const cartItem = Array.isArray(items)
    ? items.find((item) => item.id == product.id)
    : undefined;

  const quantity = cartItem ? cartItem.quantity : 0;

  // This handler adds 1 item
  const onAddItem = () => {
    if (!product.unit_amount) return;

    addItem({
      id: product.id,
      name: product.name,
      price: product.unit_amount,
      imageUrl: product.images ? product.images[0] : null,
      quantity: 1,
    });
  };

  // This handler removes 1 item
  const onRemoveItem = () => {
    removeItem(product.id);
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 items-center">
      {product.images && product.images[0] && (
        <div className="relative h-96 w-full md:w-1/2 rounded-lg overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill={true}
            style={{ objectFit: "cover" }}
            priority={true}
            className="transition duration-300 hover:opacity-90"
          />
        </div>
      )}
      <div className="md:w-1/2">
        <h1 className="text-3xl font-bold mb-4"> {product.name}</h1>
        {product.description && (
          <p className="text-gray-700 mb-4"> {product.description}</p>
        )}

        {product.unit_amount && (
          <p className="text-lg font-semibold text-gray-900">
            ${(product.unit_amount / 100).toFixed(2)}
          </p>
        )}

        <div className="flex items-center space-x-4 mt-4">
          <Button
            variant="outline"
            onClick={onRemoveItem}
            disabled={quantity === 0}
          >
            -
          </Button>
          <span className="text-lg font-semibold w-8 text-center">
            {quantity}
          </span>
          <Button onClick={onAddItem} disabled={!product.unit_amount}>
            +
          </Button>
        </div>
      </div>
    </div>
  );
}

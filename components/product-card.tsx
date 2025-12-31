"use client";

import Link from "next/link";
import Image from "next/image";
import { calculateSalePrice, Sale } from "@/lib/sale-utils"; // 👈 Import Helper

interface ProductCardProps {
  data: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string;
    category: string;
    tags?: string[]; // 👈 Ensure tags are passed for filtering
    inventory?: number;
  };
  sales?: Sale[]; // 👈 Accept sales data
}

export function ProductCard({ data, sales }: ProductCardProps) {
  const href = `/products/${data.category}/${data.slug}`;

  // 1. Calculate Price (Is there a sale?)
  const { salePrice, originalPrice, isOnSale } = calculateSalePrice(data, sales || []);

  // 2. Stock Logic
  const isOutOfStock = (data.inventory || 0) === 0;

  // Helper to format money
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <Link
      href={href}
      className="group block rounded-xl overflow-hidden border border-gray-800 bg-slate-950 hover:border-blue-600 hover:shadow-lg transition-all duration-300 relative"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative aspect-square w-full bg-gray-900">
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={data.name}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? "opacity-60" : ""}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            No Image
          </div>
        )}

        {/* 🔴 OUT OF STOCK BADGE (Priority) */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
            Out of Stock
          </div>
        )}

        {/* 🟢 SALE BADGE (Only if in stock) */}
        {!isOutOfStock && isOnSale && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
            SALE
          </div>
        )}
      </div>

      {/* TEXT CONTENT */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-white truncate group-hover:text-blue-400 transition-colors">
          {data.name}
        </h3>

        {/* PRICE SECTION */}
        <div className="mt-2 font-medium">
          {isOnSale ? (
            <div className="flex items-center gap-2">
              {/* New Sale Price */}
              <span className="text-green-400 font-bold text-lg">
                {formatPrice(salePrice)}
              </span>
              {/* Old Price Strikethrough */}
              <span className="text-gray-500 line-through text-sm">
                {formatPrice(originalPrice)}
              </span>
            </div>
          ) : (
            // Regular Price
            <span className="text-gray-400">
              {data.price ? formatPrice(data.price) : "Price Unavailable"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
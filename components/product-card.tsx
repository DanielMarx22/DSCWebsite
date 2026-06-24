"use client";

import Link from "next/link";
import Image from "next/image";
import { calculateSalePrice, Sale } from "@/lib/sale-utils";

interface ProductCardProps {
  data: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string;
    category: string;
    tags?: string[];
    inventory?: number;
  };
  sales?: Sale[];
}

export function ProductCard({ data, sales }: ProductCardProps) {
  const href = `/products/${data.category}/${data.slug}`;

  // 1. Calculate Price
  const { salePrice, originalPrice, isOnSale } = calculateSalePrice(
    data,
    sales || []
  );

  // 2. Stock Logic
  const isOutOfStock = (data.inventory || 0) === 0;

  // Helper to format money
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <Link
      href={href}
      className="group block rounded-xl overflow-hidden border border-gray-800 bg-slate-950 relative aspect-square"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative w-full h-full">
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={data.name}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              isOutOfStock ? "opacity-50 grayscale" : ""
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500 bg-gray-900">
            No Image
          </div>
        )}

        {/* --- BADGES (Top) --- */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {isOutOfStock && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">
              OUT OF STOCK
            </span>
          )}
          {!isOutOfStock && isOnSale && (
            <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">
              SALE
            </span>
          )}
        </div>

        {/* --- CONTENT OVERLAY (Bottom) --- */}
        {/* This gradient ensures text is readable even on white/busy images */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10 flex flex-col justify-end min-h-[40%]">
          <h3 className="font-bold text-white truncate text-lg group-hover:text-blue-400 transition-colors drop-shadow-md">
            {data.name}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            {isOnSale ? (
              <>
                <span className="text-green-400 font-bold text-lg drop-shadow-md">
                  {formatPrice(salePrice)}
                </span>
                <span className="text-gray-400 line-through text-xs opacity-80">
                  {formatPrice(originalPrice)}
                </span>
              </>
            ) : (
              <span className="text-gray-200 font-bold text-lg drop-shadow-md">
                {data.price ? formatPrice(data.price) : "Price Unavailable"}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

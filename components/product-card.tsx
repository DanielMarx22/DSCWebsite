"use client";

import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  data: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string;
    category: string;
    inventory?: number; // 👈 Added optional inventory field
  };
}

export function ProductCard({ data }: ProductCardProps) {
  const href = `/products/${data.category}/${data.slug}`;
  // Treat undefined/null as 0 just to be safe
  const isOutOfStock = (data.inventory || 0) === 0;

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

        {/* 🔴 OUT OF STOCK BADGE */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
            Out of Stock
          </div>
        )}
      </div>

      {/* TEXT CONTENT */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-white truncate group-hover:text-blue-400 transition-colors">
          {data.name}
        </h3>
        
        <p className="mt-2 text-gray-400 font-medium">
          {data.price 
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.price)
            : "Price Unavailable"}
        </p>
      </div>
    </Link>
  );
}
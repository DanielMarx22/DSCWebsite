"use client";

import { Card, CardContent, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { calculateSalePrice, Sale } from "@/lib/sale-utils";

// ✅ GLOBAL CURRENCY FORMATTER
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  category: string;
  tags?: string[];
}

interface Props {
  products: Product[];
  sales?: Sale[];
}

export const Carousel = ({ products, sales }: Props) => {
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % products.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [products.length]);

  if (!products || products.length === 0) return null;

  const currentProduct = products[current];
  const { salePrice, originalPrice, isOnSale } = calculateSalePrice(
    currentProduct,
    sales || []
  );

  return (
    <Link href={`/products/${currentProduct.category}/${currentProduct.slug}`}>
      <Card className="relative overflow-hidden rounded-lg shadow-md bg-neutral-900 border-none h-[400px] group cursor-pointer">
        {currentProduct.imageUrl && (
          <div className="relative h-full w-full bg-black">
            <Image
              src={currentProduct.imageUrl}
              alt={currentProduct.name}
              fill
              className="object-contain transition-opacity duration-500 ease-in-out"
            />

            {isOnSale && (
              <div className="absolute top-4 right-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg z-10">
                SALE
              </div>
            )}
          </div>
        )}

        <CardContent className="absolute bottom-0 left-0 right-0 pt-12 pb-6 px-6 flex flex-col items-center justify-end bg-gradient-to-t from-black via-black/80 to-transparent z-10">
          <CardTitle className="text-3xl font-bold text-white mb-2 text-center">
            {currentProduct.name}
          </CardTitle>

          {/* 🏷️ FIXED PRICE DISPLAY */}
          <div className="mb-4">
            {isOnSale ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-green-400">
                  {formatMoney(salePrice)}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  {formatMoney(originalPrice)}
                </span>
              </div>
            ) : (
              <p className="text-xl text-blue-400 font-bold">
                {formatMoney(currentProduct.price)}
              </p>
            )}
          </div>

          <span className="px-6 py-2 bg-white text-black font-bold rounded-full text-sm">
            View Product
          </span>
        </CardContent>
      </Card>
    </Link>
  );
};

"use client";

import { Card, CardContent, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// 👇 Updated Interface to match Sanity data
interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  category: string;
}

interface Props {
  products: Product[];
}

export const Carousel = ({ products }: Props) => {
  const [current, setCurrent] = useState<number>(0);

  // Auto-rotate every 3 seconds
  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % products.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [products.length]);

  if (!products || products.length === 0) return null;

  const currentProduct = products[current];

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
          </div>
        )}
        
        {/* Overlay Content */}
        <CardContent className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <CardTitle className="text-3xl font-bold text-white mb-2 text-center">
            {currentProduct.name}
          </CardTitle>
          <p className="text-xl text-blue-400 font-bold">
            ${currentProduct.price}
          </p>
          <span className="mt-4 px-6 py-2 bg-white text-black font-bold rounded-full text-sm">
            View Product
          </span>
        </CardContent>
      </Card>
    </Link>
  );
};
import { client } from "@/sanity/lib/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import ProductControls from "@/components/product-controls";
import { calculateSalePrice, Sale } from "@/lib/sale-utils";

// ✅ GLOBAL CURRENCY FORMATTER
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const productQuery = `
    *[_type == "product" && slug.current == $slug][0] {
      _id,
      "name": title,
      "slug": slug.current,
      description,
      "imageUrl": images[0].asset->url,
      price,
      inventory,
      "category": category,
      tags 
    }
  `;

  const salesQuery = `*[_type == "sale" && isActive == true]`;

  const [product, sales] = await Promise.all([
    client.fetch(productQuery, { slug }, { next: { revalidate: 0 } }),
    client.fetch<Sale[]>(salesQuery, {}, { next: { revalidate: 0 } }),
  ]);

  if (!product) return notFound();

  const { salePrice, originalPrice, isOnSale } = calculateSalePrice(
    product,
    sales
  );

  return (
    <div className="container mx-auto px-4 py-12 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* LEFT: IMAGE */}
        <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              No Image
            </div>
          )}

          {isOnSale && (product.inventory || 0) > 0 && (
            <div className="absolute top-4 right-4 bg-green-600 text-white font-bold px-3 py-1 rounded shadow-lg z-10">
              SALE
            </div>
          )}
        </div>

        {/* RIGHT: DETAILS */}
        <div>
          <h1 className="text-4xl font-extrabold mb-2">{product.name}</h1>

          {/* 🏷️ FIXED PRICE DISPLAY */}
          <div className="mb-4">
            {isOnSale ? (
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-green-400">
                  {formatMoney(salePrice)}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  {formatMoney(originalPrice)}
                </span>
              </div>
            ) : (
              <p className="text-2xl text-gray-300 font-medium">
                {product.price
                  ? formatMoney(product.price)
                  : "Price Unavailable"}
              </p>
            )}
          </div>

          <ProductControls
            product={{
              id: product._id,
              name: product.name,
              price: salePrice,
              originalPrice: originalPrice,
              imageUrl: product.imageUrl,
              maxQuantity: product.inventory || 0,
              slug: product.slug,
              category: product.category,
            }}
          />

          <hr className="border-gray-800 my-6" />

          <h3 className="text-xl font-bold mb-3">Care Guide</h3>
          <div className="prose prose-invert max-w-none text-gray-300">
            {product.description ? (
              <PortableText value={product.description} />
            ) : (
              <p className="text-gray-500 italic">No description available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

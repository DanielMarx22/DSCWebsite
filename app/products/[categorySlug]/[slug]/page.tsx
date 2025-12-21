import { client } from "@/sanity/lib/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import ProductControls from "@/components/product-controls"; // 👈 Import new component

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await client.fetch(`
  *[_type == "product" && slug.current == $slug][0] {
    _id,
    "name": title,
    "slug": slug.current,
    description,
    "imageUrl": images[0].asset->url,
    price,
    inventory,
    // Try to get category slug from a reference OR a direct field
    "category": coalesce(category->slug.current, categorySlug, "uncategorized")
  }
`, { slug });

  // DEBUG: This will show up in your VS Code terminal
  console.log("--- SERVER SIDE PRODUCT CHECK ---");
  console.log("ID:", product?._id);
  console.log("Slug:", product?.slug);
  console.log("Category Result:", product?.category);
  console.log("---------------------------------");

  if (!product) return notFound();

  if (!product) {
    return notFound();
  }

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
            <div className="flex h-full items-center justify-center text-gray-500">No Image</div>
          )}
        </div>

        {/* RIGHT: DETAILS */}
        <div>
          {/* Title */}
          <h1 className="text-4xl font-extrabold mb-2">{product.name}</h1>

          {/* Price */}
          <p className="text-2xl text-gray-300 font-medium mb-4">
            ${product.price ? product.price.toFixed(2) : "0.00"} USD
          </p>

          {/* Controls (Stock badge + Buttons) */}
          <ProductControls
            product={{
              id: product._id,
              name: product.name,
              price: product.price || 0,
              imageUrl: product.imageUrl,
              maxQuantity: product.inventory || 0,
              slug: product.slug,      // 👈 Added this
              category: product.category // 👈 Added this
            }}
          />

          <hr className="border-gray-800 my-6" />

          {/* Care Guide / Description */}
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
import Link from "next/link";
import Image from "next/image";

interface Props {
  product: any; // Using 'any' since we have hybrid Sanity/Stripe data now
}

export const ProductCard = ({ product }: Props) => {
  return (
    <Link
      href={`/products/${product.metadata?.category || 'supplies'}/${product.id}`}
      className="group block overflow-hidden rounded-lg border border-gray-800 bg-gray-900"
    >
      {/* IMAGE CONTAINER */}
      {/* aspect-square: Forces width and height to be equal */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-800">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            // object-cover: Crops the image to fill the square without squishing/stretching
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            No Image
          </div>
        )}

        {/* INVENTORY BADGE (Optional but nice) */}
        {product.inventory === 0 && (
           <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
             SOLD OUT
           </div>
        )}
      </div>

      {/* TEXT CONTENT */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white truncate">{product.name}</h3>
        
        {/* Helper to show price if it exists */}
        {product.default_price?.unit_amount ? (
           <p className="mt-1 text-sm text-gray-400">
             ${(product.default_price.unit_amount / 100).toFixed(2)}
           </p>
        ) : (
           <p className="mt-1 text-sm text-blue-400 font-semibold">View Details</p>
        )}
      </div>
    </Link>
  );
};
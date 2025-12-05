"use client";

import Image from "next/image";

const brands = [
  // You can replace these with real logo files in public/images/brands/ later
  { name: "Ecotech", logo: "/images/ecotech.png" },
  { name: "Red Sea", logo: "/images/redsea.png" },
  { name: "Neptune", logo: "/images/neptune.png" },
  { name: "Hannah", logo: "/images/hannah.png" },
  { name: "PolypLab", logo: "/images/polyplab.png" },
  { name: "Sicce", logo: "/images/sicce.png" },
];

export const BrandCarousel = () => {
  return (
    <div className="w-full bg-black py-12 overflow-hidden border-y border-gray-900">
      <div className="relative w-full max-w-7xl mx-auto px-4">
        <h3 className="text-center text-gray-500 text-sm font-semibold uppercase tracking-wider mb-8">
          Trusted Brands We Carry
        </h3>

        {/* The Sliding Container */}
        <div className="flex overflow-hidden group">
          <div className="flex space-x-16 animate-loop-scroll group-hover:paused">
            {/* Render list twice to create seamless loop */}
            {[...brands, ...brands].map((brand, index) => (
              <div
                key={index}
                className="flex items-center justify-center min-w-[150px] grayscale hover:grayscale-0 transition-all opacity-50 hover:opacity-100"
              >
                {/* Placeholder text if you don't have images yet */}
                <span className="text-2xl font-bold text-gray-300">
                  {brand.name}
                </span>

                {/* Uncomment when you have images:
                <Image src={brand.logo} alt={brand.name} width={150} height={50} className="object-contain" />
                */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

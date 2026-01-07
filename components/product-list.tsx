"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { Sale } from "@/lib/sale-utils";

// --- TYPES ---
type Product = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  category: string;
  tags?: string[];
  inventory: number;
};

interface ProductListProps {
  products: Product[];
  sales?: Sale[];
  emptyMessage?: string;
}

// --- HELPER: COLLAPSIBLE FILTER SECTION ---
function FilterSection({ title, options, selected, onToggle }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const limit = 5;

  if (options.length === 0) return null;
  const visibleOptions = isExpanded ? options : options.slice(0, limit);

  return (
    <div className="border-b border-gray-800 py-6">
      <h3 className="font-bold text-lg mb-4 capitalize text-white">{title}</h3>
      <div className="space-y-3">
        {visibleOptions.map((option: string) => (
          <label
            key={option}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-sm text-gray-300 group-hover:text-blue-400 transition-colors">
              {option}
            </span>
          </label>
        ))}
      </div>
      {options.length > limit && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm font-bold text-blue-500 mt-4 hover:underline"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              Show More ({options.length - limit}){" "}
              <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---
export function ProductList({
  products,
  sales,
  emptyMessage,
}: ProductListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // STATES & LOGIC
  const showAll = searchParams.get("showAll") === "true";
  const [sortOption, setSortOption] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: "",
    max: "",
  });

  // HANDLERS
  const toggleStock = (type: "in" | "out") => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "out") {
      if (showAll) params.delete("showAll");
      else params.set("showAll", "true");
    } else {
      params.delete("showAll");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const maxProductPrice = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.max(...products.map((p) => p.price));
  }, [products]);

  const handleMinBlur = () => {
    if (priceRange.min === "") return;
    let val = parseFloat(priceRange.min);
    if (val < 0) val = 0;
    if (val > maxProductPrice) val = maxProductPrice;
    setPriceRange((prev) => ({ ...prev, min: val.toString() }));
  };

  const handleMaxBlur = () => {
    if (priceRange.max === "") return;
    let val = parseFloat(priceRange.max);
    if (val < 0) val = 0;
    if (val > maxProductPrice) val = maxProductPrice;
    setPriceRange((prev) => ({ ...prev, max: val.toString() }));
  };

  const tagGroups = useMemo(() => {
    const groups: Record<string, Set<string>> = {
      fish: new Set(),
      corals: new Set(),
      inverts: new Set(),
      supplies: new Set(),
      aquariums: new Set(),
    };
    products.forEach((p) => {
      if (p.tags && p.category && groups[p.category]) {
        p.tags.forEach((tag) => groups[p.category].add(tag));
      }
    });
    return {
      fish: Array.from(groups.fish).sort(),
      corals: Array.from(groups.corals).sort(),
      inverts: Array.from(groups.inverts).sort(),
      supplies: Array.from(groups.supplies).sort(),
      aquariums: Array.from(groups.aquariums).sort(),
    };
  }, [products]);

  useEffect(() => {
    const allValidTags = new Set<string>();
    products.forEach((p) => p.tags?.forEach((t) => allValidTags.add(t)));
    setSelectedTags((prev) => prev.filter((tag) => allValidTags.has(tag)));
  }, [products]);

  const activeCategories = useMemo(
    () => new Set(products.map((p) => p.category)),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedTags.length > 0) {
      result = result.filter((product) =>
        selectedTags.some((tag) => product.tags?.includes(tag))
      );
    }
    if (priceRange.min)
      result = result.filter((p) => (p.price || 0) >= Number(priceRange.min));
    if (priceRange.max)
      result = result.filter((p) => (p.price || 0) <= Number(priceRange.max));

    result.sort((a, b) => {
      const stockA = (a.inventory || 0) > 0 ? 1 : 0;
      const stockB = (b.inventory || 0) > 0 ? 1 : 0;
      if (stockA !== stockB) return stockB - stockA;
      switch (sortOption) {
        case "price-asc":
          return (a.price || 0) - (b.price || 0);
        case "price-desc":
          return (b.price || 0) - (a.price || 0);
        case "alpha":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    return result;
  }, [products, sortOption, selectedTags, priceRange]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="flex flex-col md:flex-row w-full px-6 md:px-12 pt-8 gap-8">
      {/* --- SIDEBAR --- */}
      <aside
        className={`
        fixed md:sticky md:top-24 inset-0 z-50 bg-black md:bg-transparent flex flex-col transition-transform duration-300 w-full md:w-64 flex-shrink-0 h-full md:h-auto
        ${showMobileFilters ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* HEADER (Mobile Only) */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800 md:hidden">
          <h3 className="font-bold text-xl text-white">Filters</h3>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* SCROLLABLE FILTER CONTENT */}
        {/* Added flex-1 and overflow-y-auto so only this part scrolls */}
        <div className="flex-1 overflow-y-auto p-6 md:p-0">
          {/* PRICE */}
          <div className="border-b border-gray-800 pb-6 md:pt-0">
            <div className="flex justify-between items-end mb-4">
              <h3 className="font-bold text-lg text-white">Price</h3>
              <span className="text-xs text-gray-400">
                Max: ${maxProductPrice}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                }
                onBlur={handleMinBlur}
                className="w-full pl-6 pr-2 py-2 border border-gray-700 rounded-md text-sm bg-gray-900 text-white placeholder-gray-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                min="0"
                max={maxProductPrice}
                placeholder={`${maxProductPrice}`}
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                }
                onBlur={handleMaxBlur}
                className="w-full pl-6 pr-2 py-2 border border-gray-700 rounded-md text-sm bg-gray-900 text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* AVAILABILITY */}
          <div className="border-b border-gray-800 py-6">
            <h3 className="font-bold text-lg mb-4 text-white">Availability</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => toggleStock("in")}
                  className="rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-sm text-gray-300">In Stock</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={() => toggleStock("out")}
                  className="rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-sm text-gray-300">Out of Stock</span>
              </label>
            </div>
          </div>

          {/* TAGS */}
          {activeCategories.has("fish") && tagGroups.fish.length > 0 && (
            <FilterSection
              title="Fish Type"
              options={tagGroups.fish}
              selected={selectedTags}
              onToggle={toggleTag}
            />
          )}
          {activeCategories.has("corals") && tagGroups.corals.length > 0 && (
            <FilterSection
              title="Coral Type"
              options={tagGroups.corals}
              selected={selectedTags}
              onToggle={toggleTag}
            />
          )}
          {activeCategories.has("inverts") && tagGroups.inverts.length > 0 && (
            <FilterSection
              title="Invert Type"
              options={tagGroups.inverts}
              selected={selectedTags}
              onToggle={toggleTag}
            />
          )}
          {activeCategories.has("supplies") &&
            tagGroups.supplies.length > 0 && (
              <FilterSection
                title="Supply Type"
                options={tagGroups.supplies}
                selected={selectedTags}
                onToggle={toggleTag}
              />
            )}
          {activeCategories.has("aquariums") &&
            tagGroups.aquariums.length > 0 && (
              <FilterSection
                title="Aquarium Types"
                options={tagGroups.aquariums}
                selected={selectedTags}
                onToggle={toggleTag}
              />
            )}
        </div>

        {/* ✨ NEW: STICKY "VIEW RESULTS" BUTTON (Mobile Only) */}
        <div className="md:hidden p-4 border-t border-gray-800 bg-black">
          <button
            onClick={() => setShowMobileFilters(false)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-full transition-colors"
          >
            View {filteredProducts.length} Results
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 w-full min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <span className="text-sm text-gray-400 font-medium">
            Showing {filteredProducts.length} Results
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center justify-center px-4 py-2 border border-gray-700 bg-gray-900 text-white rounded-md text-sm font-bold flex-1"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
            </button>
            <select
              className="border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-900 text-white cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="alpha">Name: A-Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} data={product} sales={sales} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center text-gray-500 bg-gray-900/50 rounded-lg border border-gray-800">
            <p className="text-lg mb-2">
              {emptyMessage || "No products match your filters."}
            </p>
            <button
              onClick={() => {
                setSelectedTags([]);
                setPriceRange({ min: "", max: "" });
                const params = new URLSearchParams(searchParams.toString());
                params.delete("showAll");
                router.push(`?${params.toString()}`);
              }}
              className="text-blue-500 font-bold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

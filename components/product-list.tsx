"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";

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
  emptyMessage?: string; // 👈 NEW PROP
}

// --- HELPER: COLLAPSIBLE FILTER SECTION ---
function FilterSection({ title, options, selected, onToggle }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const limit = 5;

  if (options.length === 0) return null;

  const visibleOptions = isExpanded ? options : options.slice(0, limit);

  return (
    <div className="border-b border-gray-200 py-6">
      <h3 className="font-bold text-lg mb-4 capitalize">{title}</h3>
      <div className="space-y-3">
        {visibleOptions.map((option: string) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
              {option}
            </span>
          </label>
        ))}
      </div>

      {options.length > limit && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm font-bold text-blue-600 mt-4 hover:underline"
        >
          {isExpanded ? (
            <>Show Less <ChevronUp className="w-4 h-4 ml-1" /></>
          ) : (
            <>Show More ({options.length - limit}) <ChevronDown className="w-4 h-4 ml-1" /></>
          )}
        </button>
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---
export function ProductList({ products, emptyMessage }: ProductListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. URL STATE
  const showAll = searchParams.get("showAll") === "true";

  // 2. LOCAL STATE
  const [sortOption, setSortOption] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });

  // 3. HANDLE STOCK TOGGLE
  const toggleStock = (type: "in" | "out") => {
    const params = new URLSearchParams(searchParams.toString());

    if (type === "out") {
      if (showAll) {
        params.delete("showAll");
      } else {
        params.set("showAll", "true");
      }
    } else {
      params.delete("showAll");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // 4. CALCULATE MAX PRICE
  const maxProductPrice = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.max(...products.map(p => p.price));
  }, [products]);

  // 5. PRICE HANDLERS
  const handleMinBlur = () => {
    if (priceRange.min === "") return;
    let val = parseFloat(priceRange.min);
    if (val < 0) val = 0;
    if (val > maxProductPrice) val = maxProductPrice;
    setPriceRange(prev => ({ ...prev, min: val.toString() }));
  };

  const handleMaxBlur = () => {
    if (priceRange.max === "") return;
    let val = parseFloat(priceRange.max);
    if (val < 0) val = 0;
    if (val > maxProductPrice) val = maxProductPrice;
    setPriceRange(prev => ({ ...prev, max: val.toString() }));
  };

  // 6. EXTRACT TAGS
  const tagGroups = useMemo(() => {
    const groups: Record<string, Set<string>> = {
      fish: new Set(),
      corals: new Set(),
      inverts: new Set(),
      supplies: new Set(),
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
    };
  }, [products]);

  const activeCategories = useMemo(() => {
    const categoriesInView = new Set(products.map(p => p.category));
    return categoriesInView;
  }, [products]);

  // 7. FILTERING
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedTags.length > 0) {
      result = result.filter((product) =>
        selectedTags.some((tag) => product.tags?.includes(tag))
      );
    }

    if (priceRange.min) {
      result = result.filter((p) => (p.price || 0) >= Number(priceRange.min));
    }
    if (priceRange.max) {
      result = result.filter((p) => (p.price || 0) <= Number(priceRange.max));
    }

    result.sort((a, b) => {
      const stockA = (a.inventory || 0) > 0 ? 1 : 0;
      const stockB = (b.inventory || 0) > 0 ? 1 : 0;
      if (stockA !== stockB) return stockB - stockA;

      switch (sortOption) {
        case "price-asc": return (a.price || 0) - (b.price || 0);
        case "price-desc": return (b.price || 0) - (a.price || 0);
        case "alpha": return a.name.localeCompare(b.name);
        default: return 0;
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
    <div className="flex flex-col md:flex-row gap-8 pt-6">

      {/* --- SIDEBAR (Always Visible) --- */}
      <aside className={`
        fixed md:relative inset-0 z-50 bg-white md:bg-transparent p-6 md:p-0 overflow-y-auto md:overflow-visible transition-transform duration-300 w-full md:w-64 flex-shrink-0
        ${showMobileFilters ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="flex justify-between items-center md:hidden mb-6">
          <h3 className="font-bold text-xl">Filters</h3>
          <button onClick={() => setShowMobileFilters(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* PRICE FILTER */}
        <div className="border-b border-gray-200 pb-6 md:pt-0">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-lg">Price</h3>
            <span className="text-xs text-gray-400">Max: ${maxProductPrice}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" placeholder="0"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              onBlur={handleMinBlur}
              className="w-full pl-6 pr-2 py-2 border rounded-md text-sm bg-white text-black"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number" min="0" max={maxProductPrice} placeholder={`${maxProductPrice}`}
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              onBlur={handleMaxBlur}
              className="w-full pl-6 pr-2 py-2 border rounded-md text-sm bg-white text-black"
            />
          </div>
        </div>

        {/* AVAILABILITY FILTER */}
        <div className="border-b border-gray-200 py-6">
          <h3 className="font-bold text-lg mb-4">Availability</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={true}
                onChange={() => toggleStock("in")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-sm text-gray-700">In Stock</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAll}
                onChange={() => toggleStock("out")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-sm text-gray-700">Out of Stock</span>
            </label>
          </div>
        </div>

        {/* TAGS (Only shows if products have tags) */}
        {activeCategories.has('fish') && tagGroups.fish.length > 0 && (
          <FilterSection title="Fish Type" options={tagGroups.fish} selected={selectedTags} onToggle={toggleTag} />
        )}
        {activeCategories.has('corals') && tagGroups.corals.length > 0 && (
          <FilterSection title="Coral Type" options={tagGroups.corals} selected={selectedTags} onToggle={toggleTag} />
        )}
        {activeCategories.has('inverts') && tagGroups.inverts.length > 0 && (
          <FilterSection title="Invert Type" options={tagGroups.inverts} selected={selectedTags} onToggle={toggleTag} />
        )}
        {activeCategories.has('supplies') && tagGroups.supplies.length > 0 && (
          <FilterSection title="Supply Type" options={tagGroups.supplies} selected={selectedTags} onToggle={toggleTag} />
        )}
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <span className="text-sm text-gray-500 font-medium">
            Showing {filteredProducts.length} Results
          </span>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center justify-center px-4 py-2 border border-gray-300 bg-white text-black rounded-md text-sm font-bold flex-1"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
            </button>

            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-black cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} data={product} />
          ))}
        </div>

        {/* EMPTY STATE */}
        {filteredProducts.length === 0 && (
          <div className="py-20 text-center text-gray-500 bg-black rounded-lg border border-gray-300">
            {/* 👈 USE THE CUSTOM MESSAGE OR DEFAULT */}
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
              className="text-blue-600 font-bold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
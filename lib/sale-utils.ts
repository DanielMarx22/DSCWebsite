// lib/sale-utils.ts

export interface Sale {
    _id: string;
    title: string;
    discountType: "percentage" | "fixed";
    amount: number;
    startDate?: string;
    endDate?: string;
    targetCategories?: string[];
    targetTags?: string[];
    targetProducts?: { _ref: string }[];
}

export interface ProductPriceData {
    _id: string;
    price: number;
    category: string;
    tags?: string[];
}

/**
 * Calculates the best price for a product based on active sales.
 */
export function calculateSalePrice(product: ProductPriceData, activeSales: Sale[]) {
    const now = new Date();
    let finalPrice = product.price;
    let appliedSale: Sale | null = null;

    // 1. Loop through all sales to find the BEST discount
    for (const sale of activeSales) {

        // A. Check Dates (Skip if expired or future)
        if (sale.startDate && new Date(sale.startDate) > now) continue;
        if (sale.endDate && new Date(sale.endDate) < now) continue;

        // B. Check Matches (Does this product qualify?)
        let isMatch = false;

        // Check 1: Category Match (e.g., "fish")
        if (sale.targetCategories?.includes(product.category)) {
            isMatch = true;
        }

        // Check 2: Tag Match (e.g., "Tang")
        if (!isMatch && sale.targetTags && product.tags) {
            if (product.tags.some(tag => sale.targetTags!.includes(tag))) {
                isMatch = true;
            }
        }

        // Check 3: Specific Product ID Match
        if (!isMatch && sale.targetProducts) {
            if (sale.targetProducts.some(ref => ref._ref === product._id)) {
                isMatch = true;
            }
        }

        // C. Calculate Potential New Price
        if (isMatch) {
            let newPrice = product.price;

            if (sale.discountType === "percentage") {
                // Example: 20% off $100 -> $80
                newPrice = product.price - (product.price * (sale.amount / 100));
            } else if (sale.discountType === "fixed") {
                // Example: $5 off $20 -> $15
                newPrice = product.price - sale.amount;
            }

            // Ensure price doesn't go below 0
            if (newPrice < 0) newPrice = 0;

            // D. Strategy: Keep the Lowest Price found so far
            if (newPrice < finalPrice) {
                finalPrice = newPrice;
                appliedSale = sale;
            }
        }
    }

    // Round to 2 decimals
    finalPrice = Math.round(finalPrice * 100) / 100;

    return {
        originalPrice: product.price,
        salePrice: finalPrice,
        isOnSale: finalPrice < product.price,
        discountAmount: product.price - finalPrice,
        saleLabel: appliedSale?.title || null
    };
}
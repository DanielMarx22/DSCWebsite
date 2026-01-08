"use server";

import { client } from "@/sanity/lib/client";

export async function getSimilarProducts(cartItemIds: string[]) {
  if (!cartItemIds || cartItemIds.length === 0) return [];

  try {
    // 1. ANALYZE CART: Get full details (Tags & Category) of items currently in the cart
    const cartDetails = await client.fetch(
      `*[_type == "product" && _id in $ids]{
        category,
        tags
      }`,
      { ids: cartItemIds }
    );

    // 2. EXTRACT PREFERENCES
    const categories = new Set<string>();
    const preferredTags = new Set<string>();

    cartDetails.forEach((item: any) => {
      if (item.category) categories.add(item.category);
      if (item.tags) item.tags.forEach((tag: string) => preferredTags.add(tag));
    });

    const categoryList = Array.from(categories);

    // 3. FETCH CANDIDATES
    // Query: "Find In-Stock products from these Categories, excluding items I already have"
    const query = `
      *[_type == "product" && inventory > 0 && !(_id in $cartIds) && category in $categories] {
        _id,
        "name": title,
        "slug": slug.current,
        price,
        "imageUrl": images[0].asset->url,
        category,
        tags,
        inventory
      }[0...40] 
    `;

    const candidates = await client.fetch(query, {
      cartIds: cartItemIds,
      categories: categoryList,
    });

    // 4. INTELLIGENT SCORING
    // We sort the candidates in JavaScript to handle the "Features" weight
    const scoredProducts = candidates.map((product: any) => {
      let score = 0;

      // Rule A: Tag Match (Highest Priority after Stock)
      // If cart has "Zoa", and this product is "Zoa", +5 points
      if (product.tags) {
        product.tags.forEach((tag: string) => {
          if (preferredTags.has(tag)) score += 5;
        });
      }

      // Rule B: Randomize slightly so it's not the same 4 every time if scores are tied
      score += Math.random();

      return { product, score };
    });

    // 5. SORT & PICK TOP 4
    scoredProducts.sort((a: any, b: any) => b.score - a.score);

    return scoredProducts.slice(0, 4).map((p: any) => p.product);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}

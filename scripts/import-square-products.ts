import { SquareClient, SquareEnvironment } from "square";
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import slugify from "slugify";

dotenv.config({ path: ".env.local" });

// 1. Setup Square Client
const square = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production,
});

// 2. Setup Sanity Client
const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    token: process.env.SANITY_API_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
});

// HELPER: Convert plain text to Sanity "Portable Text" (Block Content)
// This fixes the "Expected array, got string" error.
function createBlockContent(text: string) {
    if (!text) return [];
    return [
        {
            _type: "block",
            style: "normal",
            markDefs: [],
            children: [
                {
                    _type: "span",
                    marks: [],
                    text: text,
                },
            ],
        },
    ];
}

async function importProducts() {
    console.log("🚀 Starting Square Import (Fixing Schema)...");

    try {
        // 3. Fetch all items
        const response = await square.catalog.list({ types: "ITEM" }) as any;

        let items = [];
        if (Array.isArray(response.data)) {
            items = response.data;
        } else if (response.data?.objects) {
            items = response.data.objects;
        }

        if (!items || items.length === 0) {
            console.log("No products found in Square.");
            return;
        }

        console.log(`📦 Found ${items.length} products. Syncing...`);

        for (const item of items) {
            const rawItem = item as any;
            if (!rawItem.itemData) continue;

            const squareId = rawItem.id;
            const name = rawItem.itemData.name || "Untitled";
            const description = rawItem.itemData.description || "";

            // Price Logic
            const variation = rawItem.itemData.variations?.[0];
            const moneyAmount = variation?.itemVariationData?.priceMoney?.amount;
            const priceVal = Number(moneyAmount || 0) / 100;

            // Stock Logic: Set to 0 as requested
            const stockCount = 0;

            const slug = slugify(name, { lower: true, strict: true });

            // 4. Handle Image
            let imageAsset = null;
            if (rawItem.itemData.imageIds && rawItem.itemData.imageIds.length > 0) {
                try {
                    const imageId = rawItem.itemData.imageIds[0];
                    const imgRes = await square.catalog.object.retrieve(imageId) as any;
                    const imgObj = imgRes.data?.object || imgRes.data || imgRes.object;
                    const imgUrl = imgObj?.imageData?.url;

                    if (imgUrl) {
                        console.log(`   Downloading image for ${name}...`);
                        const res = await fetch(imgUrl);
                        const buffer = await res.arrayBuffer();
                        const asset = await sanity.assets.upload("image", Buffer.from(buffer), {
                            filename: `${slug}.jpg`,
                        });
                        imageAsset = {
                            _type: "image",
                            asset: { _ref: asset._id },
                        };
                    }
                } catch (err) {
                    // Silent fail on images is fine if they don't exist
                }
            }

            // 5. Create Product in Sanity
            // FIXES: Using 'title' instead of 'name'
            // FIXES: converting 'description' to Block Content
            const sanityDoc = {
                _id: `square-${squareId}`,
                _type: "product",
                title: name,                    // FIXED: Sanity expects 'title'
                slug: { _type: "slug", current: slug },
                price: priceVal,
                description: createBlockContent(description), // FIXED: Converted to Array
                inventory: stockCount,          // FIXED: Set to 0
                ...(imageAsset && { images: [imageAsset] }),
            };

            await sanity.createOrReplace(sanityDoc);
            console.log(`✅ Synced: ${name}`);
        }

        console.log("🎉 Import Complete!");

    } catch (error: any) {
        console.error("❌ Import Failed:", error.message || error);
    }
}

importProducts();
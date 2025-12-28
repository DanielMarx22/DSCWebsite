import { NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";
import { createClient } from "@sanity/client";
import slugify from "slugify";

// 1. Setup Clients
const square = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production,
});

const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    token: process.env.SANITY_API_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
});

function createBlockContent(text: string) {
    if (!text) return [];
    return [{ _type: "block", style: "normal", children: [{ _type: "span", text }] }];
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.SANITY_API_TOKEN && secret !== "my-secret-password") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("🚀 Starting Full Catalog Sync (Direct API Mode)...");

        let allItems: any[] = [];
        let cursor: string | null = null;
        let pageCount = 0;

        // --- PAGINATION LOOP (Using Direct Fetch) ---
        do {
            pageCount++;
            // Build URL manually to guarantee we get the raw cursor
            let url = `https://connect.squareup.com/v2/catalog/list?types=ITEM`;
            if (cursor) {
                url += `&cursor=${cursor}`;
            }

            console.log(`   Fetching Page ${pageCount}...`);

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-store' // Don't use Next.js cache
            });

            if (!res.ok) {
                throw new Error(`Square API Error: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();

            if (data.objects && data.objects.length > 0) {
                allItems = [...allItems, ...data.objects];
                console.log(`     -> Found ${data.objects.length} items.`);
            }

            // The Raw API puts 'cursor' at the very top level. Impossible to miss.
            cursor = data.cursor || null;

        } while (cursor);

        if (allItems.length === 0) {
            return NextResponse.json({ message: "No products found in Square." });
        }

        console.log(`📦 Found ${allItems.length} total products. Syncing to Sanity...`);
        let syncedCount = 0;

        // --- SYNC LOOP ---
        for (const item of allItems) {
            // NOTE: Raw API uses snake_case (item_data), not camelCase (itemData)
            if (!item.item_data) continue;

            const squareId = item.id;
            const name = item.item_data.name || "Untitled";
            const description = item.item_data.description || "";

            // Price Logic (snake_case)
            const variation = item.item_data.variations?.[0];
            const moneyAmount = variation?.item_variation_data?.price_money?.amount;
            const priceVal = Number(moneyAmount || 0) / 100;

            const slug = slugify(name, { lower: true, strict: true });

            // Handle Image
            let imageAsset = null;
            if (item.item_data.image_ids && item.item_data.image_ids.length > 0) {
                try {
                    // We can still use the SDK here for convenience, or switch to fetch if needed.
                    // The SDK is fine for single object retrieval.
                    const imageId = item.item_data.image_ids[0];

                    // Using SDK for image details (It converts to camelCase)
                    const imgRes = await square.catalog.object.retrieve(imageId) as any;

                    // Reliable image extraction
                    let imgObj = imgRes.data?.object || imgRes.data || imgRes.object;

                    // Fallback parsing if needed
                    if (!imgObj && imgRes.body) {
                        try {
                            const b = typeof imgRes.body === 'string' ? JSON.parse(imgRes.body) : imgRes.body;
                            imgObj = b.object;
                        } catch (e) { }
                    }

                    const imgUrl = imgObj?.imageData?.url;

                    if (imgUrl) {
                        const res = await fetch(imgUrl);
                        const buffer = await res.arrayBuffer();
                        const asset = await sanity.assets.upload("image", Buffer.from(buffer), {
                            filename: `${slug}.jpg`,
                        });
                        imageAsset = { _type: "image", asset: { _ref: asset._id } };
                    }
                } catch (err) {
                    console.warn(`   Could not fetch image for ${name}`);
                }
            }

            const sanityDoc = {
                _id: `square-${squareId}`,
                _type: "product",
                title: name,
                slug: { _type: "slug", current: slug },
                price: priceVal,
                description: createBlockContent(description),
                inventory: 0,
                ...(imageAsset && { images: [imageAsset] }),
            };

            await sanity.createOrReplace(sanityDoc);
            syncedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${syncedCount} products from ${pageCount} pages.`
        });

    } catch (error: any) {
        console.error("SYNC ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
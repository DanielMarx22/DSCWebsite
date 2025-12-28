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
        console.log("🚀 Starting Smart Sync (Preserving Sanity Data)...");

        // --- STEP 1: Fetch All Square Items ---
        let allItems: any[] = [];
        let cursor: string | null = null;
        let pageCount = 0;

        do {
            pageCount++;
            let url = `https://connect.squareup.com/v2/catalog/list?types=ITEM`;
            if (cursor) url += `&cursor=${cursor}`;

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-store'
            });

            const data = await res.json();
            if (data.objects) allItems = [...allItems, ...data.objects];
            cursor = data.cursor || null;

        } while (cursor);

        if (allItems.length === 0) return NextResponse.json({ message: "No products in Square." });

        console.log(`📦 Fetched ${allItems.length} items from Square.`);

        // --- STEP 2: Fetch Existing Sanity Data (To Preserve It) ---
        // We fetch the fields we want to KEEP: category, tags, description, inventory
        const existingSanityItems = await sanity.fetch(
            `*[_type == "product"]{ _id, category, tags, description, inventory }`
        );

        // Create a fast lookup map: "square-123" -> { category: ..., description: ... }
        const existingMap = new Map(existingSanityItems.map((i: any) => [i._id, i]));

        let syncedCount = 0;

        // --- STEP 3: The Merge Loop ---
        for (const item of allItems) {
            // Square Data (The "New" Stuff)
            if (!item.item_data) continue;
            const squareId = item.id;
            const sanityId = `square-${squareId}`;

            const squareName = item.item_data.name || "Untitled";
            const squareDesc = item.item_data.description || "";

            const variation = item.item_data.variations?.[0];
            const moneyAmount = variation?.item_variation_data?.price_money?.amount;
            const priceVal = Number(moneyAmount || 0) / 100;
            const slug = slugify(squareName, { lower: true, strict: true });

            // Check what we already have in Sanity
            const oldData = existingMap.get(sanityId);

            // --- IMAGE SYNC (Standard) ---
            let imageAsset = null;
            if (item.item_data.image_ids && item.item_data.image_ids.length > 0) {
                try {
                    const imageId = item.item_data.image_ids[0];
                    const imgRes = await square.catalog.object.retrieve(imageId) as any;
                    let imgObj = imgRes.data?.object || imgRes.data || imgRes.object;
                    if (!imgObj && imgRes.body) {
                        try {
                            const b = typeof imgRes.body === 'string' ? JSON.parse(imgRes.body) : imgRes.body;
                            imgObj = b.object;
                        } catch (e) { }
                    }
                    const imgUrl = imgObj?.imageData?.url;
                    if (imgUrl) {
                        // Only download/upload if we really need to (optimization optional, but safer to re-sync for now)
                        const res = await fetch(imgUrl);
                        const buffer = await res.arrayBuffer();
                        const asset = await sanity.assets.upload("image", Buffer.from(buffer), {
                            filename: `${slug}.jpg`,
                        });
                        imageAsset = { _type: "image", asset: { _ref: asset._id } };
                    }
                } catch (err) { /* Skip image error */ }
            }

            // --- THE MERGE LOGIC ---

            // 1. Description: Use Sanity's if exists, otherwise Square's
            let finalDescription = createBlockContent(squareDesc); // Default to Square
            if (oldData && oldData.description) {
                finalDescription = oldData.description; // Keep Sanity's custom description
            }

            // 2. Inventory: Keep Sanity's count if exists, otherwise 0
            let finalInventory = 0;
            if (oldData && oldData.inventory !== undefined) {
                finalInventory = oldData.inventory;
            }

            // 3. Build the "Merged" Document
            const sanityDoc: any = {
                _id: sanityId,
                _type: "product",
                title: squareName,              // Always update Name from Square
                slug: { _type: "slug", current: slug },
                price: priceVal,                // Always update Price from Square
                description: finalDescription,  // Smart Merge
                inventory: finalInventory,      // Smart Merge
                ...(imageAsset && { images: [imageAsset] }), // Update Image
            };

            // 4. Preserve Category & Tags
            if (oldData) {
                if (oldData.category) sanityDoc.category = oldData.category;
                if (oldData.tags) sanityDoc.tags = oldData.tags;
            }

            await sanity.createOrReplace(sanityDoc);
            syncedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${syncedCount} products. Preserved categories, tags, and custom descriptions.`
        });

    } catch (error: any) {
        console.error("SYNC ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
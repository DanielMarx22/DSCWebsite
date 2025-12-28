import { SquareClient, SquareEnvironment } from "square";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const square = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production, // We assume you are using Production
});

async function debugSquare() {
    console.log("🔍 Debugging Square Connection...");

    try {
        // 1. Log the Environment
        console.log("   - Environment: Production");
        console.log("   - Token length:", process.env.SQUARE_ACCESS_TOKEN?.length || 0);

        // 2. Fetch Catalog
        console.log("   - Fetching Catalog List...");
        // @ts-ignore
        const response = await square.catalog.list({ types: "ITEM" });

        // 3. Inspect the raw response keys
        console.log("\n📋 RAW RESPONSE KEYS:", Object.keys(response));

        // 4. Check for objects in common places
        // @ts-ignore
        const objects = response.objects || response.result?.objects || response.body?.objects;

        if (objects) {
            console.log(`✅ Found ${objects.length} items in the response.`);
            console.log("   - First Item Name:", objects[0]?.itemData?.name);
        } else {
            console.log("❌ 'objects' array is undefined or empty.");
            console.log("   - Full Response Dump (First 500 chars):");
            console.log(JSON.stringify(response, null, 2).substring(0, 500));
        }

    } catch (error: any) {
        console.error("❌ Fatal Error:", error);
        if (error.body) {
            console.error("   - API Error Details:", error.body);
        }
    }
}

debugSquare();
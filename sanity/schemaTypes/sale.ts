import { Tag } from "lucide-react";
import { defineField, defineType } from "sanity";

export const sale = defineType({
    name: "sale",
    title: "Sale / Discount",
    type: "document",
    fields: [
        defineField({
            name: "title",
            title: "Sale Title",
            type: "string",
            description: "Internal name (e.g., 'Black Friday 2025')",
        }),
        defineField({
            name: "isActive",
            title: "Active",
            type: "boolean",
            initialValue: true,
        }),
        defineField({
            name: "discountType",
            title: "Discount Type",
            type: "string",
            options: {
                list: [
                    { title: "Percentage Off (%)", value: "percentage" },
                    { title: "Fixed Amount Off ($)", value: "fixed" },
                ],
                layout: "radio",
            },
            initialValue: "percentage",
        }),
        defineField({
            name: "amount",
            title: "Amount",
            type: "number",
            description: "e.g., 20 for 20%, or 5 for $5 off",
            validation: (Rule) => Rule.required().min(0),
        }),
        defineField({
            name: "startDate",
            title: "Start Date (Optional)",
            type: "datetime",
        }),
        defineField({
            name: "endDate",
            title: "End Date (Optional)",
            type: "datetime",
        }),

        // --- TARGETING ---
        defineField({
            name: "targetCategories",
            title: "Target Categories",
            description: "Apply to entire categories (e.g., 'fish', 'corals')",
            type: "array",
            of: [{ type: "string" }],
            options: {
                list: [
                    { title: "Fish", value: "fish" },
                    { title: "Corals", value: "corals" },
                    { title: "Inverts", value: "inverts" },
                    { title: "Supplies", value: "supplies" },
                ],
            },
        }),
        defineField({
            name: "targetTags",
            title: "Target Tags",
            description: "Apply to specific tags (e.g., 'Wrasse', 'Tang', 'SPS')",
            type: "array",
            of: [{ type: "string" }],
        }),
        defineField({
            name: "targetProducts",
            title: "Specific Products",
            description: "Apply to specific items only",
            type: "array",
            of: [{ type: "reference", to: [{ type: "product" }] }],
        }),
    ],
    preview: {
        select: {
            title: "title",
            amount: "amount",
            type: "discountType",
            active: "isActive",
            startDate: "startDate", // 👈 Added
            endDate: "endDate",     // 👈 Added
        },
        prepare({ title, amount, type, active, startDate, endDate }) {
            const now = new Date();
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            const symbol = type === "percentage" ? "%" : "$";

            // LOGIC: Determine the status label based on Time AND the Toggle
            let statusEmoji = "🟢";
            let statusText = "Active";

            if (!active) {
                statusEmoji = "🔴";
                statusText = "Disabled (Manual)";
            } else if (end && now > end) {
                statusEmoji = "⚫";
                statusText = "Expired"; // 👈 Shows this even if switch is Green!
            } else if (start && now < start) {
                statusEmoji = "🟡";
                statusText = "Scheduled (Future)";
            }

            return {
                title: title,
                subtitle: `${statusEmoji} ${statusText} • ${amount}${symbol} Off`,
            };
        },
    },
});
import { defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product (Coral/Fish)",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Product Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Corals", value: "corals" },
          { title: "Fish", value: "fish" },
          { title: "Inverts", value: "inverts" },
          { title: "Supplies", value: "supplies" },
        ],
      },
    }),
    defineField({
      name: "inventory",
      title: "Inventory Count",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "short_description",
      title: "Short Description (Card)",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "description",
      title: "Full Description / Care Guide",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "stripeId",
      title: "Stripe Product ID",
      type: "string",
      description: "Paste the ID from Stripe here (e.g. prod_TPw...)",
    }),
    defineField({
      name: "image",
      title: "Main Image",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "tags",
      title: "Tags / Keywords",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
      description:
        'Add anything here: "Blue", "Aussie", "Ultra", "High End". Great for future filtering.',
    }),
  ],
});

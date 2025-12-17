import { defineField, defineType } from "sanity";

export default defineType({
  name: "policy",
  title: "Policy Pages",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page Title",
      type: "string", // e.g., "Shipping Policy"
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" }, // e.g., /shipping-policy
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }], // Rich Text Editor
    }),
  ],
});

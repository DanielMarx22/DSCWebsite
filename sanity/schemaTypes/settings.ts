import { defineField, defineType } from "sanity";

export default defineType({
  name: "settings",
  title: "Store Settings",
  type: "document",
  fields: [
    defineField({
      name: "storeName",
      title: "Store Name",
      type: "string",
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "text", // Text allows multiple lines
      rows: 3,
    }),
    defineField({
      name: "email",
      title: "Support Email",
      type: "string",
    }),
    defineField({
      name: "phone",
      title: "Phone Number",
      type: "string",
    }),
    defineField({
      name: "facebook",
      title: "Facebook URL",
      type: "url",
    }),
    defineField({
      name: "instagram",
      title: "Instagram URL",
      type: "url",
    }),
  ],
});

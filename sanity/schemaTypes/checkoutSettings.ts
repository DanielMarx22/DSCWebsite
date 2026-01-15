import { defineField, defineType } from "sanity";
import { CogIcon } from "@sanity/icons";

export const checkoutSettings = defineType({
  name: "checkoutSettings",
  title: "Checkout Settings",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({
      name: "allowedShippingDays",
      title: "Allowed Shipping Days",
      description: "Select the days of the week you ship orders.",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Sunday", value: "0" },
          { title: "Monday", value: "1" },
          { title: "Tuesday", value: "2" },
          { title: "Wednesday", value: "3" },
          { title: "Thursday", value: "4" },
          { title: "Friday", value: "5" },
          { title: "Saturday", value: "6" },
        ],
        layout: "grid",
      },
      initialValue: ["1", "2", "3"],
      validation: (Rule) =>
        Rule.required().min(1).error("Select at least one shipping day."),
    }),
    defineField({
      name: "blackoutDates",
      title: "Blackout Dates",
      description:
        "Add specific dates when shipping is unavailable (e.g., holidays).",
      type: "array",
      of: [{ type: "date", options: { dateFormat: "YYYY-MM-DD" } }],
    }),
    defineField({
      name: "maxBookingWindowDays",
      title: "Maximum Booking Window (Days)",
      description:
        "How many days into the future can a customer select a shipping date?",
      type: "number",
      initialValue: 30,
      validation: (Rule) => Rule.required().min(7).max(120),
    }),
    defineField({
      name: "pickupWarning",
      title: "Store Pickup Warning",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "flatRateShipping",
      title: "Flat Rate Shipping Cost ($)",
      type: "number",
    }),
    // 👇 POLISHED TAX FIELD
    defineField({
      name: "taxRate",
      title: "Sales Tax Rate (%)",
      description:
        "Enter the percentage (e.g. enter 9 for 9%). This will be added to the total at checkout.",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(100),
    }),
  ],
});

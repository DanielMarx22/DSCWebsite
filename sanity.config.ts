"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schema } from "./sanity/schemaTypes";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  schema,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            // 1. Create a dedicated "Singleton" link for Checkout Settings
            S.listItem()
              .title("Checkout Settings")
              .id("checkoutSettings")
              .child(
                S.document()
                  .schemaType("checkoutSettings")
                  .documentId("checkoutSettings") // Forces a constant ID
              ),
            S.divider(),
            // 2. Automatically list all other document types (Products, etc.)
            // but hide 'checkoutSettings' from this general list
            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== "checkoutSettings"
            ),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  // 3. Prevent the "New Document" menu from showing Checkout Settings
  document: {
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === "global") {
        return prev.filter((template) => template.templateId !== "checkoutSettings");
      }
      return prev;
    },
    // Prevent deleting the settings document
    actions: (prev, { schemaType }) => {
      if (schemaType === "checkoutSettings") {
        return prev.filter((action) => action.action !== "delete" && action.action !== "duplicate");
      }
      return prev;
    },
  },
});
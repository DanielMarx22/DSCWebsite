"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dashboardTool } from "@sanity/dashboard"; // 1. Import Dashboard Tool
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schema } from "./sanity/schemaTypes";
import { SyncSquareWidget } from "./sanity/components/SyncSquareWidget"; // 2. Import your Widget

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
            // Singleton: Checkout Settings
            S.listItem()
              .title("Checkout Settings")
              .id("checkoutSettings")
              .child(
                S.document()
                  .schemaType("checkoutSettings")
                  .documentId("checkoutSettings")
              ),
            S.divider(),
            // Everything else (Products, Categories, etc.)
            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== "checkoutSettings"
            ),
          ]),
    }),

    // 3. Add the Dashboard Plugin here
    dashboardTool({
      widgets: [
        {
          name: 'sync-square',
          component: SyncSquareWidget,
          layout: { width: 'medium' }
        }
      ]
    }),

    visionTool({ defaultApiVersion: apiVersion }),
  ],

  // Document Actions (Prevent Deleting Singleton)
  document: {
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === "global") {
        return prev.filter((template) => template.templateId !== "checkoutSettings");
      }
      return prev;
    },
    actions: (prev, { schemaType }) => {
      if (schemaType === "checkoutSettings") {
        return prev.filter((action) => action.action !== "delete" && action.action !== "duplicate");
      }
      return prev;
    },
  },
});
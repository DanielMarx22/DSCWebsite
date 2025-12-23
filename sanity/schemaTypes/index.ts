import { type SchemaTypeDefinition } from "sanity";

// All imports use default (no curly braces)
import product from "./product";
import settings from "./settings";
import policy from "./policy";
import { checkoutSettings } from "./checkoutSettings";
import paymentSettings from "./paymentSettings"; // 👈 Added this

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, settings, policy, checkoutSettings, paymentSettings],
};
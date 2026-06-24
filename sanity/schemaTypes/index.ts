import { type SchemaTypeDefinition } from "sanity";

import product from "./product";
import settings from "./settings";
import policy from "./policy";
import { checkoutSettings } from "./checkoutSettings";
import paymentSettings from "./paymentSettings";
import { subscriber } from "./subscriber";
import { sale } from "./sale"; // 👈 1. Import the new file

export const schema: { types: SchemaTypeDefinition[] } = {
  // 2. Add 'sale' to the array below
  types: [
    product,
    settings,
    policy,
    checkoutSettings,
    paymentSettings,
    subscriber,
    sale,
  ],
};

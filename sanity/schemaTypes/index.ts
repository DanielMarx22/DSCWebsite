import { type SchemaTypeDefinition } from "sanity";


import product from "./product";
import settings from "./settings";
import policy from "./policy";
import { checkoutSettings } from "./checkoutSettings";
import paymentSettings from "./paymentSettings";
import { subscriber } from './subscriber'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, settings, policy, checkoutSettings, paymentSettings, subscriber],
};
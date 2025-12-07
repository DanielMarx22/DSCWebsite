import { product } from "./product";
import { settings } from "./settings"; // 👈 Import
import { policy } from "./policy"; // 👈 Import

export const schema = {
  types: [product, settings, policy], // 👈 Add to list
};

import { type SchemaTypeDefinition } from "sanity";
import { product } from "./product"; // 1. Import your new file

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product], // 2. Add it to this list
};

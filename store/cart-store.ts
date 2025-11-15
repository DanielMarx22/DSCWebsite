// store/cart-store.tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number; // Price in cents
  imageUrl: string | null;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  // Add a function to remove/decrease items
  removeItem: (itemId: string) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      // --- NEW FUNCTION ---
      // This will decrease quantity by 1, or remove if quantity is 1
      removeItem: (itemId) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === itemId);

          // If item isn't found, do nothing
          if (!existing) {
            return state;
          }

          // If quantity is more than 1, just decrease it
          if (existing.quantity > 1) {
            return {
              items: state.items.map((i) =>
                i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
              ),
            };
          }

          // If quantity is 1, filter the item out of the array
          return {
            items: state.items.filter((i) => i.id !== itemId),
          };
        }),
      // --- END NEW FUNCTION ---
    }),
    { name: "cart" }
  )
);

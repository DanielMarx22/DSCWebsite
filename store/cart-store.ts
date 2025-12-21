import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  maxQuantity: number;
  slug: string;
  category: string; // 👈 Add this
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, action: "increase" | "decrease") => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            // Check if adding 1 would exceed limit
            if (existingItem.quantity >= existingItem.maxQuantity) {
              return { items: [...state.items] }; // Do nothing
            }
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, action) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id) {
              if (action === "increase") {
                // 👈 ENFORCE LIMIT HERE
                return item.quantity < item.maxQuantity
                  ? { ...item, quantity: item.quantity + 1 }
                  : item;
              }
              if (action === "decrease") {
                return item.quantity > 1
                  ? { ...item, quantity: item.quantity - 1 }
                  : item;
              }
            }
            return item;
          }),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, CartState } from "./types/cart";
import { cartItemKey } from "./types/cart";

const STORAGE_NAME = "wear-customer-cart";

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (incoming) => {
        const { quantity = 1, ...rest } = incoming;
        set((state) => {
          const key = cartItemKey(
            rest.productId,
            rest.selectedSize,
            rest.selectedColor,
          );
          const existing = state.items.find(
            (i) =>
              cartItemKey(i.productId, i.selectedSize, i.selectedColor) === key,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartItemKey(i.productId, i.selectedSize, i.selectedColor) === key
                  ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
                  : i,
              ),
            };
          }
          const newItem: CartItem = { ...rest, quantity: Math.min(99, Math.max(1, quantity)) };
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (productId, selectedSize, selectedColor) => {
        const key = cartItemKey(productId, selectedSize, selectedColor);
        set((state) => ({
          items: state.items.filter(
            (i) =>
              cartItemKey(i.productId, i.selectedSize, i.selectedColor) !== key,
          ),
        }));
      },

      updateQuantity: (productId, selectedSize, selectedColor, quantity) => {
        const key = cartItemKey(productId, selectedSize, selectedColor);
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter(
              (i) =>
                cartItemKey(i.productId, i.selectedSize, i.selectedColor) !==
                key,
            ),
          }));
          return;
        }
        const clamped = Math.min(99, Math.max(1, quantity));
        set((state) => ({
          items: state.items.map((i) =>
            cartItemKey(i.productId, i.selectedSize, i.selectedColor) === key
              ? { ...i, quantity: clamped }
              : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: STORAGE_NAME,
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
      }),
      merge: (persisted, current) => {
        try {
          const p = persisted as { items?: unknown };
          if (Array.isArray(p?.items)) {
            return { ...current, items: p.items as CartItem[] };
          }
        } catch {
          // malformed storage — start fresh
        }
        return current;
      },
    },
  ),
);

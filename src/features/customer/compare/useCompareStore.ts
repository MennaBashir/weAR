import { create } from "zustand";

export const COMPARE_MIN = 2;
export const COMPARE_MAX = 4;

interface CompareState {
  productIds: string[];
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  isSelected: (productId: string) => boolean;
  isFull: () => boolean;
}

export const useCompareStore = create<CompareState>()((set, get) => ({
  productIds: [],

  add: (productId) =>
    set((state) => {
      if (
        state.productIds.includes(productId) ||
        state.productIds.length >= COMPARE_MAX
      ) {
        return state;
      }
      return { productIds: [...state.productIds, productId] };
    }),

  remove: (productId) =>
    set((state) => ({
      productIds: state.productIds.filter((id) => id !== productId),
    })),

  clear: () => set({ productIds: [] }),

  isSelected: (productId) => get().productIds.includes(productId),

  isFull: () => get().productIds.length >= COMPARE_MAX,
}));

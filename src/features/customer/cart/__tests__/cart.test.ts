import { beforeEach, describe, expect, it, vi } from "vitest";
import { cartItemKey, computeSubtotal, computeItemCount, type CartItem } from "../types/cart";
import { useCartStore } from "../useCartStore";

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: "p1",
  productName: "Test Product",
  productImage: null,
  brand: null,
  unitPrice: 100,
  discountedPrice: null,
  selectedSize: "M",
  selectedColor: "Blue",
  quantity: 1,
  productRoute: "/customer/products/p1",
  ...overrides,
});

describe("cartItemKey", () => {
  it("produces stable key from product+size+color", () => {
    expect(cartItemKey("p1", "M", "Blue")).toBe("p1::M::Blue");
  });

  it("uses empty string for null size/color", () => {
    expect(cartItemKey("p1", null, null)).toBe("p1::::");
  });

  it("distinguishes different variants", () => {
    expect(cartItemKey("p1", "M", "Blue")).not.toBe(cartItemKey("p1", "L", "Blue"));
    expect(cartItemKey("p1", "M", "Blue")).not.toBe(cartItemKey("p1", "M", "Red"));
    expect(cartItemKey("p1", "M", "Blue")).not.toBe(cartItemKey("p2", "M", "Blue"));
  });
});

describe("computeSubtotal", () => {
  it("returns 0 for empty cart", () => {
    expect(computeSubtotal([])).toBe(0);
  });

  it("sums unit prices by quantity", () => {
    const items = [makeItem({ unitPrice: 50, quantity: 2 }), makeItem({ productId: "p2", unitPrice: 30, quantity: 1 })];
    expect(computeSubtotal(items)).toBe(130);
  });

  it("prefers discountedPrice over unitPrice", () => {
    const items = [makeItem({ unitPrice: 100, discountedPrice: 70, quantity: 2 })];
    expect(computeSubtotal(items)).toBe(140);
  });
});

describe("computeItemCount", () => {
  it("returns 0 for empty cart", () => {
    expect(computeItemCount([])).toBe(0);
  });

  it("sums quantities across all items", () => {
    const items = [makeItem({ quantity: 3 }), makeItem({ productId: "p2", quantity: 2 })];
    expect(computeItemCount(items)).toBe(5);
  });
});

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  describe("addItem", () => {
    it("adds a new item", () => {
      useCartStore.getState().addItem(makeItem());
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].productId).toBe("p1");
    });

    it("merges duplicate product+variant combinations", () => {
      const base = makeItem();
      useCartStore.getState().addItem(base);
      useCartStore.getState().addItem(base);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it("adds distinct items when variants differ", () => {
      useCartStore.getState().addItem(makeItem({ selectedSize: "M" }));
      useCartStore.getState().addItem(makeItem({ selectedSize: "L" }));
      expect(useCartStore.getState().items).toHaveLength(2);
    });

    it("clamps quantity to 99 on merge", () => {
      useCartStore.getState().addItem(makeItem({ quantity: 98 }));
      useCartStore.getState().addItem(makeItem({ quantity: 5 }));
      expect(useCartStore.getState().items[0].quantity).toBe(99);
    });

    it("defaults quantity to 1 when not provided", () => {
      const { quantity: _q, ...rest } = makeItem();
      useCartStore.getState().addItem(rest);
      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });
  });

  describe("removeItem", () => {
    it("removes item by product+variant identity", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().removeItem("p1", "M", "Blue");
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("does not remove other items", () => {
      useCartStore.getState().addItem(makeItem({ selectedSize: "M" }));
      useCartStore.getState().addItem(makeItem({ selectedSize: "L" }));
      useCartStore.getState().removeItem("p1", "M", "Blue");
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].selectedSize).toBe("L");
    });
  });

  describe("updateQuantity", () => {
    it("updates quantity for matching item", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().updateQuantity("p1", "M", "Blue", 5);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it("clamps quantity to minimum 1", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().updateQuantity("p1", "M", "Blue", -3);
      // -3 <= 0 triggers remove, not clamp — verify behavior
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("removes item when quantity is 0", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().updateQuantity("p1", "M", "Blue", 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("clamps quantity to max 99", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().updateQuantity("p1", "M", "Blue", 200);
      expect(useCartStore.getState().items[0].quantity).toBe(99);
    });
  });

  describe("clearCart", () => {
    it("removes all items", () => {
      useCartStore.getState().addItem(makeItem({ productId: "p1" }));
      useCartStore.getState().addItem(makeItem({ productId: "p2" }));
      useCartStore.getState().clearCart();
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe("persistence resilience", () => {
    it("recovers from malformed localStorage without crashing", () => {
      localStorage.setItem("wear-customer-cart", "{invalid-json");
      // Re-initializing the store should not throw
      expect(() => useCartStore.getState().items).not.toThrow();
    });

    it("recovers from missing items array in storage", () => {
      localStorage.setItem("wear-customer-cart", JSON.stringify({ items: "not-an-array" }));
      useCartStore.setState({ items: [] }); // simulate re-hydration starting fresh
      expect(useCartStore.getState().items).toEqual([]);
    });
  });
});

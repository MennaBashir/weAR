import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { CustomerCartPage } from "../pages/CustomerCartPage";
import { useCartStore } from "../useCartStore";
import type { CartItem } from "../types/cart";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

const ITEM: CartItem = {
  productId: "p1",
  productName: "Cool Shirt",
  productImage: null,
  brand: "BrandX",
  unitPrice: 100,
  discountedPrice: null,
  selectedSize: "M",
  selectedColor: "Blue",
  quantity: 2,
  productRoute: "/customer/products/p1",
};

const renderCart = () =>
  render(
    <MemoryRouter>
      <CustomerCartPage />
    </MemoryRouter>,
  );

describe("CustomerCartPage", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("shows empty state when cart is empty", () => {
    renderCart();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continue shopping/i })).toBeInTheDocument();
  });

  it("renders cart items", () => {
    useCartStore.setState({ items: [ITEM] });
    renderCart();
    expect(screen.getByText("Cool Shirt")).toBeInTheDocument();
    expect(screen.getByText("BrandX")).toBeInTheDocument();
    // Size and color appear as child spans inside "Size: M" / "Color: Blue"
    expect(screen.getByText(/size:/i)).toBeInTheDocument();
    expect(screen.getByText(/color:/i)).toBeInTheDocument();
  });

  it("shows item count in heading", () => {
    useCartStore.setState({ items: [ITEM] });
    renderCart();
    // "2 items" appears in heading and sidebar; just verify at least one is present
    expect(screen.getAllByText(/2 items/i).length).toBeGreaterThan(0);
  });

  it("remove button removes item from store", () => {
    useCartStore.setState({ items: [ITEM] });
    renderCart();
    const removeBtn = screen.getByRole("button", { name: /remove cool shirt/i });
    fireEvent.click(removeBtn);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("quantity decrease is disabled at quantity 1", () => {
    useCartStore.setState({ items: [{ ...ITEM, quantity: 1 }] });
    renderCart();
    const decreaseBtn = screen.getByRole("button", { name: /decrease quantity/i });
    expect(decreaseBtn).toBeDisabled();
  });

  it("quantity increase button updates store", () => {
    useCartStore.setState({ items: [ITEM] });
    renderCart();
    const increaseBtn = screen.getByRole("button", { name: /increase quantity/i });
    fireEvent.click(increaseBtn);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it("clear cart requires confirmation", () => {
    useCartStore.setState({ items: [ITEM] });
    renderCart();
    const clearBtn = screen.getByRole("button", { name: /clear cart/i });
    fireEvent.click(clearBtn);
    expect(screen.getByText(/clear all items\?/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole("button", { name: /yes, clear/i });
    fireEvent.click(confirmBtn);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("cancel button dismisses clear confirmation", () => {
    useCartStore.setState({ items: [ITEM] });
    renderCart();
    fireEvent.click(screen.getByRole("button", { name: /clear cart/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText(/clear all items\?/i)).not.toBeInTheDocument();
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});

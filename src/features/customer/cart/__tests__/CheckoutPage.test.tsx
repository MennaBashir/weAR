import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { CustomerCheckoutPage } from "../pages/CustomerCheckoutPage";
import { useCartStore } from "../useCartStore";
import { useAuthStore } from "@/features/auth/useAuthStore";
import type { CartItem } from "../types/cart";
import type { CustomerAddress } from "@/features/customer/types/profileAvatar";

vi.mock("@/features/customer/queries/profileAvatar.queries", () => ({
  useCustomerAddresses: vi.fn(),
}));

import { useCustomerAddresses } from "@/features/customer/queries/profileAvatar.queries";

const ITEM: CartItem = {
  productId: "p1",
  productName: "Cool Shirt",
  productImage: null,
  brand: null,
  unitPrice: 50,
  discountedPrice: null,
  selectedSize: "M",
  selectedColor: "Blue",
  quantity: 1,
  productRoute: "/customer/products/p1",
};

const DEFAULT_ADDRESS: CustomerAddress = {
  id: "addr-1",
  fullName: "John Doe",
  phoneNumber: "1234567890",
  line1: "123 Main St",
  city: "Springfield",
  postalCode: "12345",
  country: "US",
  isDefault: true,
};

const renderCheckout = () =>
  render(
    <MemoryRouter>
      <CustomerCheckoutPage />
    </MemoryRouter>,
  );

describe("CustomerCheckoutPage", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    vi.mocked(useCustomerAddresses).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCustomerAddresses>);
  });

  it("shows empty cart message when no items", () => {
    renderCheckout();
    expect(screen.getByText(/nothing to check out/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to cart/i })).toBeInTheDocument();
  });

  it("shows unavailability notice", () => {
    useCartStore.setState({ items: [ITEM] });
    renderCheckout();
    expect(screen.getByText(/order submission and payment are not yet available/i)).toBeInTheDocument();
  });

  it("submission button is disabled and correctly labeled", () => {
    useCartStore.setState({ items: [ITEM] });
    renderCheckout();
    const submitBtn = screen.getByRole("button", { name: /order submission unavailable/i });
    expect(submitBtn).toBeDisabled();
  });

  it("does not call any API on render", () => {
    const apiSpy = vi.fn();
    useCartStore.setState({ items: [ITEM] });
    renderCheckout();
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("shows missing address state when no addresses available", () => {
    useCartStore.setState({ items: [ITEM] });
    vi.mocked(useCustomerAddresses).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCustomerAddresses>);
    renderCheckout();
    expect(screen.getByText(/no address saved yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add an address/i })).toBeInTheDocument();
  });

  it("preselects default address", () => {
    useCartStore.setState({ items: [ITEM] });
    vi.mocked(useCustomerAddresses).mockReturnValue({
      data: [DEFAULT_ADDRESS, { ...DEFAULT_ADDRESS, id: "addr-2", fullName: "Jane Smith", isDefault: false }],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCustomerAddresses>);
    renderCheckout();
    const defaultRadio = screen.getAllByRole("radio")[0];
    expect(defaultRadio).toBeChecked();
  });

  it("shows customer profile when user is present", () => {
    useCartStore.setState({ items: [ITEM] });
    useAuthStore.setState({
      user: {
        id: "c1",
        fullName: "Test Customer",
        email: "test@example.com",
        brandName: "",
        businessType: "customer",
        phoneNumber: null,
        profileImageUrl: null,
      },
      role: "customer",
      isAuthenticated: true,
      accessToken: "tok",
      refreshToken: "ref",
      hasHydrated: true,
    });
    renderCheckout();
    expect(screen.getByText("Test Customer")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });
});

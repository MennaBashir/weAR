import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerHomePage } from "@/features/customer/pages/CustomerHomePage";
import { useCustomerCategories, useCustomerOffers, useCustomerProducts } from "@/features/customer/queries/catalog.queries";

vi.mock("@/features/customer/queries/catalog.queries", () => ({
  useCustomerCategories: vi.fn(),
  useCustomerOffers: vi.fn(),
  useCustomerProducts: vi.fn(),
}));

const mockedCategories = vi.mocked(useCustomerCategories);
const mockedOffers = vi.mocked(useCustomerOffers);
const mockedProducts = vi.mocked(useCustomerProducts);

beforeEach(() => {
  mockedCategories.mockReturnValue({ data: [{ id: "c1", name: "Dresses", productCount: 12 }], isLoading: false, isError: false, refetch: vi.fn() } as never);
  mockedOffers.mockReturnValue({ data: [{ id: "o1", title: "Summer edit", description: "Fresh offer" }], isLoading: false, isError: false, refetch: vi.fn() } as never);
  mockedProducts.mockReturnValue({ data: { items: [{ id: "p1", name: "Linen Dress", price: 90, imageUrl: null }], totalCount: 1 }, isLoading: false, isError: false, refetch: vi.fn() } as never);
});

describe("CustomerHomePage", () => {
  it("renders the storefront home hierarchy and product sections", () => {
    render(<MemoryRouter><CustomerHomePage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /Discover fashion/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Product categories/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Virtual try-on/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Best Seller/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /New Arrival/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /All Products/i })).toBeInTheDocument();
    expect(screen.getAllByText("Linen Dress").length).toBeGreaterThan(0);
  });
});

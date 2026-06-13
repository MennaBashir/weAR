import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CustomerShopPage } from "@/features/customer/pages/CustomerShopPage";
import "@testing-library/jest-dom";

vi.mock("@/features/customer/queries/catalog.queries", () => ({
  useCustomerProducts: () => ({ data: { items: [{ id: "p1", name: "Linen Jacket", price: 120, imageUrl: null }], totalCount: 1 }, isLoading: false, isError: false, refetch: vi.fn() }),
  useCustomerCategories: () => ({ data: [{ id: "c1", name: "Outerwear", productCount: 1 }] }),
}));
vi.mock("@/features/customer/queries/favorites.queries", () => ({
  useToggleCustomerFavorite: () => ({ mutate: vi.fn(), isPending: false }),
}));

const renderShop = () => render(
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter>
      <CustomerShopPage />
    </MemoryRouter>
  </QueryClientProvider>,
);

describe("CustomerShopPage", () => {
  it("renders filters, search, and catalog products", () => {
    renderShop();
    expect(screen.getByRole("heading", { name: "Find your next favorite fit" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search products")).toBeInTheDocument();
    expect(screen.getByText("Outerwear (1)")).toBeInTheDocument();
    expect(screen.getByText("Linen Jacket")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search products"), { target: { value: "linen" } });
    fireEvent.click(screen.getByRole("button", { name: /Search/ }));
    expect(screen.getByDisplayValue("linen")).toBeInTheDocument();
  });
});

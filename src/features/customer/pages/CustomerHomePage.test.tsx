import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CustomerHomePage } from "@/features/customer/pages/CustomerHomePage";
import "@testing-library/jest-dom";

vi.mock("@/features/customer/queries/catalog.queries", () => ({
  useCustomerProducts: () => ({ data: { items: [{ id: "p1", name: "Jacket", price: 120, imageUrl: null }] }, isLoading: false }),
  useCustomerCategories: () => ({ data: [{ id: "c1", name: "Outerwear", productCount: 4 }] }),
  useCustomerOffers: () => ({ data: [{ id: "o1", title: "Summer edit", description: "Save on linen" }] }),
}));
vi.mock("@/features/customer/queries/favorites.queries", () => ({
  useToggleCustomerFavorite: () => ({ mutate: vi.fn(), isPending: false }),
}));

const renderHome = () => render(
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter>
      <CustomerHomePage />
    </MemoryRouter>
  </QueryClientProvider>,
);

describe("CustomerHomePage", () => {
  it("renders the real storefront sections", () => {
    renderHome();
    expect(screen.getByRole("heading", { name: /Curated outfits/ })).toBeInTheDocument();
    expect(screen.getByText("Shop by category")).toBeInTheDocument();
    expect(screen.getByText("Current offers")).toBeInTheDocument();
    expect(screen.getByText("Featured products")).toBeInTheDocument();
  });
});

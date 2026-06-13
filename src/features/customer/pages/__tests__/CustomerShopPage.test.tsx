import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerShopPage } from "@/features/customer/pages/CustomerShopPage";
import { useCustomerCategories, useCustomerProducts } from "@/features/customer/queries/catalog.queries";

vi.mock("@/features/customer/queries/catalog.queries", () => ({
  useCustomerCategories: vi.fn(),
  useCustomerProducts: vi.fn(),
}));

const mockedProducts = vi.mocked(useCustomerProducts);
const mockedCategories = vi.mocked(useCustomerCategories);
const product = { id: "p1", name: "Linen Dress", price: 90, imageUrl: null, categoryName: "Dresses" };

function renderShop(entry = "/customer/shop") {
  return render(<MemoryRouter initialEntries={[entry]}><Routes><Route path="/customer/shop" element={<CustomerShopPage />} /></Routes></MemoryRouter>);
}

beforeEach(() => {
  mockedCategories.mockReturnValue({ data: [{ id: "c1", name: "Dresses" }], isError: false, isLoading: false, refetch: vi.fn() } as never);
  mockedProducts.mockReturnValue({ data: { items: [product], totalCount: 1, pageSize: 12, totalPages: 1 }, isError: false, isLoading: false, refetch: vi.fn() } as never);
});

describe("CustomerShopPage", () => {
  it("applies filters in the URL and resets pagination", async () => {
    renderShop("/customer/shop?page=4");
    fireEvent.change(screen.getAllByLabelText(/^Category$/i)[0], { target: { value: "c1" } });
    await waitFor(() => expect(mockedProducts).toHaveBeenLastCalledWith(expect.objectContaining({ categoryId: "c1", pageNumber: 1 })));
  });

  it("clears filters while preserving shop rendering", async () => {
    renderShop("/customer/shop?category=c1&colors=Black");
    fireEvent.click(screen.getAllByRole("button", { name: /Clear filters/i })[0]);
    await waitFor(() => expect(mockedProducts).toHaveBeenLastCalledWith(expect.not.objectContaining({ categoryId: "c1" })));
  });

  it("shows loading, empty, and error states", () => {
    mockedProducts.mockReturnValueOnce({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() } as never);
    const { rerender } = renderShop();
    expect(screen.getByText(/Loading results/i)).toBeInTheDocument();
    mockedProducts.mockReturnValueOnce({ isLoading: false, isError: false, data: { items: [], totalCount: 0, totalPages: 1, pageSize: 12 }, refetch: vi.fn() } as never);
    rerender(<MemoryRouter initialEntries={["/customer/shop"]}><Routes><Route path="/customer/shop" element={<CustomerShopPage />} /></Routes></MemoryRouter>);
    expect(screen.getByText(/No products yet/i)).toBeInTheDocument();
    mockedProducts.mockReturnValueOnce({ isLoading: false, isError: true, data: undefined, refetch: vi.fn() } as never);
    rerender(<MemoryRouter initialEntries={["/customer/shop"]}><Routes><Route path="/customer/shop" element={<CustomerShopPage />} /></Routes></MemoryRouter>);
    expect(screen.getByText(/Catalog unavailable/i)).toBeInTheDocument();
  });

  it("opens and closes the mobile filter drawer", () => {
    renderShop();
    fireEvent.click(screen.getByRole("button", { name: /^Filters$/i }));
    expect(screen.getByRole("dialog", { name: /Product filters/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Close filters/i }));
    expect(screen.queryByRole("dialog", { name: /Product filters/i })).not.toBeInTheDocument();
  });
});

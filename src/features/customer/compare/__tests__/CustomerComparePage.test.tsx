import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerComparePage } from "@/features/customer/pages/CustomerComparePage";
import { useCompareStore } from "@/features/customer/compare/useCompareStore";
import { useCompareProducts } from "@/features/customer/queries/catalog.queries";

vi.mock("@/features/customer/queries/catalog.queries", () => ({
  useCompareProducts: vi.fn(),
}));

const mockedCompare = vi.mocked(useCompareProducts);

const PRODUCT_A = {
  id: "p1",
  name: "Linen Dress",
  price: 90,
  brand: "Luna",
  colors: ["White", "Beige"],
  sizes: ["S", "M"],
  categoryName: "Dresses",
  stockStatus: "In stock",
};

const PRODUCT_B = {
  id: "p2",
  name: "Silk Blouse",
  price: 60,
  discountedPrice: 45,
  brand: "Atelier",
  colors: ["Black"],
  sizes: ["XS", "S"],
  categoryName: "Tops",
  stockStatus: null,
};

function renderPage(path = "/customer/compare") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/customer/compare" element={<CustomerComparePage />} />
        <Route path="/customer/shop" element={<div>Shop page</div>} />
        <Route path="/customer/products/:id" element={<div>Product page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function setStore(ids: string[]) {
  useCompareStore.setState({ productIds: ids });
}

beforeEach(() => {
  useCompareStore.setState({ productIds: [] });
  mockedCompare.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as never);
});

describe("CustomerComparePage — empty selection", () => {
  it("shows empty state when no products are selected", () => {
    renderPage();
    expect(screen.getByText(/No products selected/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Browse products/i })).toBeInTheDocument();
  });
});

describe("CustomerComparePage — below minimum", () => {
  it("prompts to add more when only 1 product is selected", () => {
    setStore(["p1"]);
    mockedCompare.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() } as never);
    renderPage();
    expect(screen.getByText(/Add 1 more product/i)).toBeInTheDocument();
  });
});

describe("CustomerComparePage — loading state", () => {
  it("renders loading skeleton when query is in flight", () => {
    setStore(["p1", "p2"]);
    mockedCompare.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() } as never);
    renderPage();
    expect(screen.getByLabelText(/Loading comparison/i)).toBeInTheDocument();
  });
});

describe("CustomerComparePage — error state", () => {
  it("shows error state and retry button", () => {
    setStore(["p1", "p2"]);
    const refetch = vi.fn();
    mockedCompare.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch } as never);
    renderPage();
    expect(screen.getByText(/Comparison unavailable/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(refetch).toHaveBeenCalled();
  });
});

describe("CustomerComparePage — empty API result", () => {
  it("shows unavailable state when API returns no products", () => {
    setStore(["p1", "p2"]);
    mockedCompare.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() } as never);
    renderPage();
    expect(screen.getByText(/No products returned/i)).toBeInTheDocument();
  });
});

describe("CustomerComparePage — comparison table", () => {
  beforeEach(() => {
    setStore(["p1", "p2"]);
    mockedCompare.mockReturnValue({
      data: [PRODUCT_A, PRODUCT_B],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

  it("renders product names in the comparison table", () => {
    renderPage();
    expect(screen.getByText("Linen Dress")).toBeInTheDocument();
    expect(screen.getByText("Silk Blouse")).toBeInTheDocument();
  });

  it("renders attribute rows for shared fields", () => {
    renderPage();
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByText("Colors")).toBeInTheDocument();
    expect(screen.getByText("Sizes")).toBeInTheDocument();
  });

  it("removes a product from comparison when the X button is clicked", () => {
    renderPage();
    const removeBtn = screen.getByRole("button", { name: /Remove Linen Dress from comparison/i });
    fireEvent.click(removeBtn);
    expect(useCompareStore.getState().productIds).not.toContain("p1");
  });

  it("clears all products when Clear all is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Clear all/i }));
    expect(useCompareStore.getState().productIds).toHaveLength(0);
  });

  it("provides links to individual product pages", () => {
    renderPage();
    const viewLinks = screen.getAllByRole("link", { name: /View product/i });
    expect(viewLinks).toHaveLength(2);
  });
});

describe("CustomerComparePage — responsive layout", () => {
  it("wraps table in a scrollable container", () => {
    setStore(["p1", "p2"]);
    mockedCompare.mockReturnValue({ data: [PRODUCT_A, PRODUCT_B], isLoading: false, isError: false, refetch: vi.fn() } as never);
    const { container } = renderPage();
    expect(container.querySelector(".overflow-x-auto")).toBeInTheDocument();
  });
});

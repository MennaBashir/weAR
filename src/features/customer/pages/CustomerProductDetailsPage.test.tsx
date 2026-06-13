import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerProductDetailsPage } from "@/features/customer/pages/CustomerProductDetailsPage";
import type { CustomerProduct } from "@/features/customer/types/catalog";
import "@testing-library/jest-dom";

const product: CustomerProduct = {
  id: "p1",
  name: "Linen Jacket",
  brand: "weAR Studio",
  description: "A breathable tailored layer.",
  price: 100,
  discountedPrice: 75,
  currency: "USD",
  imageUrl: "https://example.com/primary.jpg",
  images: [{ url: "https://example.com/alt.jpg", altText: "Alt jacket" }],
  colors: ["Ivory", "Taupe"],
  sizes: ["S", "M"],
  features: ["Relaxed fit"],
  careInstructions: ["Cold wash"],
  views: 1234,
  isFavorite: false,
};

const state = {
  productQuery: { data: product, isLoading: false, isError: false, error: null, refetch: vi.fn() },
  similarQuery: { data: [{ ...product, id: "p2", name: "Similar Jacket" }], isLoading: false, isError: false },
  complementaryQuery: { data: [{ ...product, id: "p3", name: "Matching Pants" }], isSuccess: true, isError: false },
  sizeQuery: { data: { recommendedSize: "M", confidence: "High", explanation: "Based on your avatar." }, isLoading: false, isError: false, error: null },
  favorite: { mutate: vi.fn(), isPending: false },
};

vi.mock("@/features/customer/queries/catalog.queries", () => ({
  useCustomerProduct: () => state.productQuery,
  useSimilarCustomerProducts: () => state.similarQuery,
}));
vi.mock("@/features/customer/queries/recommendations.queries", () => ({
  useComplementaryCustomerProducts: () => state.complementaryQuery,
  useCustomerSizeRecommendation: () => state.sizeQuery,
}));
vi.mock("@/features/customer/queries/favorites.queries", () => ({
  useToggleCustomerFavorite: () => state.favorite,
}));

const renderPage = (entry = "/customer/products/p1") => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/customer/products/:productId" element={<CustomerProductDetailsPage />} />
      <Route path="/customer/try-on/:productId" element={<div>Try-on destination</div>} />
    </Routes>
  </MemoryRouter>,
);

describe("CustomerProductDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.productQuery = { data: product, isLoading: false, isError: false, error: null, refetch: vi.fn() };
    state.similarQuery = { data: [{ ...product, id: "p2", name: "Similar Jacket" }], isLoading: false, isError: false };
    state.complementaryQuery = { data: [{ ...product, id: "p3", name: "Matching Pants" }], isSuccess: true, isError: false };
    state.sizeQuery = { data: { recommendedSize: "M", confidence: "High", explanation: "Based on your avatar." }, isLoading: false, isError: false, error: null };
  });

  it("renders loading, API error retry, and not found states", () => {
    state.productQuery = { data: undefined, isLoading: true, isError: false, error: null, refetch: vi.fn() };
    const { unmount } = renderPage();
    expect(screen.getByLabelText("Loading product details")).toBeInTheDocument();
    unmount();

    const refetch = vi.fn();
    state.productQuery = { data: undefined, isLoading: false, isError: true, error: {}, refetch };
    const errored = renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
    errored.unmount();

    state.productQuery = { data: undefined, isLoading: false, isError: false, error: null, refetch: vi.fn() };
    renderPage();
    expect(screen.getByText("Product not found")).toBeInTheDocument();
  });

  it("renders price discount, image thumbnails, fallback image, and selectable variants", () => {
    const { unmount } = renderPage();
    expect(screen.getAllByText("$75.00")[0]).toBeInTheDocument();
    expect(screen.getAllByText("$100.00")[0]).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show product image 2" }));
    expect(screen.getByAltText("Alt jacket")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ivory" }));
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    expect(screen.getByRole("button", { name: "Add Linen Jacket to cart" })).not.toBeDisabled();
    unmount();

    state.productQuery = { ...state.productQuery, data: { ...product, imageUrl: null, images: [] } };
    renderPage();
    expect(screen.getByText("Image coming soon")).toBeInTheDocument();
  });

  it("disables actions until variants are selected and preserves Try-on variants", async () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Add Linen Jacket to cart" })).toBeDisabled();
    expect(screen.getByText(/Select a color and a size/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Taupe" }));
    fireEvent.click(screen.getByRole("button", { name: "S" }));
    fireEvent.click(screen.getByRole("button", { name: "Try on Linen Jacket" }));
    await waitFor(() => expect(screen.getByText("Try-on destination")).toBeInTheDocument());
  });

  it("handles favorite interaction and local cart without calling a cart API", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Add Linen Jacket to favorites" }));
    expect(state.favorite.mutate).toHaveBeenCalledWith("p1");
    fireEvent.click(screen.getByRole("button", { name: "Ivory" }));
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Linen Jacket to cart" }));
    expect(screen.getByText(/Saved locally/)).toBeInTheDocument();
  });

  it("shows and hides similar and complementary products gracefully", () => {
    const { unmount } = renderPage();
    expect(screen.getByText("Complete the Look")).toBeInTheDocument();
    expect(screen.getByText("Matching Pants")).toBeInTheDocument();
    expect(screen.getByText("Similar products")).toBeInTheDocument();
    unmount();

    state.complementaryQuery = { data: [], isSuccess: true, isError: false };
    state.similarQuery = { data: [], isLoading: false, isError: false };
    renderPage();
    expect(screen.queryByText("Complete the Look")).not.toBeInTheDocument();
    expect(screen.queryByText("Similar products")).not.toBeInTheDocument();
  });

  it("handles size recommendation success, no-avatar recovery, failure, and product-id reset", () => {
    const { unmount } = renderPage();
    expect(screen.getByText(/Recommended size: M/)).toBeInTheDocument();
    unmount();

    state.sizeQuery = { data: undefined, isLoading: false, isError: true, error: { response: { status: 404 } } };
    const noAvatar = renderPage();
    expect(screen.getByText(/No avatar found/)).toBeInTheDocument();
    noAvatar.unmount();

    state.sizeQuery = { data: undefined, isLoading: false, isError: true, error: { response: { status: 500 } } };
    const failed = renderPage();
    expect(screen.getByText(/unavailable right now/)).toBeInTheDocument();
    failed.unmount();

    render(
      <MemoryRouter initialEntries={["/customer/products/p1"]}>
        <Routes>
          <Route path="/customer/products/:productId" element={<><LinkToP4 /><CustomerProductDetailsPage /></>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ivory" }));
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("link", { name: "next product" }));
    expect(screen.getByRole("button", { name: "Add Linen Jacket to cart" })).toBeDisabled();
  });
});

function LinkToP4() { return <Link to="/customer/products/p4">next product</Link>; }

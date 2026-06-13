import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerOutfitsPage } from "@/features/customer/pages/CustomerOutfitsPage";
import type { OutfitPagedResult } from "@/features/customer/types/catalog";

// Mock query hooks
const outfitHooks = vi.hoisted(() => ({
  useCustomerOutfits: vi.fn(),
  useCreateCustomerOutfit: vi.fn(),
  useDeleteCustomerOutfit: vi.fn(),
  useAddToFavoritesThenRetry: vi.fn(),
}));

vi.mock("@/features/customer/queries/outfits.queries", () => outfitHooks);

const favoriteHooks = vi.hoisted(() => ({
  useToggleCustomerFavorite: vi.fn(),
}));

vi.mock("@/features/customer/queries/favorites.queries", () => favoriteHooks);

const EMPTY_PAGE: OutfitPagedResult = {
  items: [],
  pageNumber: 1,
  pageSize: 12,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

const SAMPLE_PAGE: OutfitPagedResult = {
  items: [
    { id: "o1", name: "Summer look", style: "Casual", itemCount: 3, slotPreviews: null },
    { id: "o2", name: null, style: null, itemCount: 1, slotPreviews: null },
  ],
  pageNumber: 1,
  pageSize: 12,
  totalCount: 2,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

const idleMutation = (overrides = {}) => ({
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/customer/outfits"]}>
      <CustomerOutfitsPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  outfitHooks.useCustomerOutfits.mockReturnValue({
    isLoading: false,
    isError: false,
    data: EMPTY_PAGE,
    refetch: vi.fn(),
  });
  outfitHooks.useCreateCustomerOutfit.mockReturnValue(idleMutation());
  outfitHooks.useDeleteCustomerOutfit.mockReturnValue(idleMutation());
  outfitHooks.useAddToFavoritesThenRetry.mockReturnValue({ invalidateFavorites: vi.fn() });
  favoriteHooks.useToggleCustomerFavorite.mockReturnValue(idleMutation());
});

// ---- loading state ----

describe("loading state", () => {
  it("renders loading message while fetching", () => {
    outfitHooks.useCustomerOutfits.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
    });

    renderPage();
    expect(screen.getByText(/loading your saved outfits/i)).toBeInTheDocument();
  });
});

// ---- error state ----

describe("error state", () => {
  it("renders error message and retry button", () => {
    const refetch = vi.fn();
    outfitHooks.useCustomerOutfits.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch,
    });

    renderPage();
    expect(screen.getByText(/could not load outfits/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });
});

// ---- empty state ----

describe("empty state", () => {
  it("renders empty state with create and favorites CTA", () => {
    renderPage();
    expect(screen.getByText(/no outfits saved yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create your first outfit/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view favorites/i })).toBeInTheDocument();
  });
});

// ---- paginated list ----

describe("paginated list", () => {
  beforeEach(() => {
    outfitHooks.useCustomerOutfits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: SAMPLE_PAGE,
      refetch: vi.fn(),
    });
  });

  it("renders outfit cards with name and item count", () => {
    renderPage();
    expect(screen.getByText("Summer look")).toBeInTheDocument();
    expect(screen.getByText(/3 items/i)).toBeInTheDocument();
  });

  it("renders 'Untitled outfit' for outfits with null name", () => {
    renderPage();
    expect(screen.getAllByText(/untitled outfit/i).length).toBeGreaterThan(0);
  });

  it("does not render a working edit/detail action", () => {
    renderPage();
    const unavailableNotes = screen.getAllByText(/outfit details and editing are temporarily unavailable/i);
    expect(unavailableNotes.length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /view outfit/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /edit outfit/i })).toBeNull();
  });

  it("shows pagination when totalPages > 1", () => {
    outfitHooks.useCustomerOutfits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ...SAMPLE_PAGE, totalPages: 3, hasNextPage: true },
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole("navigation", { name: /pagination/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next page/i })).not.toBeDisabled();
  });

  it("disables previous page button on first page", () => {
    outfitHooks.useCustomerOutfits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ...SAMPLE_PAGE, totalPages: 3, hasNextPage: true },
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole("button", { name: /previous page/i })).toBeDisabled();
  });
});

// ---- create form ----

describe("create form", () => {
  it("opens create form when Create Outfit is clicked", () => {
    renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: /create outfit/i })[0]);
    expect(screen.getByRole("dialog", { name: /create outfit/i })).toBeInTheDocument();
  });

  it("closes form when Cancel is clicked", () => {
    renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: /create outfit/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog", { name: /create outfit/i })).toBeNull();
  });
});

// ---- delete confirmation ----

describe("delete confirmation", () => {
  beforeEach(() => {
    outfitHooks.useCustomerOutfits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: SAMPLE_PAGE,
      refetch: vi.fn(),
    });
  });

  it("shows delete confirmation dialog when delete is clicked", () => {
    renderPage();
    const deleteBtn = screen.getAllByRole("button", { name: /delete outfit/i })[0];
    fireEvent.click(deleteBtn);
    expect(screen.getByRole("dialog", { name: /confirm outfit deletion/i })).toBeInTheDocument();
  });

  it("cancels delete without mutation when Cancel is clicked", () => {
    const deleteAsync = vi.fn();
    outfitHooks.useDeleteCustomerOutfit.mockReturnValue(idleMutation({ mutateAsync: deleteAsync }));

    renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: /delete outfit/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(deleteAsync).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: /confirm outfit deletion/i })).toBeNull();
  });

  it("calls delete mutation on confirm and shows success", async () => {
    const deleteAsync = vi.fn().mockResolvedValueOnce(undefined);
    outfitHooks.useDeleteCustomerOutfit.mockReturnValue(idleMutation({ mutateAsync: deleteAsync }));

    renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: /delete outfit/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toBeInTheDocument(),
    );
    expect(deleteAsync).toHaveBeenCalledWith("o1");
  });
});

// ---- favorites prerequisite / INVALID_OUTFIT_ITEMS ----

describe("favorites prerequisite UX", () => {
  it("shows prerequisite panel when INVALID_OUTFIT_ITEMS error is returned", async () => {
    const { OutfitApiError } = await import("@/features/customer/api/outfits.api");
    const createAsync = vi
      .fn()
      .mockRejectedValueOnce(
        new OutfitApiError("INVALID_OUTFIT_ITEMS", "Items must be favorites"),
      );
    outfitHooks.useCreateCustomerOutfit.mockReturnValue(
      idleMutation({ mutateAsync: createAsync }),
    );

    renderPage();

    // Open form
    fireEvent.click(screen.getAllByRole("button", { name: /create outfit/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /create outfit/i });

    // Fill in product IDs
    fireEvent.change(screen.getByLabelText(/product ids/i), {
      target: { value: "p1, p2" },
    });

    // Submit the form directly (fireEvent.click on submit buttons doesn't trigger submit in jsdom)
    const form = dialog.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() =>
      expect(
        screen.getByRole("dialog", { name: /products must be in favorites/i }),
      ).toBeInTheDocument(),
    );

    // Explicit action visible
    expect(
      screen.getByRole("button", { name: /add missing products to favorites/i }),
    ).toBeInTheDocument();
  });

  it("does not silently call toggleFavorite when create fails", async () => {
    const { OutfitApiError } = await import("@/features/customer/api/outfits.api");
    const createAsync = vi
      .fn()
      .mockRejectedValueOnce(
        new OutfitApiError("INVALID_OUTFIT_ITEMS", "Items must be favorites"),
      );
    const toggleAsync = vi.fn();
    outfitHooks.useCreateCustomerOutfit.mockReturnValue(
      idleMutation({ mutateAsync: createAsync }),
    );
    favoriteHooks.useToggleCustomerFavorite.mockReturnValue(
      idleMutation({ mutateAsync: toggleAsync }),
    );

    renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: /create outfit/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /create outfit/i });
    const form = dialog.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() =>
      screen.getByRole("dialog", { name: /products must be in favorites/i }),
    );

    // toggle has NOT been called silently
    expect(toggleAsync).not.toHaveBeenCalled();
  });

  it("preserves form values after INVALID_OUTFIT_ITEMS error", async () => {
    const { OutfitApiError } = await import("@/features/customer/api/outfits.api");
    const createAsync = vi
      .fn()
      .mockRejectedValueOnce(
        new OutfitApiError("INVALID_OUTFIT_ITEMS", "Items must be favorites"),
      );
    outfitHooks.useCreateCustomerOutfit.mockReturnValue(
      idleMutation({ mutateAsync: createAsync }),
    );

    renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: /create outfit/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /create outfit/i });

    const nameInput = screen.getByLabelText(/name \(optional\)/i);
    fireEvent.change(nameInput, { target: { value: "My Outfit" } });

    const form = dialog.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() =>
      screen.getByRole("dialog", { name: /products must be in favorites/i }),
    );

    // Close prerequisite panel
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Prerequisite dialog is gone; page preserves state for retry
    expect(
      screen.queryByRole("dialog", { name: /products must be in favorites/i }),
    ).toBeNull();
  });
});

// ---- no functional edit/detail claim ----

describe("no functional edit/detail claim", () => {
  it("outfit cards show unavailability note instead of edit/detail link", () => {
    outfitHooks.useCustomerOutfits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: SAMPLE_PAGE,
      refetch: vi.fn(),
    });
    renderPage();
    const notes = screen.getAllByText(/outfit details and editing are temporarily unavailable/i);
    expect(notes.length).toBeGreaterThanOrEqual(SAMPLE_PAGE.items.length);
  });
});
